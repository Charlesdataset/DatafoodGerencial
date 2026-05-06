// hooks/useEnhancedFormValidation.ts
import { useCallback, useState } from "react";

type Validator<T> = {
  [K in keyof T]?: (value: T[K], formData: T) => string | undefined;
};

type ValidationOptions = {
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
};

export function useEnhancedFormValidation<T extends Record<string, any>>(
  initialData: T,
  validators: Validator<T>,
  options: ValidationOptions = { validateOnBlur: true, validateOnChange: false }
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [formData, setFormData] = useState<T>(initialData);

  const validateField = useCallback(
    (field: keyof T, value: any, currentFormData?: T) => {
      const validator = validators[field];
      const dataToUse = currentFormData || formData;

      if (validator) {
        const error = validator(value, dataToUse);

        setErrors((prev) => {
          const newErrors = { ...prev };

          if (error) {
            newErrors[field] = error;
          } else {
            delete newErrors[field];
          }

          return newErrors;
        });

        return !error;
      }

      return true;
    },
    [validators, formData]
  );

  const validateAll = useCallback(
    (data: T) => {
      const newErrors: Partial<Record<keyof T, string>> = {};
      let isValid = true;

      for (const field in validators) {
        const validator = validators[field];
        if (validator) {
          const error = validator(data[field], data);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [validators]
  );

  const handleBlur = useCallback(
    (field: keyof T, value: any) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (options.validateOnBlur) {
        validateField(field, value);
      }
    },
    [options.validateOnBlur, validateField]
  );

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      if (options.validateOnChange) {
        validateField(field, value, newFormData);
      }

      return newFormData;
    },
    [formData, options.validateOnChange, validateField]
  );

  const clearErrors = () => setErrors({});
  const clearTouched = () => setTouched({});

  const resetForm = (newData?: T) => {
    setFormData(newData || initialData);
    clearErrors();
    clearTouched();
  };

  return {
    errors,
    touched,
    formData,
    validateField,
    validateAll,
    handleBlur,
    handleChange,
    clearErrors,
    clearTouched,
    resetForm,
    setFormData,
  };
}
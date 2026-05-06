// hooks/useFormValidation.ts
import { useCallback, useState } from "react";

type Validator<T> = {
  [K in keyof T]?: (value: T[K]) => string | undefined;
};

export function useFormValidation<T extends Record<string, any>>(validators: Validator<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: any) => {
      const validator = validators[field];

      if (validator) {
        const error = validator(value);

        setErrors((prev) => {
          const newErrors = { ...prev };

          if (error) {
            newErrors[field] = error;
          } else {
            delete newErrors[field]; // 🔥 REMOVE o erro de verdade
          }

          return newErrors;
        });

        return !error;
      }

      return true;
    },
    [validators],
  );

  const validateAll = useCallback(
    (data: T) => {
      const newErrors: Partial<Record<keyof T, string>> = {};
      let isValid = true;

      for (const field in validators) {
        const validator = validators[field];
        if (validator) {
          const error = validator(data[field]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [validators],
  );

  const handleBlur = (field: keyof T, value: any) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const clearErrors = () => setErrors({});
  const clearTouched = () => setTouched({});

  return {
    errors,
    touched,
    validateField,
    validateAll,
    handleBlur,
    clearErrors,
    clearTouched,
  };
}

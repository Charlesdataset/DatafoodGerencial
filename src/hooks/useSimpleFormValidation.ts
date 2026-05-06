// hooks/useSimpleFormValidation.ts
// Hook super simples para validar formulários sem libs pesadas
// Ideal para 500 telas - fácil de usar e reutilizar

import { useCallback, useState } from "react";

type Validator<T> = {
  [K in keyof T]?: (value: T[K], formData: T) => string | undefined;
};

export function useSimpleFormValidation<T extends Record<string, any>>(
  initialData: T,
  validators: Validator<T>,
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [formData, setFormData] = useState<T>(initialData);

  // Valida um campo específico
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

        return !error; // true se válido
      }

      return true;
    },
    [validators, formData],
  );

  // Valida todos os campos
  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field in validators) {
      const validator = validators[field];
      if (validator) {
        const error = validator(formData[field], formData);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    // Marca todos como touched para mostrar erros
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const field in validators) {
      allTouched[field] = true;
    }
    setTouched(allTouched);

    return isValid;
  }, [validators, formData]);

  // Handler para blur (foco sai do campo)
  const handleBlur = useCallback(
    (field: keyof T, value: any) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, value);
    },
    [validateField],
  );

  // Handler para change (atualiza valor e valida se necessário)
  const handleChange = useCallback(
    (field: keyof T, value: any, validateOnChange = false) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);

      if (validateOnChange) {
        validateField(field, value, newFormData);
      }

      return newFormData;
    },
    [formData, validateField],
  );

  // Limpa todos os erros
  const clearErrors = () => setErrors({});

  // Limpa todos os touched
  const clearTouched = () => setTouched({});

  // Reseta o formulário
  const resetForm = (newData?: T) => {
    setFormData(newData || initialData);
    clearErrors();
    clearTouched();
  };

  // Helper para saber se formulário está válido
  const isValid = Object.keys(errors).length === 0;

  return {
    // Estado
    errors,
    touched,
    formData,

    // Helpers
    isValid,

    // Ações
    validateField,
    validateAll,
    handleBlur,
    handleChange,
    clearErrors,
    clearTouched,
    resetForm,
    setFormData,

    // Shortcuts para forms comuns
    textFieldProps: (
      field: keyof T,
      options?: { validateOnChange?: boolean },
    ) => {
      const rawValue = formData[field];
      let stringValue: string = "";

      if (rawValue == null) {
        stringValue = "";
      } else if (typeof rawValue === "string") {
        stringValue = rawValue;
      } else if (
        rawValue &&
        typeof rawValue === "object" &&
        Object.prototype.toString.call(rawValue) === "[object Date]"
      ) {
        stringValue = (rawValue as Date).toISOString();
      } else {
        stringValue = String(rawValue);
      }

      return {
        value: stringValue,
        error: touched[field] ? errors[field] : undefined,
        onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
          handleBlur(field, e.target.value),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          handleChange(field, e.target.value, options?.validateOnChange),
      };
    },

    dateFieldProps: (
      field: keyof T,
      options?: { validateOnChange?: boolean },
    ) => {
      const rawValue = formData[field];
      let dateValue: Date | null = null;

      if (
        rawValue &&
        typeof rawValue === "object" &&
        Object.prototype.toString.call(rawValue) === "[object Date]"
      ) {
        dateValue = rawValue as Date;
      } else if (typeof rawValue === "string" && rawValue) {
        const parsed = new Date(rawValue);
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed;
        }
      } else if (
        rawValue &&
        typeof rawValue === "object" &&
        "getTime" in rawValue
      ) {
        // Fallback para objetos que parecem Date
        dateValue = rawValue as Date;
      }

      return {
        value: dateValue,
        error: touched[field] ? errors[field] : undefined,
        onBlur: (value: Date | null) => handleBlur(field, value),
        onChange: (value: Date | null) =>
          handleChange(field, value, options?.validateOnChange),
      };
    },
  };
}

// Exemplo de uso:
/*
const validators = {
  title: formValidators.compose(
    formValidators.required(),
    formValidators.minLength(3)
  ),
  email: formValidators.compose(
    formValidators.required(),
    formValidators.email()
  ),
  startDate: formValidators.dateRequired(),
  endDate: formValidators.compose(
    formValidators.dateRequired(),
    formValidators.dateAfter('startDate', (data) => data.startDate)
  ),
};

const { errors, touched, validateAll, textFieldProps, dateFieldProps } =
  useSimpleFormValidation(initialData, validators);

// No JSX:
<TextBox {...textFieldProps('title')} label="Título" />
<DatePicker {...dateFieldProps('startDate')} label="Data Início" />
*/

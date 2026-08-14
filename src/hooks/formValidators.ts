// hooks/formValidators.ts

export const formValidators = {
  required:
    (message = "Campo obrigatório") =>
    (value: any) => {
      if (value === null || value === undefined || value === "") return message;
      if (typeof value === "string" && value.trim() === "") return message;
      return undefined;
    },

  minLength:
    (min: number, message = `Mínimo de ${min} caracteres`) =>
    (value: string) => {
      if (value && value.length < min) return message;
      return undefined;
    },

  maxLength:
    (max: number, message = `Máximo de ${max} caracteres`) =>
    (value: string) => {
      if (value && value.length > max) return message;
      return undefined;
    },

  email:
    (message = "Email inválido") =>
    (value: string) => {
      if (!value) return undefined;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) return message;
      return undefined;
    },

  dateRequired:
    (message = "Data obrigatória") =>
    (value: Date | null | string) => {
      if (!value) return message;
      if (typeof value === "string" && value.trim() === "") return message;
      return undefined;
    },

  toDate: (value: Date | null | string): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  },

  dateAfter:
    (getOtherValue: (formData: any) => Date | null | string, message = "Data deve ser maior que data anterior") =>
    (value: Date | null | string, formData: any) => {
      if (!value) return undefined;

      const otherValue = getOtherValue(formData);
      if (!otherValue) return undefined;

      const dateValue = formValidators.toDate(value);
      const dateOther = formValidators.toDate(otherValue);

      if (!dateValue || !dateOther) return undefined;
      if (dateValue <= dateOther) return message;
      return undefined;
    },

  dateBefore:
    (getOtherValue: (formData: any) => Date | null | string, message = "Data deve ser menor que data posterior") =>
    (value: Date | null | string, formData: any) => {
      if (!value) return undefined;

      const otherValue = getOtherValue(formData);
      if (!otherValue) return undefined;

      const dateValue = formValidators.toDate(value);
      const dateOther = formValidators.toDate(otherValue);

      if (!dateValue || !dateOther) return undefined;
      if (dateValue >= dateOther) return message;
      return undefined;
    },

  minNumber:
    (min: number, message = `Valor mínimo: ${min}`) =>
    (value: number) => {
      if (value === null || value === undefined) return undefined;
      if (value < min) return message;
      return undefined;
    },

  maxNumber:
    (max: number, message = `Valor máximo: ${max}`) =>
    (value: number) => {
      if (value === null || value === undefined) return undefined;
      if (value > max) return message;
      return undefined;
    },

  regex:
    (pattern: RegExp, message = "Formato inválido") =>
    (value: string) => {
      if (!value) return undefined;
      if (!pattern.test(value)) return message;
      return undefined;
    },

  compose:
    (...validators: Array<(value: any, formData?: any) => string | undefined>) =>
    (value: any, formData?: any) => {
      for (const validator of validators) {
        const error = validator(value, formData);
        if (error) return error;
      }
      return undefined;
    },

  // 🔥 VALIDAÇÃO DE INSCRIÇÃO ESTADUAL (CONDICIONAL COM A UF)
  inscricaoEstadual:
    (message = "Inscrição Estadual inválida") =>
    (value: string, formData?: any) => {
      if (!formData?.uf) {
        return undefined; // Não valida se não tem UF
      }
      if (!value || value.trim() === "") {
        return "Inscrição Estadual é obrigatória";
      }
      const numeros = value.replace(/\D/g, "");
      if (numeros.length < 3) {
        return message;
      }
      return undefined;
    },
};

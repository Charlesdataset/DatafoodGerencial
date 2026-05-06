import dayjs from "dayjs";

export const formatValue = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDateToString = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const [date, time] = dateStr.split(" ");
  const [year, month, day] = date.split("-");
  const [hour, minute] = time?.split(":") || ["00", "00"];
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
  );
};

export const formatDateTimes = (date) => {
  return date && dayjs(date).isValid()
    ? dayjs(date).format("YYYY-MM-DDTHH:mm:ssZ")
    : "";
};

export const maskCpf = (value: string): string => {
  const clean = unMask(value);
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  }
  return maskCnpj(value);
};

export const maskCnpj = (value: string): string => {
  const clean = unMask(value);
  return clean
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};
export function unMask(v: string) {
  v = v.replace(/\D/g, ""); //Remove tudo o que não é dígito
  return v;
}

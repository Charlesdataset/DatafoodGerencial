// src/services/cepService.ts
import { toast } from "react-toastify";

export const fetchAddressByCep = async (cep: string) => {
  const cepClean = cep.replace(/\D/g, "");
  if (cepClean.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
    const data = await response.json();
    if (data.erro) {
      toast.warning("CEP não encontrado!");
      return null;
    }
    return {
      endereco: (data.logradouro || "").toUpperCase(),
      bairro: (data.bairro || "").toUpperCase(),
      cidade: (data.localidade || "").toUpperCase(),
      uf: (data.uf || "").toUpperCase(),
      complemento: (data.complemento || "").toUpperCase(),
    };
  } catch {
    toast.error("Erro ao buscar CEP!");
    return null;
  }
};

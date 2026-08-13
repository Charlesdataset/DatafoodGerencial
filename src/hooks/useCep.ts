// src/hooks/useCep.ts
import { useState } from "react";
import { fetchAddressByCep } from "../services/cepService";

export const useCep = () => {
  const [loadingCep, setLoadingCep] = useState(false);

  const buscarCep = async (cep: string, setFormData: any) => {
    const cepClean = cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return;

    setLoadingCep(true);
    const dados = await fetchAddressByCep(cep);
    if (dados) {
      setFormData((prev: any) => ({
        ...prev,
        endereco: dados.endereco.toUpperCase(),
        bairro: dados.bairro.toUpperCase(),
        cidade: dados.cidade.toUpperCase(),
        uf: dados.uf.toUpperCase(),
        complemento: dados.complemento ? dados.complemento.toUpperCase() : "",
      }));
    }
    setLoadingCep(false);
  };

  return { loadingCep, buscarCep };
};

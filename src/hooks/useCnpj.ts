// src/hooks/useCnpj.ts
import { useState } from "react";
import { maskCep, maskPhone, unMask } from "../utils/format";
import { toast } from "react-toastify";

export const useCnpj = () => {
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const buscarCnpj = async (cnpj: string, setFormData: any) => {
    const cnpjClean = unMask(cnpj);

    if (cnpjClean.length !== 14) {
      toast.warning("CNPJ inválido! Digite 14 números");
      return;
    }

    if (!/^\d{14}$/.test(cnpjClean)) {
      toast.warning("CNPJ inválido! Use apenas números");
      return;
    }

    setLoadingCnpj(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);

      if (response.status === 404 || response.status === 400) {
        toast.warning("CNPJ não encontrado ou inválido. Verifique os dados e tente novamente.");
        setLoadingCnpj(false);
        return;
      }

      if (!response.ok) {
        toast.error(`Erro ao buscar CNPJ: ${response.status}`);
        setLoadingCnpj(false);
        return;
      }

      const data = await response.json();

      if (!data.cnpj) {
        toast.warning("CNPJ não encontrado ou dados incompletos");
        setLoadingCnpj(false);
        return;
      }

      const novosDados: any = {
        razao_social: data.razao_social?.toUpperCase() || "",
        fantasia: data.nome_fantasia?.toUpperCase() || "",
        cep: maskCep(data.cep?.toString() || ""),
        endereco: `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.toUpperCase().trim(),
        numero: data.numero || "",
        bairro: data.bairro?.toUpperCase() || "",
        cidade: data.municipio?.toUpperCase() || "",
        uf: data.uf?.toUpperCase() || "",
        complemento: data.complemento?.toUpperCase() || "",
        telefone: maskPhone(data.ddd_telefone_1 || ""),
        cnae: data.cnae_fiscal?.toString() || "",
      };

      setFormData((prev: any) => ({
        ...prev,
        ...novosDados,
      }));

      toast.success("Dados carregados com sucesso!");
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        toast.error("Erro de rede! Verifique sua conexão com a internet");
      } else {
        toast.error("Erro inesperado ao buscar CNPJ. Tente novamente");
      }
    } finally {
      setLoadingCnpj(false);
    }
  };

  return { loadingCnpj, buscarCnpj };
};

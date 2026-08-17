// src/hooks/useCnpj.ts
import { useState } from "react";
import { maskCep, maskPhone, unMask } from "../utils/format";
import { toast } from "react-toastify";

export const useCnpj = () => {
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const buscarCnpj = async (cnpj: string, setFormData: any) => {
    const cnpjClean = unMask(cnpj);

    if (cnpjClean.length !== 14) {
      toast.warning("CNPJ inválido!");
      return;
    }

    setLoadingCnpj(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.warning("CNPJ não encontrado");
        } else {
          toast.error("Erro ao buscar CNPJ");
        }
        setLoadingCnpj(false);
        return;
      }

      const data = await response.json();

      setFormData((prev: any) => ({
        ...prev,
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
        email: data.email || "",
        inscricao_estadual: data.inscricao_estadual || "",
        cnae: data.cnae_fiscal || "",
      }));

      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao pesquisar CNPJ!");
    } finally {
      setLoadingCnpj(false);
    }
  };

  return { loadingCnpj, buscarCnpj };
};

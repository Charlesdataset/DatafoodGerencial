import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import TextBox from "../../../components/Inputs/TextBox/TextBox";
import Select from "../../../components/Inputs/Select/Select";
import Fluid from "../../../components/Layout/Fluid";
import { useNavigation } from "../../../contexts/NavigationContext";
import { formValidators } from "../../../hooks/formValidators";
import { useSimpleFormValidation } from "../../../hooks/useSimpleFormValidation";
import { api } from "../../../services/api";
import type { Cidade } from "../types/Cidade";

interface CidadeRegProps {
  onBack: () => void;
}

const ufOptions = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AP", label: "AP" },
  { value: "AM", label: "AM" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MT", label: "MT" },
  { value: "MS", label: "MS" },
  { value: "MG", label: "MG" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PR", label: "PR" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RS", label: "RS" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "SC", label: "SC" },
  { value: "SP", label: "SP" },
  { value: "SE", label: "SE" },
  { value: "TO", label: "TO" },
];

const validators = {
  nome: formValidators.compose(
    formValidators.required("Nome é obrigatório"),
    formValidators.maxLength(100, "Nome deve ter no máximo 100 caracteres")
  ),
  uf: formValidators.required("UF é obrigatória"),
};

const CidadeReg: React.FC<CidadeRegProps> = ({ onBack }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { emit, subscribe } = useNavigation();
  const isEditing = Boolean(location.state?.row);

  const initialFormData: Cidade = {
    id_cidade: 0,
    nome: "",
    uf: "",
    codigo_ibge: undefined,
    ativo: true,
  };

  const validation = useSimpleFormValidation(initialFormData, validators);
  const { validateAll, formData, textFieldProps, setFormData } = validation;

  const nomeField = textFieldProps("nome");
  const ufField = textFieldProps("uf");

  const dataRoute = JSON.parse(localStorage.getItem('dataRoute') || '{}');
  const podeEditar = dataRoute.editar || false;
  const podeEntrar = dataRoute.entrar || false;

  useEffect(() => {
    if (isEditing && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      onBack();
      return;
    }
  }, [isEditing, podeEntrar]);

  useEffect(() => {
    if (location.state?.row) {
      const row = location.state.row as Cidade;
      setFormData({
        ...row,
      });
    }
  }, [location.state]);

  useEffect(() => {
    const unsubscribeOnCommit = subscribe("onRequestCommit", () => {
      if (formRef.current) {
        formRef.current.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    });
    return () => unsubscribeOnCommit();
  }, []);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (isEditing && !podeEditar) {
      toast.error("Você não tem permissão para editar cidades");
      emit("isCommited", false);
      return;
    }

    const isValid = validateAll();
    if (!isValid) {
      toast.error("Preencha todos os campos obrigatórios corretamente.");
      emit("isCommited", false);
      return;
    }

    emit("isCommited", false);

    try {
      const payload = {
        ...formData,
      };

      const response = isEditing
        ? await api.put("/gerencial/cidade", payload)
        : await api.post("/gerencial/cidade", payload);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          isEditing ? "Cidade atualizada com sucesso" : "Cidade cadastrada com sucesso"
        );
        emit("isCommited", true);
        onBack();
      } else {
        toast.error("Erro ao salvar cidade");
        emit("isCommited", false);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Erro ao salvar cidade");
      } else {
        toast.error("Erro ao salvar cidade");
      }
      emit("isCommited", false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card>
        <Card.Body>
          <Fluid xs={[100]} rowGap={16}>
            <Fluid xs={[50, 50]} rowGap={16}>
              <TextBox
                label="Nome"
                required
                className="mb-0"
                isFormField={false}
                maxLength={100}
                disabled={isEditing && !podeEditar}
                {...nomeField}
              />

              <Select
                label="UF"
                required
                className="mb-0"
                value={formData.uf}
                options={ufOptions}
                disabled={isEditing && !podeEditar}
                onChange={(value: string) => {
                  setFormData({ ...formData, uf: value });
                }}
                error={ufField.error}
              />
            </Fluid>

            <Fluid xs={[50, 50]} rowGap={16}>
              <TextBox
                label="Código IBGE"
                className="mb-0"
                isFormField={false}
                type="number"
                disabled={isEditing && !podeEditar}
                value={formData.codigo_ibge || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    codigo_ibge: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Opcional"
              />

              <Select
                label="Status"
                className="mb-0"
                value={formData.ativo ? "true" : "false"}
                options={[
                  { value: "true", label: "Ativo" },
                  { value: "false", label: "Inativo" },
                ]}
                disabled={isEditing && !podeEditar}
                onChange={(value: string) => {
                  setFormData({ ...formData, ativo: value === "true" });
                }}
              />
            </Fluid>
          </Fluid>
        </Card.Body>
      </Card>
    </form>
  );
};

export default CidadeReg;
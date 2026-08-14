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
import type { Plano, PlanoFormData } from "../types/Plano";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCancel } from "@fortawesome/free-solid-svg-icons";
import { Flex } from "../../../components/Layout";

interface PlanoRegProps {
  onBack: () => void;
}

const validators = {
  descricao: formValidators.compose(
    formValidators.required("Descrição é obrigatória"),
    formValidators.maxLength(100, "Descrição deve ter no máximo 100 caracteres")
  ),
  caixasMax: (value: any) => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return "Caixas é obrigatório";
    }
    if (Number(value) < 1) {
      return "Caixas deve ser no mínimo 1";
    }
    return "";
  },
  usuariosMax: (value: any) => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return "Usuários é obrigatório";
    }
    if (Number(value) < 1) {
      return "Usuários deve ser no mínimo 1";
    }
    return "";
  },
  valorMensal: (value: any) => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return "Valor mensal é obrigatório";
    }
    if (Number(value) < 0) {
      return "Valor mensal deve ser no mínimo 0";
    }
    return "";
  },
};

const PlanoReg: React.FC<PlanoRegProps> = ({ onBack }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { emit, subscribe } = useNavigation();
  const isEditing = Boolean(location.state?.row);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initialFormData: PlanoFormData = {
    id_plano: 0,
    descricao: "",
    resumo: "",
    caixasMax: null as any,
    usuariosMax: null as any,
    valorMensal: null as any,
    diasValidade: null,
    ordem: null as any,
    ativo: true,
    recursos: [],
  };

  const validation = useSimpleFormValidation(initialFormData, validators);
  const { validateAll, formData, textFieldProps, setFormData } = validation;

  const descricaoField = textFieldProps("descricao");
  const caixasField = textFieldProps("caixasMax");
  const usuariosField = textFieldProps("usuariosMax");
  const valorField = textFieldProps("valorMensal");

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
      const row = location.state.row as Plano;
      setFormData({
        id_plano: row.id_plano,
        descricao: row.descricao,
        resumo: row.resumo || "",
        caixasMax: row.caixasMax,
        usuariosMax: row.usuariosMax,
        valorMensal: row.valorMensal,
        diasValidade: row.diasValidade || null,
        ordem: row.ordem || 0,
        ativo: row.ativo,
        recursos: [],
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
      toast.error("Você não tem permissão para editar planos");
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
        descricao: formData.descricao,
        resumo: formData.resumo || "",
        caixasMax: formData.caixasMax || 0,
        usuariosMax: formData.usuariosMax || 0,
        valorMensal: formData.valorMensal || 0,
        diasValidade: formData.diasValidade || null,
        ordem: formData.ordem || 0,
        ativo: formData.ativo,
        recursos: formData.recursos,
      };

      const response = isEditing
        ? await api.put("/gerencial/planos", { ...payload, id_plano: formData.id_plano })
        : await api.post("/gerencial/planos", payload);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          isEditing ? "Plano atualizado com sucesso" : "Plano cadastrado com sucesso"
        );
        emit("isCommited", true);
        onBack();
      } else {
        toast.error("Erro ao salvar plano");
        emit("isCommited", false);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Erro ao salvar plano");
      } else {
        toast.error("Erro ao salvar plano");
      }
      emit("isCommited", false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card>
        <Card.Body>
          <Fluid xs={[100]} rowGap={24}>
            {isMobile ? (
              <Fluid xs={[100]} rowGap={16}>
                {/* LINHA 1: Descrição (mobile) */}
                <Fluid xs={[100]} rowGap={16}>
                  <TextBox
                    label="Descrição"
                    required
                    className="mb-0"
                    isFormField={false}
                    maxLength={100}
                    disabled={isEditing && !podeEditar}
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    error={descricaoField.error}
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 2: Resumo (mobile) */}
                <Fluid xs={[100]} rowGap={16}>
                  <TextBox
                    label="Resumo"
                    className="mb-0"
                    isFormField={false}
                    maxLength={200}
                    disabled={isEditing && !podeEditar}
                    value={formData.resumo}
                    onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                    placeholder="Breve descrição do plano"
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 3: Caixas + Usuários (mobile) */}
                <Fluid xs={[50, 50]} rowGap={16}>
                  <TextBox
                    label="Caixas"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.caixasMax === null ? "" : formData.caixasMax}
                    onChange={(e) => setFormData({ ...formData, caixasMax: e.target.value ? Number(e.target.value) : null })}
                    error={caixasField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Usuários"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.usuariosMax === null ? "" : formData.usuariosMax}
                    onChange={(e) => setFormData({ ...formData, usuariosMax: e.target.value ? Number(e.target.value) : null })}
                    error={usuariosField.error}
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 4: Valor + Dias (mobile) */}
                <Fluid xs={[50, 50]} rowGap={16}>
                  <TextBox
                    label="Valor (R$)"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    step="0.01"
                    disabled={isEditing && !podeEditar}
                    value={formData.valorMensal === null ? "" : formData.valorMensal}
                    onChange={(e) => setFormData({ ...formData, valorMensal: e.target.value ? Number(e.target.value) : null })}
                    error={valorField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Dias"
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.diasValidade === null ? "" : formData.diasValidade}
                    onChange={(e) => setFormData({ ...formData, diasValidade: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Opcional"
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 5: Status + Ordem (mobile) */}
                <Fluid xs={[50, 50]} rowGap={16}>
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

                  <TextBox
                    label="Ordem"
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.ordem === null ? "" : formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="0"
                    onBlur={() => {}}
                  />
                </Fluid>
              </Fluid>
            ) : (
              <Fluid xs={[100]} rowGap={16}>
                {/* LINHA 1: Descrição e Resumo (desktop) */}
                <Fluid xs={[50, 50]} rowGap={16}>
                  <TextBox
                    label="Descrição"
                    required
                    className="mb-0"
                    isFormField={false}
                    maxLength={100}
                    disabled={isEditing && !podeEditar}
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    error={descricaoField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Resumo"
                    className="mb-0"
                    isFormField={false}
                    maxLength={200}
                    disabled={isEditing && !podeEditar}
                    value={formData.resumo}
                    onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                    placeholder="Breve descrição do plano"
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 2: Caixas, Usuários, Valor, Dias, Status, Ordem (desktop) */}
                <Fluid xs={[16.66, 16.66, 16.66, 16.66, 16.66, 16.66]} rowGap={16}>
                  <TextBox
                    label="Caixas"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.caixasMax === null ? "" : formData.caixasMax}
                    onChange={(e) => setFormData({ ...formData, caixasMax: e.target.value ? Number(e.target.value) : null })}
                    error={caixasField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Usuários"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.usuariosMax === null ? "" : formData.usuariosMax}
                    onChange={(e) => setFormData({ ...formData, usuariosMax: e.target.value ? Number(e.target.value) : null })}
                    error={usuariosField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Valor (R$)"
                    required
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    step="0.01"
                    disabled={isEditing && !podeEditar}
                    value={formData.valorMensal === null ? "" : formData.valorMensal}
                    onChange={(e) => setFormData({ ...formData, valorMensal: e.target.value ? Number(e.target.value) : null })}
                    error={valorField.error}
                    onBlur={() => {}}
                  />

                  <TextBox
                    label="Dias"
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.diasValidade === null ? "" : formData.diasValidade}
                    onChange={(e) => setFormData({ ...formData, diasValidade: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Opcional"
                    onBlur={() => {}}
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

                  <TextBox
                    label="Ordem"
                    className="mb-0"
                    isFormField={false}
                    type="number"
                    disabled={isEditing && !podeEditar}
                    value={formData.ordem === null ? "" : formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="0"
                    onBlur={() => {}}
                  />
                </Fluid>
              </Fluid>
            )}
          </Fluid>
        </Card.Body>
      </Card>
    </form>
  );
};

export default PlanoReg;

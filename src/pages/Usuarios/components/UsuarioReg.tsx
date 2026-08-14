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
import type { Usuario } from "../types/Usuario.ts";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCancel } from "@fortawesome/free-solid-svg-icons";
import { Flex } from "../../../components/Layout";
import { Switch } from "../../../components/Switch/Switch";

interface UsuarioRegProps {
  onBack: () => void;
}

const franquiaOptions = [
  { value: "1", label: "DATASET" },
  { value: "2", label: "ARS" },
  { value: "3", label: "GIGABYTE" },
];

const validatorsCadastro = {
  nome_usuario: formValidators.compose(
    formValidators.required("Nome é obrigatório"),
    formValidators.maxLength(100, "Nome deve ter no máximo 100 caracteres")
  ),
  id_franquia: formValidators.required("Franquia é obrigatória"),
  senha: formValidators.compose(
    formValidators.required("Senha é obrigatória"),
    formValidators.minLength(3, "Senha deve ter no mínimo 3 caracteres")
  ),
};

const validatorsEdicao = {
  nome_usuario: formValidators.compose(
    formValidators.required("Nome é obrigatório"),
    formValidators.maxLength(100, "Nome deve ter no máximo 100 caracteres")
  ),
  id_franquia: formValidators.required("Franquia é obrigatória"),
  senha: formValidators.compose(
    formValidators.minLength(3, "Senha deve ter no mínimo 3 caracteres")
  ),
};

const UsuarioReg: React.FC<UsuarioRegProps> = ({ onBack }) => {
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

  const initialFormData = {
    id_usuario: 0,
    nome_usuario: "",
    id_franquia: 1,
    senha: "",
    ativo: true,
    permissoes: {
      entrar: false,
      editar: false,
      excluir: false,
      incluir: false,
      relatorio: false,
    },
  };

  const validation = useSimpleFormValidation(
    initialFormData, 
    isEditing ? validatorsEdicao : validatorsCadastro
  );
  const { validateAll, formData, textFieldProps, setFormData } = validation;

  const nomeField = textFieldProps("nome_usuario");
  const franquiaField = textFieldProps("id_franquia");
  const senhaField = textFieldProps("senha");

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
      const row = location.state.row as Usuario;
      setFormData({
        id_usuario: row.idUsuario,
        nome_usuario: row.nome,
        id_franquia: row.franquiaId,
        senha: "",
        ativo: row.ativo,
        permissoes: {
          entrar: row.entrar || false,
          editar: row.editar || false,
          excluir: row.excluir || false,
          incluir: row.incluir || false,
          relatorio: row.relatorio || false,
        },
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
      toast.error("Você não tem permissão para editar usuários");
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
        nome_usuario: formData.nome_usuario,
        id_franquia: formData.id_franquia,
        senha: formData.senha,
        permissoes: formData.permissoes,
      };

      const response = isEditing
        ? await api.put("/gerencial/usuarios", { ...payload, id_usuario: formData.id_usuario })
        : await api.post("/gerencial/usuarios", payload);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          isEditing ? "Usuário atualizado com sucesso" : "Usuário cadastrado com sucesso"
        );
        emit("isCommited", true);
        onBack();
      } else {
        toast.error("Erro ao salvar usuário");
        emit("isCommited", false);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Erro ao salvar usuário");
      } else {
        toast.error("Erro ao salvar usuário");
      }
      emit("isCommited", false);
    }
  };

  const handlePermissaoChange = (key: string, value: boolean) => {
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [key]: value,
      },
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card>
        <Card.Body>
          <Fluid xs={[100]} rowGap={24}>
            {isMobile ? (
              <Fluid xs={[100]} rowGap={24}>
                {/* LINHA 1: Nome (mobile) */}
                <Fluid xs={[100]} rowGap={16}>
                  <TextBox
                    label="Nome"
                    required
                    className="mb-0"
                    isFormField={false}
                    maxLength={100}
                    disabled={isEditing && !podeEditar}
                    value={formData.nome_usuario}
                    onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                    error={nomeField.error}
                    onBlur={() => {}}
                  />
                </Fluid>

                {/* LINHA 2: Franquia + Senha + Status (mobile) */}
                <Fluid xs={[33.33, 33.33, 33.33]} rowGap={16}>
                  <Select
                    label="Franquia"
                    required
                    className="mb-0"
                    value={String(formData.id_franquia)}
                    options={franquiaOptions}
                    disabled={isEditing && !podeEditar}
                    onChange={(value: string) => {
                      setFormData({ ...formData, id_franquia: parseInt(value) });
                    }}
                    error={franquiaField.error}
                  />

                  <TextBox
                    label="Senha"
                    required={!isEditing}
                    className="mb-0"
                    isFormField={false}
                    type="password"
                    maxLength={50}
                    placeholder={isEditing ? "Deixe em branco para manter" : "Digite a senha"}
                    disabled={isEditing && !podeEditar}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    error={senhaField.error}
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
                </Fluid>
              </Fluid>
            ) : (
              /* LINHA UNICA: Nome (50%) + Franquia + Senha + Status (16.66% cada) (desktop) */
              <Fluid xs={[50, 16.66, 16.66, 16.66]} rowGap={16}>
                <TextBox
                  label="Nome"
                  required
                  className="mb-0"
                  isFormField={false}
                  maxLength={100}
                  disabled={isEditing && !podeEditar}
                  value={formData.nome_usuario}
                  onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                  error={nomeField.error}
                  onBlur={() => {}}
                />

                <Select
                  label="Franquia"
                  required
                  className="mb-0"
                  value={String(formData.id_franquia)}
                  options={franquiaOptions}
                  disabled={isEditing && !podeEditar}
                  onChange={(value: string) => {
                    setFormData({ ...formData, id_franquia: parseInt(value) });
                  }}
                  error={franquiaField.error}
                />

                <TextBox
                  label="Senha"
                  required={!isEditing}
                  className="mb-0"
                  isFormField={false}
                  type="password"
                  maxLength={50}
                  placeholder={isEditing ? "Deixe em branco para manter" : "Digite a senha"}
                  disabled={isEditing && !podeEditar}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  error={senhaField.error}
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
              </Fluid>
            )}

            {/* LINHA 3: Permissões */}
            <div className="mt-4">
              <label className="fw-bold mb-3 d-block">Permissões</label>
              <div className="d-flex flex-wrap gap-4">
                <Switch
                  checked={formData.permissoes.entrar}
                  onChange={(checked) => handlePermissaoChange("entrar", checked)}
                  disabled={isEditing && !podeEditar}
                  label="Entrar"
                  variant="primary"
                  size="md"
                  labelPosition="right"
                />
                <Switch
                  checked={formData.permissoes.editar}
                  onChange={(checked) => handlePermissaoChange("editar", checked)}
                  disabled={isEditing && !podeEditar}
                  label="Editar"
                  variant="primary"
                  size="md"
                  labelPosition="right"
                />
                <Switch
                  checked={formData.permissoes.excluir}
                  onChange={(checked) => handlePermissaoChange("excluir", checked)}
                  disabled={isEditing && !podeEditar}
                  label="Excluir"
                  variant="primary"
                  size="md"
                  labelPosition="right"
                />
                <Switch
                  checked={formData.permissoes.incluir}
                  onChange={(checked) => handlePermissaoChange("incluir", checked)}
                  disabled={isEditing && !podeEditar}
                  label="Incluir"
                  variant="primary"
                  size="md"
                  labelPosition="right"
                />
                <Switch
                  checked={formData.permissoes.relatorio}
                  onChange={(checked) => handlePermissaoChange("relatorio", checked)}
                  disabled={isEditing && !podeEditar}
                  label="Relatório"
                  variant="primary"
                  size="md"
                  labelPosition="right"
                />
              </div>
            </div>
          </Fluid>
        </Card.Body>
      </Card>
    </form>
  );
};

export default UsuarioReg;

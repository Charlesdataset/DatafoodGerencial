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
import { Switch } from "../../../components/Switch/Switch";
import { useApp } from "../../../contexts/AppContext";

interface UsuarioRegProps {
  onBack: () => void;
}

interface Permissoes {
  cliente_entrar: boolean;
  cliente_editar: boolean;
  cliente_excluir: boolean;
  cliente_incluir: boolean;
  cliente_relatorio: boolean;
  usuario_entrar: boolean;
  usuario_editar: boolean;
  usuario_excluir: boolean;
  usuario_incluir: boolean;
  usuario_relatorio: boolean;
  plano_entrar: boolean;
  plano_editar: boolean;
  plano_excluir: boolean;
  plano_incluir: boolean;
  plano_relatorio: boolean;
  dashboard: boolean;
  configuracao: boolean;
}

// 🔥 MAPEAMENTO DE FRANQUIA PARA ID
const getFranquiaId = (nome: string): number => {
  if (nome === "DATASET") return 1;
  if (nome === "ARS") return 2;
  if (nome === "GIGABYTE") return 3;
  return 1;
};

const validatorsCadastro = {
  nome_usuario: formValidators.compose(
    formValidators.required("Nome é obrigatório"),
    formValidators.maxLength(100, "Nome deve ter no máximo 100 caracteres")
  ),
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
  senha: formValidators.compose(
    formValidators.minLength(3, "Senha deve ter no mínimo 3 caracteres")
  ),
};

const permissoesIniciais: Permissoes = {
  cliente_entrar: false,
  cliente_editar: false,
  cliente_excluir: false,
  cliente_incluir: false,
  cliente_relatorio: false,
  usuario_entrar: false,
  usuario_editar: false,
  usuario_excluir: false,
  usuario_incluir: false,
  usuario_relatorio: false,
  plano_entrar: false,
  plano_editar: false,
  plano_excluir: false,
  plano_incluir: false,
  plano_relatorio: false,
  dashboard: false,
  configuracao: false,
};

const UsuarioReg: React.FC<UsuarioRegProps> = ({ onBack }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { emit, subscribe } = useNavigation();
  const { companyInfo } = useApp();
  const isEditing = Boolean(location.state?.row);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 USA A FRANQUIA LOGADA COMO PADRÃO
  const franquiaId = getFranquiaId(companyInfo?.franquia || "DATASET");
  const nomeFranquia = companyInfo?.franquia || "DATASET";

  const initialFormData = {
    id_usuario: 0,
    nome_usuario: "",
    id_franquia: franquiaId,
    senha: "",
    ativo: true,
    permissoes: permissoesIniciais,
  };

  const validation = useSimpleFormValidation(
    initialFormData, 
    isEditing ? validatorsEdicao : validatorsCadastro
  );
  const { validateAll, formData, textFieldProps, setFormData } = validation;

  const nomeField = textFieldProps("nome_usuario");
  const senhaField = textFieldProps("senha");

  const dataRoute = JSON.parse(localStorage.getItem('dataRouteUsuario') || '{}');
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
      
      const permissoes: Permissoes = {
        cliente_entrar: row.cliente_entrar || false,
        cliente_editar: row.cliente_editar || false,
        cliente_excluir: row.cliente_excluir || false,
        cliente_incluir: row.cliente_incluir || false,
        cliente_relatorio: row.cliente_relatorio || false,
        usuario_entrar: row.usuario_entrar || false,
        usuario_editar: row.usuario_editar || false,
        usuario_excluir: row.usuario_excluir || false,
        usuario_incluir: row.usuario_incluir || false,
        usuario_relatorio: row.usuario_relatorio || false,
        plano_entrar: row.plano_entrar || false,
        plano_editar: row.plano_editar || false,
        plano_excluir: row.plano_excluir || false,
        plano_incluir: row.plano_incluir || false,
        plano_relatorio: row.plano_relatorio || false,
        dashboard: row.dashboard || false,
        configuracao: row.configuracao || false,
      };

      setFormData({
        id_usuario: row.idUsuario,
        nome_usuario: row.nome,
        id_franquia: row.franquiaId || franquiaId,
        senha: "",
        ativo: row.ativo,
        permissoes: permissoes,
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

  const handlePermissaoChange = (key: keyof Permissoes, value: boolean) => {
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [key]: value,
      },
    });
  };

  const toggleAllPermissoes = (modulo: string, checked: boolean) => {
    const permissoesKeys: Record<string, (keyof Permissoes)[]> = {
      cliente: ['cliente_entrar', 'cliente_editar', 'cliente_excluir', 'cliente_incluir', 'cliente_relatorio'],
      usuario: ['usuario_entrar', 'usuario_editar', 'usuario_excluir', 'usuario_incluir', 'usuario_relatorio'],
      plano: ['plano_entrar', 'plano_editar', 'plano_excluir', 'plano_incluir', 'plano_relatorio'],
      gerais: ['dashboard', 'configuracao'],
    };

    const keys = permissoesKeys[modulo];
    if (!keys) return;

    const novasPermissoes = { ...formData.permissoes };
    keys.forEach(key => {
      novasPermissoes[key] = checked;
    });

    setFormData({
      ...formData,
      permissoes: novasPermissoes,
    });
  };

  const isAllChecked = (modulo: string): boolean => {
    const permissoesKeys: Record<string, (keyof Permissoes)[]> = {
      cliente: ['cliente_entrar', 'cliente_editar', 'cliente_excluir', 'cliente_incluir', 'cliente_relatorio'],
      usuario: ['usuario_entrar', 'usuario_editar', 'usuario_excluir', 'usuario_incluir', 'usuario_relatorio'],
      plano: ['plano_entrar', 'plano_editar', 'plano_excluir', 'plano_incluir', 'plano_relatorio'],
      gerais: ['dashboard', 'configuracao'],
    };

    const keys = permissoesKeys[modulo];
    if (!keys || keys.length === 0) return false;
    return keys.every(key => formData.permissoes[key] === true);
  };

  const switchStyle = {
    '--switch-color': '#42ab8a',
    '--switch-checked-color': '#42ab8a'
  } as React.CSSProperties;

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card>
        <Card.Body>
          <Fluid xs={[100]} rowGap={24}>
            {isMobile ? (
              <Fluid xs={[100]} rowGap={24}>
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
                    autoComplete="off" 
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
                    autoComplete="off" 
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
                    label="Franquia"
                    className="mb-0"
                    isFormField={false}
                    value={nomeFranquia}
                    readOnly
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                      color: '#333'
                    }}
                  />

                
                </Fluid>
              </Fluid>
            ) : (
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
                  label="Franquia"
                  className="mb-0"
                  isFormField={false}
                  value={nomeFranquia}
                  readOnly
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#333'
                  }}
                />

              </Fluid>
            )}

     
            <div className="mt-4">
              <label 
                className="mb-3 d-block" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#6c757d' 
                }}
              >
                Permissões por Tela
              </label>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                
                {/* COLUNA 1: Cliente */}
                <div className="border p-3" style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px'
                }}>
                  <label 
                    className="d-block text-center" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#6c757d',
                      marginBottom: '5px'
                    }}
                  >
                    Cliente
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <Switch
                      checked={isAllChecked('cliente')}
                      onChange={(checked) => toggleAllPermissoes('cliente', checked)}
                      disabled={isEditing && !podeEditar}
                      label="Todos"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.cliente_entrar}
                      onChange={(checked) => handlePermissaoChange("cliente_entrar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Entrar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.cliente_editar}
                      onChange={(checked) => handlePermissaoChange("cliente_editar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Editar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.cliente_excluir}
                      onChange={(checked) => handlePermissaoChange("cliente_excluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Excluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.cliente_incluir}
                      onChange={(checked) => handlePermissaoChange("cliente_incluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Incluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.cliente_relatorio}
                      onChange={(checked) => handlePermissaoChange("cliente_relatorio", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Relatório"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                  </div>
                </div>

                {/* COLUNA 2: Usuário */}
                <div className="border p-3" style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px'
                }}>
                  <label 
                    className="d-block text-center" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#6c757d',
                      marginBottom: '5px'
                    }}
                  >
                    Usuário
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <Switch
                      checked={isAllChecked('usuario')}
                      onChange={(checked) => toggleAllPermissoes('usuario', checked)}
                      disabled={isEditing && !podeEditar}
                      label="Todos"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.usuario_entrar}
                      onChange={(checked) => handlePermissaoChange("usuario_entrar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Entrar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.usuario_editar}
                      onChange={(checked) => handlePermissaoChange("usuario_editar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Editar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.usuario_excluir}
                      onChange={(checked) => handlePermissaoChange("usuario_excluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Excluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.usuario_incluir}
                      onChange={(checked) => handlePermissaoChange("usuario_incluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Incluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.usuario_relatorio}
                      onChange={(checked) => handlePermissaoChange("usuario_relatorio", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Relatório"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                  </div>
                </div>

                {/* COLUNA 3: Plano */}
                <div className="border p-3" style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px'
                }}>
                  <label 
                    className="d-block text-center" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#6c757d',
                      marginBottom: '5px'
                    }}
                  >
                    Plano
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <Switch
                      checked={isAllChecked('plano')}
                      onChange={(checked) => toggleAllPermissoes('plano', checked)}
                      disabled={isEditing && !podeEditar}
                      label="Todos"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.plano_entrar}
                      onChange={(checked) => handlePermissaoChange("plano_entrar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Entrar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.plano_editar}
                      onChange={(checked) => handlePermissaoChange("plano_editar", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Editar"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.plano_excluir}
                      onChange={(checked) => handlePermissaoChange("plano_excluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Excluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.plano_incluir}
                      onChange={(checked) => handlePermissaoChange("plano_incluir", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Incluir"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.plano_relatorio}
                      onChange={(checked) => handlePermissaoChange("plano_relatorio", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Relatório"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                  </div>
                </div>
              </div>

              {/* GERAIS (embaixo, ocupando tudo) */}
              <div className="mt-3">
                <div className="border p-3" style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px'
                }}>
                  <label 
                    className="d-block" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#6c757d',
                      marginBottom: '5px'
                    }}
                  >
                    Gerais
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <Switch
                      checked={isAllChecked('gerais')}
                      onChange={(checked) => toggleAllPermissoes('gerais', checked)}
                      disabled={isEditing && !podeEditar}
                      label="Todos"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.dashboard}
                      onChange={(checked) => handlePermissaoChange("dashboard", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Dashboard"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                    <Switch
                      checked={formData.permissoes.configuracao}
                      onChange={(checked) => handlePermissaoChange("configuracao", checked)}
                      disabled={isEditing && !podeEditar}
                      label="Configurações"
                      variant="primary"
                      size="sm"
                      labelPosition="right"
                      style={switchStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Fluid>
        </Card.Body>
      </Card>
    </form>
  );
};

export default UsuarioReg;
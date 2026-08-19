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
import type { Plano, PlanoFormData, Recurso } from "../types/Plano";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Switch } from "../../../components/Switch/Switch";
import Pill from "../../../components/Pill/Pill";

interface PlanoRegProps {
  onBack: () => void;
}

const TODOS_RECURSOS = [
  { codigo: 'cad_produtos', label: 'Produtos' },
  { codigo: 'cad_clientes', label: 'Clientes' },
  { codigo: 'cad_balcao', label: 'Balcão' },
  { codigo: 'fis_nfce', label: 'NFC-e' },
  { codigo: 'cad_turnos', label: 'Turnos' },
  { codigo: 'cad_mesas', label: 'Mesas' },
  { codigo: 'cad_delivery', label: 'Delivery' },
  { codigo: 'fin_dre', label: 'DRE' },
  { codigo: 'fis_nfe', label: 'NF-e' },
  { codigo: 'com_whatsapp', label: 'WhatsApp' },
];

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

  const dataRoute = JSON.parse(localStorage.getItem('dataRoutePlano') || '{}');
  const podeEditar = dataRoute.editar || false;
  const podeEntrar = dataRoute.entrar || false;

  useEffect(() => {
    if (isEditing && location.state?.row) {
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
        recursos: row.recursos || [],
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (isEditing && location.state?.row) {
      const row = location.state.row as Plano;
      fetchRecursosPlano(row.id_plano);
    }
  }, [isEditing]);

  const fetchRecursosPlano = async (idPlano: number) => {
    try {
      const response = await api.get(`/gerencial/planos/${idPlano}/recursos`);
      setFormData(prev => ({
        ...prev,
        recursos: response.data || [],
      }));
    } catch (error) {
      console.error("Erro ao carregar recursos do plano:", error);
    }
  };

  useEffect(() => {
    if (isEditing && !podeEntrar) {
      toast.error("Você não tem permissão para acessar a tela de edição");
      onBack();
      return;
    }
  }, [isEditing, podeEntrar]);

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
        recursos: formData.recursos || [],
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

  const handleRecursoToggle = (codigo: string) => {
    const novosRecursos = [...(formData.recursos || [])];
    const index = novosRecursos.findIndex(r => r.codigoFormulario === codigo);
    
    if (index >= 0) {
      novosRecursos.splice(index, 1);
    } else {
      novosRecursos.push({ codigoFormulario: codigo, liberado: true });
    }
    
    setFormData({ ...formData, recursos: novosRecursos });
  };

  const handleLiberadoToggle = (codigo: string) => {
    const novosRecursos = [...(formData.recursos || [])];
    const index = novosRecursos.findIndex(r => r.codigoFormulario === codigo);
    
    if (index >= 0) {
      novosRecursos[index].liberado = !novosRecursos[index].liberado;
      setFormData({ ...formData, recursos: novosRecursos });
    }
  };

  const handleRemoverRecurso = (codigo: string) => {
    const novosRecursos = (formData.recursos || []).filter(r => r.codigoFormulario !== codigo);
    setFormData({ ...formData, recursos: novosRecursos });
  };

  const adicionarTodosRecursos = () => {
    const todos = TODOS_RECURSOS.map(r => ({
      codigoFormulario: r.codigo,
      liberado: true
    }));
    setFormData({ ...formData, recursos: todos });
  };

  const removerTodosRecursos = () => {
    setFormData({ ...formData, recursos: [] });
  };

  const isRecursoSelecionado = (codigo: string) => {
    return (formData.recursos || []).some(r => r.codigoFormulario === codigo);
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
              <Fluid xs={[100]} rowGap={16}>
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
                  />
                </Fluid>

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
                  />
                </Fluid>

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
                  />
                </Fluid>

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
                  />
                </Fluid>
              </Fluid>
            ) : (
              <Fluid xs={[100]} rowGap={16}>
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
                  />
                </Fluid>

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
                  />
                </Fluid>
              </Fluid>
            )}

            {/* 🔥 SEÇÃO DE RECURSOS */}
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#6c757d' }}>
                  Recursos do Plano
                </label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={adicionarTodosRecursos}
                    disabled={isEditing && !podeEditar}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Todos
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={removerTodosRecursos}
                    disabled={isEditing && !podeEditar}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                    Limpar
                  </button>
                </div>
              </div>

              {/* 🔥 LISTA DE RECURSOS DISPONÍVEIS COM PILL - AGORA COM onClick FUNCIONANDO */}
              <div className="border p-2 mb-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TODOS_RECURSOS.map((recurso) => {
                    const selecionado = isRecursoSelecionado(recurso.codigo);
                    return (
                      <Pill
                        key={recurso.codigo}
                        label={recurso.label}
                        color={selecionado ? '#42ab8a' : '#94a3b8'}
                        size="md"
                        variant={selecionado ? 'solid' : 'outline'}
                        onClick={() => handleRecursoToggle(recurso.codigo)}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                </div>
                <div className="mt-1">
                  <span style={{ fontSize: '11px', color: '#6c757d' }}>
                  Clique em um recurso para adicionar ou remover
                  </span>
                </div>
              </div>

              {(formData.recursos || []).length > 0 ? (
                <div className="border p-2" style={{ backgroundColor: '#fff', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px' }}>
                    {(formData.recursos || []).map((recurso) => {
                      const label = TODOS_RECURSOS.find(r => r.codigo === recurso.codigoFormulario)?.label || recurso.codigoFormulario;
                      return (
                        <div key={recurso.codigoFormulario} className="d-flex align-items-center justify-content-between p-1" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
                          <div className="d-flex align-items-center gap-2">
                            <Switch
                              checked={recurso.liberado}
                              onChange={() => handleLiberadoToggle(recurso.codigoFormulario)}
                              disabled={isEditing && !podeEditar}
                              label=""
                              variant="primary"
                              size="sm"
                              style={switchStyle}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoverRecurso(recurso.codigoFormulario)}
                              disabled={isEditing && !podeEditar}
                              style={{ padding: '0 4px', fontSize: '10px' }}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted p-2" style={{ fontSize: '13px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
               Nenhum recurso selecionado. Clique nos botões acima para adicionar.
                </div>
              )}
            </div>
          </Fluid>
        </Card.Body>
      </Card>
    </form>
  );
};

export default PlanoReg;
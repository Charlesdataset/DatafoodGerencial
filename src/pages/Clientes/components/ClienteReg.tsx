import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import Select from "../../../components/Inputs/Select/Select";
import TextBox from "../../../components/Inputs/TextBox/TextBox";
import Fluid from "../../../components/Layout/Fluid";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { useNavigation } from "../../../contexts/NavigationContext";
import { formValidators } from "../../../hooks/formValidators";
import { useSimpleFormValidation } from "../../../hooks/useSimpleFormValidation";
import { api } from "../../../services/api";
import type { Cliente } from "../types/Cliente";
import { maskCnpj, maskCep, maskPhone, unMask } from "../../../utils/format";
import { Modal } from "../../../components/Modal";
import { Flex } from "../../../components/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faCheck,
  faFilter,
  faCancel,
  faUtensils,
  faWeightScale,
  faPizzaSlice,
  faBurger,
  faBeerMugEmpty,
  faMugSaucer,
  faIceCream,
  faBreadSlice,
  faCakeCandles,
  faMotorcycle,
  faTruck,
  faStore,
  faStoreAlt,
  faPlus,
  faChartPie,
  faBalanceScale,
  faFileInvoice,
  faEnvelope,
  faSms,
  faShip,
  faUsers,
  faUserTie,
  faBoxes,
  faChair,
  faChartBar,
  faGaugeHigh,
  faShoppingCart,
  faCashRegister,
  faWarehouse,
  faCubes,
  faCommentDots,
  faReceipt,
  faClock,
  faUserGroup,
  faHandshake,
  faBox,
  faTable,
  faChartLine,
  faCartShopping,
  faFileLines,
  faScaleBalanced,
  faTruckFast,
  faUserClock,
  faRotate,
  faSun,
  faMoon,
  faArrowsRotate,
  faBarcode,
  faCreditCard,
  faComments,
  faBell,
  faTags,
  faUserCog,
  faExchangeAlt,
  faArrowRight,
  faArrowLeft,
  faCircleXmark,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import ListGroup from "../../../components/ListGroup/ListGroup";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";

interface ClienteRegProps {
  onBack: () => void;
}

interface RamoAtividade {
  id: number;
  codigo: string;
  descricao: string;
  icone: string;
  cnaeDica: string;
  ordem: number;
  ativo: boolean;
}

interface Plano {
  codigo: string;
  descricao: string;
  resumo: string;
  caixasMax: number;
  usuariosMax: number;
  valorMensal: number;
  diasValidade: number;
  ordem: number;
  ativo: boolean;
}

interface Recurso {
  codigoFormulario: string;
  liberado: boolean;
}

interface Cidade {
  id_cidade: number;
  nome: string;
  uf: string;
  codigo_ibge?: number;
  ativo: boolean;
}

interface ClienteFormData extends Cliente {
  codigo_plano: string;
}

const iconeMap: Record<string, any> = {
  "b-plate": faUtensils,
  "b-scale": faWeightScale,
  "b-pizza": faPizzaSlice,
  "b-burger": faBurger,
  "b-fastfood": faUtensils,
  "b-beer": faBeerMugEmpty,
  "b-coffee": faMugSaucer,
  "b-icecream": faIceCream,
  "b-bread": faBreadSlice,
  "b-cake": faCakeCandles,
  "b-moped": faMotorcycle,
  "b-truck": faTruck,
  "b-shop": faStore,
  "b-market": faStoreAlt,
  "b-plus": faPlus,
};

const franquiaOptions = [
  { value: "DATASET", label: "DATASET" },
  { value: "ARS", label: "ARS" },
  { value: "GIGABYTE", label: "GIGABYTE" },
];

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
  razao_social: formValidators.compose(
    formValidators.required("Razão Social é obrigatória"),
    formValidators.maxLength(100, "Razão Social deve ter no máximo 100 caracteres")
  ),
  cnpj: formValidators.compose(
    formValidators.required("CNPJ é obrigatório"),
    formValidators.minLength(14, "CNPJ deve ter 14 dígitos")
  ),
  fantasia: formValidators.compose(
    formValidators.required("Fantasia é obrigatória"),
    formValidators.maxLength(100, "Fantasia deve ter no máximo 100 caracteres")
  ),
  cep: formValidators.compose(
    formValidators.required("CEP é obrigatório"),
    formValidators.minLength(8, "CEP deve ter 8 dígitos")
  ),
  endereco: formValidators.compose(
    formValidators.required("Endereço é obrigatório"),
    formValidators.maxLength(150, "Endereço deve ter no máximo 150 caracteres")
  ),
  numero: formValidators.compose(
    formValidators.required("Número é obrigatório"),
    formValidators.maxLength(10, "Número deve ter no máximo 10 caracteres")
  ),
  bairro: formValidators.compose(
    formValidators.required("Bairro é obrigatório"),
    formValidators.maxLength(80, "Bairro deve ter no máximo 80 caracteres")
  ),
  cidade: formValidators.required("Cidade é obrigatória"),
  uf: formValidators.required("UF é obrigatória"),
  responsavel_nome: formValidators.compose(
    formValidators.required("Responsável é obrigatório"),
    formValidators.maxLength(100, "Responsável deve ter no máximo 100 caracteres")
  ),
  telefone: formValidators.compose(
    formValidators.required("Telefone é obrigatório"),
    formValidators.minLength(10, "Telefone deve ter no mínimo 10 dígitos")
  ),
  email: formValidators.compose(
    formValidators.required("Email é obrigatório"),
    formValidators.maxLength(150, "Email deve ter no máximo 150 caracteres")
  ),
  codigo_plano: formValidators.required("Plano é obrigatório"),
};

const ClienteReg: React.FC<ClienteRegProps> = ({ onBack }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { emit, subscribe } = useNavigation();
  const isEditing = Boolean(location.state?.row);
  const title = isEditing ? "Editar Cliente" : "Novo Cliente";
  const [activeTab, setActiveTab] = useState("principal");
  const [isRamoModalOpen, setIsRamoModalOpen] = useState(false);
  const [ramos, setRamos] = useState<RamoAtividade[]>([]);
  const [ramoSearch, setRamoSearch] = useState("");
  const [loadingRamos, setLoadingRamos] = useState(false);

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);

  // 🔥 STATE PARA CIDADES E MODAL
  const [isCidadeModalOpen, setIsCidadeModalOpen] = useState(false);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [cidadeSearch, setCidadeSearch] = useState("");
  const [loadingCidades, setLoadingCidades] = useState(false);

  const initialFormData: ClienteFormData = {
    id_cliente: 0,
    cnpj: "",
    razao_social: "",
    fantasia: "",
    inscricao_estadual: "",
    cnae: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    responsavel_nome: "",
    whatsapp: "",
    telefone: "",
    email: "",
    codigo_ramo: "",
    franquia: "DATASET",
    origem: "SUPORTE",
    observacoes: "",
    excluido: false,
    codigo_plano: "",
  };

  const validation = useSimpleFormValidation(initialFormData, validators);
  const { validateAll, formData, textFieldProps, setFormData } = validation;

  const razaoSocialField = textFieldProps("razao_social");
  const cnpjField = textFieldProps("cnpj");
  const fantasiaField = textFieldProps("fantasia");
  const cepField = textFieldProps("cep");
  const enderecoField = textFieldProps("endereco");
  const numeroField = textFieldProps("numero");
  const bairroField = textFieldProps("bairro");
  const cidadeField = textFieldProps("cidade");
  const ufField = textFieldProps("uf");
  const responsavelField = textFieldProps("responsavel_nome");
  const telefoneField = textFieldProps("telefone");
  const emailField = textFieldProps("email");
  const codigoPlanoField = textFieldProps("codigo_plano");

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    setLoadingPlanos(true);
    try {
      const response = await api.get("/gerencial/planos");
      setPlanos(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoadingPlanos(false);
    }
  };

  const fetchRecursos = async (codigo: string) => {
    if (!codigo) {
      setRecursos([]);
      return;
    }
    try {
      const response = await api.get(`/gerencial/planos/${codigo}/recursos`);
      setRecursos(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar recursos:", error);
      setRecursos([]);
    }
  };

  useEffect(() => {
    if (location.state?.row) {
      const row = location.state.row as Cliente;
      setFormData({
        ...row,
        cnpj: maskCnpj(row.cnpj || ""),
        cep: maskCep(row.cep || ""),
        telefone: maskPhone(row.telefone || ""),
        whatsapp: maskPhone(row.whatsapp || ""),
        codigo_plano: "",
      } as ClienteFormData);
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

  useEffect(() => {
    if (isRamoModalOpen) {
      fetchRamos();
    }
  }, [isRamoModalOpen]);

  useEffect(() => {
    if (isCidadeModalOpen) {
      fetchCidades();
    }
  }, [isCidadeModalOpen]);

  const fetchRamos = async () => {
    setLoadingRamos(true);
    try {
      const response = await api.get("/gerencial/ramos");
      setRamos(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar ramos:", error);
      toast.error("Erro ao carregar ramos de atividade");
    } finally {
      setLoadingRamos(false);
    }
  };

  const fetchCidades = async () => {
    setLoadingCidades(true);
    try {
      const response = await api.get("/gerencial/cidade");
      if (response?.status === 200) {
        setCidades(response.data.result || []);
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      toast.error("Erro ao carregar cidades");
    } finally {
      setLoadingCidades(false);
    }
  };

  const handleSelectRamo = (ramo: RamoAtividade) => {
    setFormData({ ...formData, codigo_ramo: ramo.codigo });
    setIsRamoModalOpen(false);
    setRamoSearch("");
  };

  const handleSelectCidade = (cidade: Cidade) => {
    setFormData({
      ...formData,
      cidade: cidade.nome,
      uf: cidade.uf,
    });
    setIsCidadeModalOpen(false);
    setCidadeSearch("");
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
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
        cnpj: unMask(formData.cnpj),
        cep: unMask(formData.cep || ""),
        telefone: unMask(formData.telefone || ""),
        whatsapp: unMask(formData.whatsapp || ""),
      };

      const response = isEditing
        ? await api.put("/gerencial/cliente", payload)
        : await api.post("/gerencial/cliente", payload);

      if (response?.status === 200 || response?.status === 201) {
        const clienteId = response.data.id_cliente || formData.id_cliente;

        if (formData.codigo_plano) {
          try {
            await api.post("/gerencial/licencas", {
              id_cliente: clienteId,
              codigo_plano: formData.codigo_plano,
              situacao: "ATIVO",
              vigente: true,
            });
          } catch (licencaError) {
            console.error("Erro ao salvar licença:", licencaError);
            toast.warning("Cliente salvo, mas houve erro ao vincular o plano");
          }
        }

        toast.success(isEditing ? "Cliente atualizado com sucesso" : "Cliente cadastrado com sucesso");
        emit("isCommited", true);
        onBack();
      } else {
        toast.error("Erro ao salvar cliente");
        emit("isCommited", false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar cliente");
      emit("isCommited", false);
    }
  };

  const filteredRamos = ramos.filter((ramo) => {
    const search = ramoSearch.toLowerCase();
    return (
      ramo.descricao.toLowerCase().includes(search) ||
      ramo.codigo.toLowerCase().includes(search)
    );
  });

  const filteredCidades = cidades.filter((cidade) => {
    const search = cidadeSearch.toLowerCase();
    return (
      cidade.nome.toLowerCase().includes(search) ||
      cidade.uf.toLowerCase().includes(search)
    );
  });

  const renderEmpresa = () => (
    <Fluid xs={[100]} rowGap={16}>
      <Fluid xs={[33, 33, 34]} rowGap={16}>
        <TextBox
          label="Razão Social"
          required
          className="mb-0"
          isFormField={false}
          maxLength={100}
          {...razaoSocialField}
        />

        <TextBox
          label="Fantasia"
          required
          className="mb-0"
          isFormField={false}
          maxLength={100}
          {...fantasiaField}
        />

        <TextBox
          label="CNPJ"
          required
          className="mb-0"
          isFormField={false}
          mask="cnpj"
          maxLength={18}
          {...cnpjField}
        />
      </Fluid>

      <Fluid xs={[33, 33, 34]} rowGap={16}>
        <TextBox
          label="Inscrição Estadual"
          className="mb-0"
          isFormField={false}
          maxLength={20}
          value={formData.inscricao_estadual}
          onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
        />

        <TextBox
          label="CNAE"
          className="mb-0"
          isFormField={false}
          maxLength={20}
          value={formData.cnae}
          onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
        />

        <Select
          label="Franquia"
          className="mb-0"
          value={formData.franquia}
          options={franquiaOptions}
          onChange={(value: string) => setFormData({ ...formData, franquia: value })}
        />
      </Fluid>
    </Fluid>
  );

  const renderLocalizacao = () => (
    <Fluid xs={[100]} rowGap={16}>
      <Fluid xs={[30, 45, 25]} rowGap={16}>
        <TextBox
          label="CEP"
          required
          className="mb-0"
          isFormField={false}
          mask="cep"
          maxLength={9}
          {...cepField}
        />

        <TextBox
          label="Endereço"
          required
          className="mb-0"
          isFormField={false}
          maxLength={150}
          {...enderecoField}
        />

        <TextBox
          label="Número"
          required
          className="mb-0"
          isFormField={false}
          maxLength={10}
          {...numeroField}
        />
      </Fluid>

      <Fluid xs={[35, 40, 25]} rowGap={16}>
        <TextBox
          label="Bairro"
          required
          className="mb-0"
          isFormField={false}
          maxLength={80}
          {...bairroField}
        />

        <TextBox
          label="Cidade"
          required
          className="mb-0"
          isFormField={false}
          value={formData.cidade}
          readOnly
          onClick={() => setIsCidadeModalOpen(true)}
          placeholder="Selecione uma cidade"
          rightIcon={
            formData.cidade ? (
              <FontAwesomeIcon
                icon={faTimes}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setFormData({ ...formData, cidade: "", uf: "" });
                }}
                style={{ cursor: "pointer", color: "#6c757d" }}
              />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )
          }
          error={cidadeField.error}
        />

        <TextBox
          label="UF"
          required
          className="mb-0"
          isFormField={false}
          value={formData.uf}
          readOnly
          placeholder="Preenchido automaticamente"
          {...ufField}
        />
      </Fluid>

      <Fluid xs={[100]} rowGap={16}>
        <TextBox
          label="Complemento"
          className="mb-0"
          isFormField={false}
          maxLength={50}
          value={formData.complemento}
          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
        />
      </Fluid>
    </Fluid>
  );

  const renderContato = () => (
    <Fluid xs={[100]} rowGap={16}>
      <Fluid xs={[50, 50]} rowGap={16}>
        <TextBox
          label="Responsável"
          required
          className="mb-0"
          isFormField={false}
          maxLength={100}
          {...responsavelField}
        />

        <TextBox
          label="WhatsApp"
          className="mb-0"
          isFormField={false}
          mask="phone"
          maxLength={15}
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
        />
      </Fluid>

      <Fluid xs={[50, 50]} rowGap={16}>
        <TextBox
          label="Telefone"
          required
          className="mb-0"
          isFormField={false}
          mask="phone"
          maxLength={15}
          {...telefoneField}
        />

        <TextBox
          label="Email"
          required
          className="mb-0"
          isFormField={false}
          type="email"
          maxLength={150}
          {...emailField}
        />
      </Fluid>
    </Fluid>
  );

  const renderInstalacao = () => {
    const recursoIconeMap: Record<string, any> = {
      'fin_dre': faChartPie,
      'fin_balanco': faScaleBalanced,
      'fin_extrato': faFileLines,
      'fin_nfce': faReceipt,
      'fin_nfe': faFileInvoice,
      'fin_boleto': faBarcode,
      'fin_cartao': faCreditCard,
      'com_whatsapp': faWhatsapp,
      'com_email': faEnvelope,
      'com_sms': faCommentDots,
      'com_chat': faComments,
      'com_notificacao': faBell,
      'fis_nfe': faFileInvoice,
      'fis_cte': faTruck,
      'fis_mdfe': faShip,
      'fis_nfce': faReceipt,
      'fis_cupom': faReceipt,
      'cad_clientes': faUsers,
      'cad_fornecedores': faHandshake,
      'cad_produtos': faBoxes,
      'cad_mesas': faChair,
      'cad_balcao': faStore,
      'cad_turnos': faClock,
      'cad_turno': faClock,
      'cad_delivery': faMotorcycle,
      'delivery': faMotorcycle,
      'cad_comandas': faReceipt,
      'cad_categorias': faTags,
      'cad_usuarios': faUserCog,
      'cad_funcionarios': faUserTie,
      'ger_relatorio': faChartBar,
      'ger_dashboard': faGaugeHigh,
      'ger_grafico': faChartLine,
      'ven_pedidos': faShoppingCart,
      'ven_caixa': faCashRegister,
      'ven_balcao': faStore,
      'ven_delivery': faMotorcycle,
      'ven_consumacao': faMugSaucer,
      'est_estoque': faWarehouse,
      'est_entrada': faArrowRight,
      'est_saida': faArrowLeft,
      'est_transferencia': faExchangeAlt,
    };

    return (
      <Fluid xs={[100]} rowGap={16}>
        <Fluid xs={[50, 50]} rowGap={16}>
          <TextBox
            label="Ramo de Atividade"
            className="mb-0"
            isFormField={false}
            value={formData.codigo_ramo}
            readOnly
            onClick={() => setIsRamoModalOpen(true)}
            placeholder="Selecione um ramo de atividade"
            rightIcon={
              formData.codigo_ramo ? (
                <FontAwesomeIcon
                  icon={faTimes}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setFormData({ ...formData, codigo_ramo: "" });
                  }}
                  style={{ cursor: "pointer", color: "#6c757d" }}
                />
              ) : (
                <FontAwesomeIcon icon={faSearch} />
              )
            }
          />

          <TextBox
            label="Origem"
            className="mb-0"
            isFormField={false}
            maxLength={20}
            value={formData.origem}
            onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
          />
        </Fluid>

        <Fluid xs={[100]} rowGap={16}>
          <Select
            label="Plano"
            required
            className="mb-0"
            value={formData.codigo_plano}
            options={planos.map((p) => ({ value: p.codigo, label: p.descricao }))}
            onChange={(value: string) => {
              setFormData({ ...formData, codigo_plano: value });
              fetchRecursos(value);
            }}
            placeholder={loadingPlanos ? "Carregando planos..." : "Selecione um plano"}
            error={codigoPlanoField.error}
          />
        </Fluid>

        {recursos.length > 0 && (
          <Fluid xs={[100]} rowGap={16}>
            <div>
              <label style={{ fontWeight: 600, fontSize: "14px", display: "block", marginBottom: "8px" }}>
                Recursos do plano:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                {recursos.map((recurso) => {
                  const nomeFormatado = recurso.codigoFormulario
                    .split('_')
                    .map((palavra, index) => {
                      if (index === 0) {
                        const map: Record<string, string> = {
                          'fin': 'Financeiro',
                          'com': 'Comunicação',
                          'fis': 'Físico',
                          'cad': 'Cadastro',
                          'ger': 'Gerencial',
                          'ven': 'Vendas',
                          'est': 'Estoque'
                        };
                        return map[palavra] || palavra.charAt(0).toUpperCase() + palavra.slice(1);
                      }
                      return palavra.toUpperCase();
                    })
                    .join(' ');

                  const icone = recursoIconeMap[recurso.codigoFormulario] || faCubes;

                  return (
                    <div
                      key={recurso.codigoFormulario}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: recurso.liberado ? "#e8f5e9" : "#f5f5f5",
                        border: recurso.liberado ? "1px solid #c8e6c9" : "1px solid #e0e0e0",
                        opacity: recurso.liberado ? 1 : 0.7,
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={recurso.liberado ? faCheck : faBan}
                        style={{ 
                          color: recurso.liberado ? "#2e7d32" : "#d32f2f",
                          fontSize: "18px",
                          width: "18px"
                        }}
                      />
                      <FontAwesomeIcon 
                        icon={icone}
                        style={{ 
                          color: recurso.liberado ? "#1b5e20" : "#999999",
                          fontSize: "20px",
                          width: "20px"
                        }}
                      />
                      <span style={{ 
                        fontSize: "13px", 
                        fontWeight: recurso.liberado ? "500" : "400",
                        color: recurso.liberado ? "#1b5e20" : "#999999"
                      }}>
                        {nomeFormatado}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Fluid>
        )}
      </Fluid>
    );
  };

  const mainTabs = [
    { key: "principal", label: "Informações Básicas" },
    { key: "extras", label: "Extras" },
    { key: "financeiro", label: "Financeiro" },
    { key: "observacoes", label: "Observações" },
  ];

  return (
    <>
      {/* MODAL CIDADE */}
      <Modal isOpen={isCidadeModalOpen} onClose={() => setIsCidadeModalOpen(false)} size="md">
        <Modal.Header onClose={() => setIsCidadeModalOpen(false)}>
          <Flex>
            <FontAwesomeIcon icon={faFilter} />
            Selecionar Cidade
          </Flex>
        </Modal.Header>

        <Modal.Body>
          <Fluid xs={[100]}>
            <TextSearch
              placeholder="Buscar cidade..."
              value={cidadeSearch}
              onChange={(e: any) => setCidadeSearch(e.target.value)}
            />

            {loadingCidades ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                Carregando...
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "12px" }}>
                <ListGroup flush>
                  {filteredCidades.map((cidade) => (
                    <ListGroup.Item
                      key={cidade.id_cidade}
                      description={`UF: ${cidade.uf}`}
                      onClick={() => handleSelectCidade(cidade)}
                    >
                      {cidade.nome}
                    </ListGroup.Item>
                  ))}
                  {filteredCidades.length === 0 && !loadingCidades && (
                    <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                      Nenhuma cidade encontrada
                    </div>
                  )}
                </ListGroup>
              </div>
            )}
          </Fluid>
        </Modal.Body>

        <Modal.Footer>
          <Fluid xs={[100, 50, 50]} lg={["expand"]}>
            <FormButton
              variant="outline-secondary"
              className="justify-content-center"
              onClick={() => setIsCidadeModalOpen(false)}
            >
              <Flex wrap="nowrap">
                <FontAwesomeIcon icon={faCancel} />
                Cancelar
              </Flex>
            </FormButton>
            <FormButton
              className="justify-content-center"
              style={{
                background: "#217145",
                border: "1px solid #217145",
                color: "#ffffff",
              }}
              onClick={() => setIsCidadeModalOpen(false)}
            >
              <Flex wrap="nowrap">
                <FontAwesomeIcon icon={faCheck} />
                Ok
              </Flex>
            </FormButton>
          </Fluid>
        </Modal.Footer>
      </Modal>

      {/* MODAL RAMO */}
      <Modal isOpen={isRamoModalOpen} onClose={() => setIsRamoModalOpen(false)} size="md">
        <Modal.Header onClose={() => setIsRamoModalOpen(false)}>
          <Flex>
            <FontAwesomeIcon icon={faFilter} />
            Selecionar Ramo de Atividade
          </Flex>
        </Modal.Header>

        <Modal.Body>
          <Fluid xs={[100]}>
            <TextSearch
              placeholder="Buscar ramo..."
              value={ramoSearch}
              onChange={(e: any) => setRamoSearch(e.target.value)}
            />

            {loadingRamos ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                Carregando...
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "12px" }}>
                <ListGroup flush>
                  {filteredRamos.map((ramo) => (
                    <ListGroup.Item
                      key={ramo.id}
                      icon={<FontAwesomeIcon icon={iconeMap[ramo.icone] || faUtensils} />}
                      description={`Código: ${ramo.codigo}${ramo.cnaeDica ? ` - CNAE: ${ramo.cnaeDica}` : ""}`}
                      onClick={() => handleSelectRamo(ramo)}
                    >
                      {ramo.descricao}
                    </ListGroup.Item>
                  ))}
                  {filteredRamos.length === 0 && !loadingRamos && (
                    <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                      Nenhum ramo encontrado
                    </div>
                  )}
                </ListGroup>
              </div>
            )}
          </Fluid>
        </Modal.Body>

        <Modal.Footer>
          <Fluid xs={[100, 50, 50]} lg={["expand"]}>
            <FormButton
              variant="outline-secondary"
              className="justify-content-center"
              onClick={() => setIsRamoModalOpen(false)}
            >
              <Flex wrap="nowrap">
                <FontAwesomeIcon icon={faCancel} />
                Cancelar
              </Flex>
            </FormButton>
            <FormButton
              className="justify-content-center"
              style={{
                background: "#217145",
                border: "1px solid #217145",
                color: "#ffffff",
              }}
              onClick={() => setIsRamoModalOpen(false)}
            >
              <Flex wrap="nowrap">
                <FontAwesomeIcon icon={faCheck} />
                Ok
              </Flex>
            </FormButton>
          </Fluid>
        </Modal.Footer>
      </Modal>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            <span>{title}</span>
          </Card.Header>

          <Card.Body>
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #dee2e6",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              {mainTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background: "none",
                    borderBottom:
                      activeTab === tab.key
                        ? "2px solid #007bff"
                        : "2px solid transparent",
                    color: activeTab === tab.key ? "#007bff" : "#6c757d",
                    fontWeight: activeTab === tab.key ? "600" : "400",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "principal" && (
              <Fluid xs={[100]} rowGap={24} className="mt-3">
                <Card className="h-100">
                  <Card.Header>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>
                      Empresa
                    </span>
                  </Card.Header>
                  <Card.Body>{renderEmpresa()}</Card.Body>
                </Card>

                <Card className="h-100">
                  <Card.Header>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>
                      Localização
                    </span>
                  </Card.Header>
                  <Card.Body>{renderLocalizacao()}</Card.Body>
                </Card>

                <Card className="h-100">
                  <Card.Header>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>
                      Contato
                    </span>
                  </Card.Header>
                  <Card.Body>{renderContato()}</Card.Body>
                </Card>

                <Card className="h-100">
                  <Card.Header>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>
                      Instalação
                    </span>
                  </Card.Header>
                  <Card.Body>{renderInstalacao()}</Card.Body>
                </Card>
              </Fluid>
            )}

            {activeTab === "extras" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
                <p className="text-muted">Campos extras em desenvolvimento</p>
              </Fluid>
            )}

            {activeTab === "financeiro" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
                <p className="text-muted">Campos financeiros em desenvolvimento</p>
              </Fluid>
            )}

            {activeTab === "observacoes" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
                <TextBox
                  label="Observações"
                  className="mb-0"
                  isFormField={false}
                  maxLength={500}
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Observações sobre o cliente..."
                />
              </Fluid>
            )}
          </Card.Body>
        </Card>
      </form>
    </>
  );
};

export default ClienteReg;
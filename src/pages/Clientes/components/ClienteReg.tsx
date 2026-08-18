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
import { useCep } from "../../../hooks/useCep";
import { useCnpj } from "../../../hooks/useCnpj";
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
  id_plano: number;
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
  codigo_plano: number;
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

const origemOptions = [
  { value: "SITE", label: "SITE" },
  { value: "SUPORTE", label: "SUPORTE" },
  { value: "AUTOCADASTRO", label: "AUTOCADASTRO" },
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
  inscricao_estadual: formValidators.compose(
    formValidators.required("Inscrição Estadual é obrigatória"),
    formValidators.inscricaoEstadual("Inscrição Estadual inválida")
  ),
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
  codigo_plano: formValidators.compose(
    formValidators.required("Plano é obrigatório"),
    (value: number) => {
      if (value === 0 || value === null || value === undefined) {
        return "Plano é obrigatório";
      }
      return null;
    }
  ),
};

const toUpperCase = (value: string) => value ? value.toUpperCase() : '';

const ClienteReg: React.FC<ClienteRegProps> = ({ onBack }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const { emit, subscribe } = useNavigation();
  const isEditing = Boolean(location.state?.row);
  const [activeTab, setActiveTab] = useState("principal");
  const [isRamoModalOpen, setIsRamoModalOpen] = useState(false);
  const [ramos, setRamos] = useState<RamoAtividade[]>([]);
  const [ramoSearch, setRamoSearch] = useState("");
  const [loadingRamos, setLoadingRamos] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { loadingCep, buscarCep } = useCep();
  const { loadingCnpj, buscarCnpj } = useCnpj();

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);

  const [isCidadeModalOpen, setIsCidadeModalOpen] = useState(false);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [cidadeSearch, setCidadeSearch] = useState("");
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    codigo_plano: 0,
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
  const inscricaoEstadualField = textFieldProps("inscricao_estadual");
  const responsavelField = textFieldProps("responsavel_nome");
  const telefoneField = textFieldProps("telefone");
  const emailField = textFieldProps("email");
  const codigoPlanoField = textFieldProps("codigo_plano");

  const dataRoute = JSON.parse(localStorage.getItem('dataRouteCliente') || '{}');
  const podeIncluir = dataRoute.incluir || false;
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
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    setLoadingPlanos(true);
    try {
      const response = await api.get("/gerencial/planos");
      setPlanos(response.data || []);
    } catch (error) {
      toast.error("Erro ao carregar planos");
    } finally {
      setLoadingPlanos(false);
    }
  };

  const fetchRecursos = async (idPlano: number) => {
    if (!idPlano) {
      setRecursos([]);
      return;
    }
    try {
      const response = await api.get(`/gerencial/planos/${idPlano}/recursos`);
      setRecursos(response.data || []);
    } catch (error) {
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
        codigo_plano: row.id_plano || 0,
      } as ClienteFormData);
    }
  }, [location.state]);

  useEffect(() => {
    if (isEditing && formData.codigo_plano) {
      fetchRecursos(formData.codigo_plano);
    }
  }, [isEditing, formData.codigo_plano]);

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

    if (!isEditing && !podeIncluir) {
      toast.error("Você não tem permissão para incluir clientes");
      emit("isCommited", false);
      return;
    }
    if (isEditing && !podeEditar) {
      toast.error("Você não tem permissão para editar clientes");
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
              id_plano: formData.codigo_plano,
              situacao: "ATIVO",
              vigente: true,
            });
          } catch (licencaError) {
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
      // toast.error(error.response?.data?.message || "Erro ao salvar cliente");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <TextBox
        label="Razão Social"
        required
        className="mb-0"
        isFormField={false}
        maxLength={100}
        disabled={isEditing && !podeEditar}
        value={formData.razao_social}
        onChange={(e) => setFormData({ ...formData, razao_social: toUpperCase(e.target.value) })}
        error={razaoSocialField.error}
        onBlur={razaoSocialField.onBlur}
      />

      <TextBox
        label="Fantasia"
        required
        className="mb-0"
        isFormField={false}
        maxLength={100}
        disabled={isEditing && !podeEditar}
        value={formData.fantasia}
        onChange={(e) => setFormData({ ...formData, fantasia: toUpperCase(e.target.value) })}
        error={fantasiaField.error}
        onBlur={fantasiaField.onBlur}
      />

      <TextBox
        label="CNPJ"
        required
        className="mb-0"
        isFormField={false}
        mask="cnpj"
        maxLength={18}
        disabled={isEditing && !podeEditar}
        value={formData.cnpj}
        onChange={(e) => {
          const value = e.target.value;
          setFormData({ ...formData, cnpj: value });
          if (unMask(value).length === 14 && !isEditing) {
            buscarCnpj(value, setFormData);
          }
        }}
        error={cnpjField.error}
        onBlur={cnpjField.onBlur}
        rightIcon={
          podeEditar && (
            <FontAwesomeIcon
              icon={faSearch}
              onClick={() => buscarCnpj(formData.cnpj, setFormData)}
              style={{
                cursor: loadingCnpj ? "wait" : "pointer",
                color: "#6c757d",
                opacity: loadingCnpj ? 0.5 : 1
              }}
              spin={loadingCnpj}
            />
          )
        }
      />

      <TextBox
        label="Inscrição Estadual"
        required
        className="mb-0"
        isFormField={false}
        mask="number"
        maxLength={20}
        disabled={isEditing && !podeEditar || !formData.uf}
        value={formData.inscricao_estadual}
        onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
        error={inscricaoEstadualField.error}
        onBlur={inscricaoEstadualField.onBlur}
      />

      <TextBox
        label="CNAE"
        className="mb-0"
        isFormField={false}
        maxLength={20}
        disabled={isEditing && !podeEditar}
        value={formData.cnae}
        onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
      />

      <Select
        label="Franquia"
        className="mb-0"
        value={formData.franquia}
        options={franquiaOptions}
        disabled={isEditing && !podeEditar}
        onChange={(value: string) => setFormData({ ...formData, franquia: value })}
      />
    </div>
  );

  const renderLocalizacao = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <TextBox
        label="CEP"
        required
        className="mb-0"
        isFormField={false}
        mask="cep"
        maxLength={9}
        disabled={isEditing && !podeEditar}
        value={formData.cep}
        onChange={(e) => {
          const value = e.target.value;
          setFormData({ ...formData, cep: value });
          if (value.replace(/\D/g, '').length === 8) {
            buscarCep(value, setFormData);
          }
        }}
        error={cepField.error}
        onBlur={cepField.onBlur}
        rightIcon={
          podeEditar && (
            <FontAwesomeIcon
              icon={faSearch}
              onClick={() => {
                const cepLimpo = formData.cep.replace(/\D/g, '');
                if (cepLimpo.length === 8) {
                  buscarCep(formData.cep, setFormData);
                } else {
                  toast.warning('CEP inválido! Digite 8 números');
                }
              }}
              style={{
                cursor: loadingCep ? "wait" : "pointer",
                color: "#6c757d",
                opacity: loadingCep ? 0.5 : 1
              }}
              spin={loadingCep}
            />
          )
        }
      />
      {loadingCep && <small style={{ color: '#6c757d' }}>Buscando endereço...</small>}

      <TextBox
        label="Endereço"
        required
        className="mb-0"
        isFormField={false}
        maxLength={150}
        disabled={isEditing && !podeEditar || loadingCep}
        value={formData.endereco}
        onChange={(e) => setFormData({ ...formData, endereco: toUpperCase(e.target.value) })}
        error={enderecoField.error}
        onBlur={enderecoField.onBlur}
      />

      <TextBox
        label="Número"
        required
        className="mb-0"
        isFormField={false}
        maxLength={10}
        disabled={isEditing && !podeEditar}
        value={formData.numero}
        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
        error={numeroField.error}
        onBlur={numeroField.onBlur}
      />

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "12px" }}>
        <TextBox
          label="Bairro"
          required
          className="mb-0"
          isFormField={false}
          maxLength={80}
          disabled={isEditing && !podeEditar || loadingCep}
          value={formData.bairro}
          onChange={(e) => setFormData({ ...formData, bairro: toUpperCase(e.target.value) })}
          error={bairroField.error}
          onBlur={bairroField.onBlur}
        />

        <TextBox
          label="UF"
          required
          className="mb-0"
          isFormField={false}
          value={formData.uf}
          readOnly
          disabled={isEditing && !podeEditar || loadingCep}
          placeholder="UF"
          error={ufField.error}
          onBlur={ufField.onBlur}
          style={{ textTransform: "uppercase" }}
        />
      </div>

      <TextBox
        label="Cidade"
        required
        className="mb-0"
        isFormField={false}
        value={formData.cidade}
        readOnly
        disabled={isEditing && !podeEditar || loadingCep}
        onClick={() => setIsCidadeModalOpen(true)}
        placeholder="Selecione uma cidade"
        rightIcon={
          <FontAwesomeIcon
            icon={formData.cidade ? faTimes : faSearch}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (formData.cidade) {
                setFormData({ ...formData, cidade: "", uf: "" });
              } else {
                setIsCidadeModalOpen(true);
              }
            }}
            style={{ cursor: "pointer", color: "#6c757d" }}
          />
        }
        error={cidadeField.error}
        onBlur={cidadeField.onBlur}
      />

      <TextBox
        label="Complemento"
        className="mb-0"
        isFormField={false}
        maxLength={50}
        disabled={isEditing && !podeEditar || loadingCep}
        value={formData.complemento}
        onChange={(e) => setFormData({ ...formData, complemento: toUpperCase(e.target.value) })}
      />
    </div>
  );

  const renderContato = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <TextBox
        label="Responsável"
        required
        className="mb-0"
        isFormField={false}
        maxLength={100}
        disabled={isEditing && !podeEditar}
        value={formData.responsavel_nome}
        onChange={(e) => setFormData({ ...formData, responsavel_nome: toUpperCase(e.target.value) })}
        error={responsavelField.error}
        onBlur={responsavelField.onBlur}
      />

      <TextBox
        label="WhatsApp"
        className="mb-0"
        isFormField={false}
        mask="phone"
        maxLength={15}
        disabled={isEditing && !podeEditar}
        value={formData.whatsapp}
        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
      />

      <TextBox
        label="Telefone"
        required
        className="mb-0"
        isFormField={false}
        mask="phone"
        maxLength={15}
        disabled={isEditing && !podeEditar}
        value={formData.telefone}
        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
        error={telefoneField.error}
        onBlur={telefoneField.onBlur}
      />

      <TextBox
        label="Email"
        required
        className="mb-0"
        isFormField={false}
        type="email"
        maxLength={150}
        disabled={isEditing && !podeEditar}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={emailField.error}
        onBlur={emailField.onBlur}
      />
    </div>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <TextBox
          label="Ramo de Atividade"
          className="mb-0"
          isFormField={false}
          value={formData.codigo_ramo}
          readOnly
          disabled={isEditing && !podeEditar}
          onClick={() => {
            if (!(isEditing && !podeEditar)) {
              setIsRamoModalOpen(true);
            }
          }}
          placeholder="Selecione um ramo de atividade"
          rightIcon={
            formData.codigo_ramo ? (
              <FontAwesomeIcon
                icon={faTimes}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!(isEditing && !podeEditar)) {
                    setFormData({ ...formData, codigo_ramo: "" });
                  }
                }}
                style={{
                  cursor: (isEditing && !podeEditar) ? "not-allowed" : "pointer",
                  color: (isEditing && !podeEditar) ? "#ccc" : "#6c757d"
                }}
              />
            ) : (
              <FontAwesomeIcon
                icon={faSearch}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!(isEditing && !podeEditar)) {
                    setIsRamoModalOpen(true);
                  }
                }}
                style={{
                  cursor: (isEditing && !podeEditar) ? "not-allowed" : "pointer",
                  color: (isEditing && !podeEditar) ? "#ccc" : "#6c757d"
                }}
              />
            )
          }
        />

        <Select
          label="Origem"
          className="mb-0"
          value={formData.origem}
          options={origemOptions}
          disabled={isEditing && !podeEditar}
          onChange={(value: string) => setFormData({ ...formData, origem: value })}
        />

        <Select
          label="Plano"
          required
          className="mb-0"
          value={formData.codigo_plano.toString()}
          options={[
            { value: "", label: "Selecione um plano" },
            ...planos.map((p) => ({ 
              value: p.id_plano.toString(), 
              label: p.descricao 
            }))
          ]}
          disabled={isEditing && !podeEditar}
          onChange={(value: string) => {
            if (value === "") {
              setFormData({ ...formData, codigo_plano: 0 });
              setRecursos([]);
              return;
            }
            const numero = parseInt(value);
            setFormData({ ...formData, codigo_plano: numero });
            if (numero) {
              fetchRecursos(numero);
            } else {
              setRecursos([]);
            }
          }}
          placeholder={loadingPlanos ? "Carregando planos..." : "Selecione um plano"}
          error={codigoPlanoField.error}
        />

        {recursos.length > 0 && (
          <div>
            <label style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "6px" }}>
              Recursos do plano:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
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
                      gap: "8px",
                      padding: "4px 10px",
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
                        fontSize: "14px",
                        width: "14px"
                      }}
                    />
                    <FontAwesomeIcon 
                      icon={icone}
                      style={{ 
                        color: recurso.liberado ? "#1b5e20" : "#999999",
                        fontSize: "16px",
                        width: "16px"
                      }}
                    />
                    <span style={{ 
                      fontSize: "12px", 
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
        )}
      </div>
    );
  };

  const renderFranquias = () => (
    <div style={{ padding: "20px", textAlign: "center", color: "#6c757d" }}>
     
    </div>
  );

  const mainTabs = [
    { key: "principal", label: "Informações Básicas" },
    { key: "extras", label: "Extras" },
    { key: "franquias", label: "Franquias" },
    { key: "financeiro", label: "Financeiro" },
    { key: "observacoes", label: "Observações" },
  ];

  return (
    <>
      <Modal 
        isOpen={isCidadeModalOpen} 
        onClose={() => {
          setIsCidadeModalOpen(false);
          setCidadeSearch("");
        }} 
        size="md"
      >
        <Modal.Header onClose={() => {
          setIsCidadeModalOpen(false);
          setCidadeSearch("");
        }}>
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
              onClick={() => {
                setIsCidadeModalOpen(false);
                setCidadeSearch("");
              }}
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
              onClick={() => {
                setIsCidadeModalOpen(false);
                setCidadeSearch("");
              }}
            >
              <Flex wrap="nowrap">
                <FontAwesomeIcon icon={faCheck} />
                Ok
              </Flex>
            </FormButton>
          </Fluid>
        </Modal.Footer>
      </Modal>

      <Modal 
        isOpen={isRamoModalOpen} 
        onClose={() => {
          setIsRamoModalOpen(false);
          setRamoSearch("");
        }} 
        size="md"
      >
        <Modal.Header onClose={() => {
          setIsRamoModalOpen(false);
          setRamoSearch("");
        }}>
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
              onClick={() => {
                setIsRamoModalOpen(false);
                setRamoSearch("");
              }}
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
              onClick={() => {
                setIsRamoModalOpen(false);
                setRamoSearch("");
              }}
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
          <Card.Body style={{ height: isMobile ? 'auto' : 'calc(100vh - 65px)' }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #dee2e6",
                flexWrap: "wrap",
                marginTop: -15
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
              <Fluid xs={[100]} rowGap={10} className="mt-3">
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
                  gap: "10px",
                  height: isMobile ? 'auto' : 'calc(100vh - 130px)'
                }}>
                  <Card style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card.Body>{renderEmpresa()}</Card.Body>
                  </Card>

                  <Card style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card.Body>{renderLocalizacao()}</Card.Body>
                  </Card>

                  <Card style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card.Body>{renderContato()}</Card.Body>
                  </Card>

                  <Card style={{ height: isMobile ? 'auto' : '100%' }}>
                    <Card.Body>{renderInstalacao()}</Card.Body>
                  </Card>
                </div>
              </Fluid>
            )}

            {activeTab === "franquias" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
                {renderFranquias()}
              </Fluid>
            )}

            {activeTab === "extras" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
                <p className="text-muted"></p>
              </Fluid>
            )}

            {activeTab === "financeiro" && (
              <Fluid xs={[100]} rowGap={16} className="mt-3">
               <p className="text-muted"></p>
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
                  onChange={(e) => setFormData({ ...formData, observacoes: toUpperCase(e.target.value) })}
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
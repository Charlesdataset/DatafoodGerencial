import { faEdit, faPlus, faRedo, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { useMessageBox } from "../../../contexts/MessageBoxContext";
import { api } from "../../../services/api";
import type { Cidade } from "../types/Cidade";
import Select from "../../../components/Inputs/Select/Select";
import DataGrid from "../../../components/DataGrid/DataGrid";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";

interface CidadeListProps {
  onRegister: () => void;
  onEdit: (row: Cidade) => void;
}

const ufOptions = [
  { value: "", label: "Todos" },
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

const orderOptions = [
  { value: "code", label: "Código" },
  { value: "description", label: "Descrição" },
];

const CidadeList: React.FC<CidadeListProps> = ({ onRegister, onEdit }) => {
  const [textoBusca, setTextoBusca] = useState("");
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [ufFiltro, setUfFiltro] = useState("");
  const [order, setOrder] = useState("code");
  const [refreshKey, setRefreshKey] = useState(0);
  const messageBox = useMessageBox();
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buscarCidades = useCallback(
    async (busca: string, uf: string, orderSelecionado: string, deveCarregar = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (deveCarregar) setCarregandoBusca(true);
      setRefreshKey((prev) => prev + 1);

      try {
        const response = await api.get("/gerencial/cidade", {
          params: {
            search: busca || undefined,
            uf: uf || undefined,
            order: orderSelecionado || undefined,
          },
          signal: controller.signal,
        });

        if (isMounted.current && response) {
          if (response.status === 200) {
            setCidades(response.data.result || []);
            setCarregou(true);
          } else {
            setCidades([]);
            toast.error("Erro ao carregar cidades");
          }
        }
      } catch (error: any) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }
        if (isMounted.current) {
          console.error("Erro ao buscar cidades:", error);
          toast.error("Erro ao carregar cidades");
          setCidades([]);
        }
      } finally {
        if (isMounted.current && deveCarregar) setCarregandoBusca(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!carregou) {
      buscarCidades("", ufFiltro, order, true);
    }
  }, [carregou, buscarCidades, ufFiltro, order]);

  useEffect(() => {
    if (!carregou) return;
    const timer = setTimeout(() => {
      buscarCidades(textoBusca, ufFiltro, order, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca, carregou, buscarCidades, ufFiltro, order]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleDelete = async (id: number, nome: string) => {
    const confirmado = await messageBox.confirm({
      message: `Excluir cidade ${nome}?`,
      title: "Atenção",
      type: "warning",
    });

    if (!confirmado) return;

    try {
      await api.delete(`/gerencial/cidade/${id}`);
      toast.success("Cidade excluída com sucesso");
      buscarCidades(textoBusca, ufFiltro, order, true);
    } catch (error: any) {
      console.error("Erro ao excluir cidade:", error);
      toast.error("Erro ao excluir cidade");
    }
  };

  const columns: ExtendedColumnDef<Cidade>[] = [
    {
      header: "Código",
      accessorKey: "id_cidade",
      width: 80,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Nome",
      accessorKey: "nome",
      width: 200,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "UF",
      accessorKey: "uf",
      width: 60,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Código IBGE",
      accessorKey: "codigo_ibge",
      width: 120,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => info.getValue() || "-",
    },
    {
      header: "Status",
      accessorKey: "ativo",
      width: 100,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => {
        const ativo = info.getValue() as boolean;
        return (
          <span className={`badge ${ativo ? "bg-success" : "bg-secondary"}`}>
            {ativo ? "Ativo" : "Inativo"}
          </span>
        );
      },
    },
    {
      header: "Ações",
      width: 80,
      maxWidth: 80,
      minWidth: 80,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <FontAwesomeIcon
            icon={faEdit}
            onClick={() => onEdit(info.row.original)}
            title="Editar"
            style={{
              color: "#22c55e",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#16a34a";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#22c55e";
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
          <FontAwesomeIcon
            icon={faTrash}
            onClick={() => handleDelete(info.row.original.id_cidade, info.row.original.nome)}
            title="Excluir"
            style={{
              color: "#ef4444",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Card.Body>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <TextSearch
              isLoading={carregandoBusca}
              placeholder="Digite para buscar..."
              value={textoBusca}
              onChange={(e) => setTextoBusca(e.target.value)}
            />
          </div>

          <FormButton
            isLoading={carregandoBusca}
            loadAlone
            variant="text"
            onClick={() => buscarCidades(textoBusca, ufFiltro, order, true)}
          >
            <FontAwesomeIcon icon={faRedo} />
          </FormButton>

          <div style={{ minWidth: "130px" }}>
            <Select
              label="UF"
              value={ufFiltro}
              options={ufOptions}
              onChange={(value: string) => {
                setUfFiltro(value);
                buscarCidades(textoBusca, value, order, true);
              }}
            />
          </div>

          <div style={{ minWidth: "130px" }}>
            <Select
              label="Ordenar por"
              value={order}
              options={orderOptions}
              onChange={(value: string) => {
                setOrder(value);
                buscarCidades(textoBusca, ufFiltro, value, true);
              }}
            />
          </div>

          <FormButton className="justify-content-center" onClick={onRegister}>
            <FontAwesomeIcon icon={faPlus} color="#fff" />
            Nova Cidade
          </FormButton>
        </div>

        <DataGrid
          columns={columns}
          data={cidades}
          refreshKey={refreshKey}
          autoPageSizeOnDesktop
          offsets={12}
          emptyMessage="Nenhuma cidade encontrada"
        />
      </Card.Body>
    </Card>
  );
};

export default CidadeList;
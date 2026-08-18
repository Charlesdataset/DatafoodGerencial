import { faPlus, faRedo, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { useMessageBox } from "../../../contexts/MessageBoxContext";
import { api } from "../../../services/api";
import type { Cliente } from "../types/Cliente";
import Select from "../../../components/Inputs/Select/Select";
import DataGrid from "../../../components/DataGrid/DataGrid";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";

interface ClienteListProps {
  onRegister: () => void;
  onEdit: (row: Cliente) => void;
}

const franquiaOptions = [
  { value: "", label: "Todos" },
  { value: "1", label: "DATASET" },
  { value: "2", label: "ARS" },
  { value: "3", label: "GIGABYTE" },
];

const orderOptions = [
  { value: "code", label: "Código" },
  { value: "description", label: "Descrição" },
];

const ClienteList: React.FC<ClienteListProps> = ({ onRegister, onEdit }) => {
  const [textoBusca, setTextoBusca] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [franchise, setFranchise] = useState("");
  const [order, setOrder] = useState("code");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messageBox = useMessageBox();
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dataRoute = JSON.parse(localStorage.getItem('dataRouteCliente') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;
  const podeExcluir = dataRoute.excluir || false;

  const buscarClientes = useCallback(
    async (busca: string, franquiaSelecionada: string, orderSelecionado: string, deveCarregar = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (deveCarregar) setCarregandoBusca(true);
      setRefreshKey((prev) => prev + 1);

      try {
        const response = await api.get("/gerencial/cliente", {
          params: {
            search: busca,
            franchise: franquiaSelecionada ? parseInt(franquiaSelecionada) : "",
            order: orderSelecionado,
            ocious: false,
            pageCurrent: 1,
            pageSize: 100,
          },
          signal: controller.signal,
        });

        if (isMounted.current && response) {
          if (response.status === 200) {
            setClientes(response.data.result || []);
            setCarregou(true);
          } else {
            setClientes([]);
            toast.error("Erro ao carregar clientes");
          }
        }
      } catch (error: any) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }
        if (isMounted.current) {
          console.error("Erro ao buscar clientes:", error);
          toast.error("Erro ao carregar clientes");
          setClientes([]);
        }
      } finally {
        if (isMounted.current && deveCarregar) setCarregandoBusca(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!carregou) {
      buscarClientes("", franchise, order, true);
    }
  }, [carregou, buscarClientes, franchise, order]);

  useEffect(() => {
    if (!carregou) return;
    const timer = setTimeout(() => {
      buscarClientes(textoBusca, franchise, order, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca, carregou, buscarClientes, franchise, order]);

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
    if (!podeExcluir) {
      toast.error("Você não tem permissão para excluir clientes");
      return;
    }

    const confirmado = await messageBox.confirm({
      message: `Excluir cliente ${nome}?`,
      title: "Atenção",
      type: "warning",
    });

    if (!confirmado) return;

    try {
      await api.delete(`/gerencial/cliente/${id}`);
      toast.success("Cliente excluído com sucesso");
      buscarClientes(textoBusca, franchise, order, true);
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  const handleEditClick = (row: Cliente) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a edição");
      return;
    }
    onEdit(row);
  };

  const columns: ExtendedColumnDef<Cliente>[] = [
    {
      header: "Código",
      accessorKey: "id_cliente",
      width: 80,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Razão Social",
      accessorKey: "razao_social",
      width: 180,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "CNPJ",
      accessorKey: "cnpj",
      width: 160,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Telefone",
      accessorKey: "telefone",
      width: 130,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Cidade",
      accessorKey: "cidade",
      width: 150,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "UF",
      accessorKey: "uf",
      width: 50,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Franquia",
      accessorKey: "franquia",
      width: 120,
      headerAlign: "center",
      textAlign: "center",
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
          {podeEntrar && (
            <FontAwesomeIcon
              icon={faEdit}
              onClick={() => handleEditClick(info.row.original)}
              title="Editar"
              style={{
                color: "#42ab8a",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#3a9a7a";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#42ab8a";
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          )}
          {podeExcluir && (
            <FontAwesomeIcon
              icon={faTrash}
              onClick={() => handleDelete(info.row.original.id_cliente, info.row.original.razao_social)}
              title="Excluir"
              style={{
                color: "#ef4444",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.15s"
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
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Card.Body>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'flex-end', 
          gap: '8px',
          rowGap: isMobile ? '16px' : '8px',
          width: '100%'
        }}>
          {/* LINHA 1: Busca + Reload */}
          <div style={{ 
            display: 'flex', 
            flex: isMobile ? '1 1 100%' : 1,
            minWidth: isMobile ? '100%' : '150px',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            <div style={{ flex: 1 }}>
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
              onClick={() => buscarClientes(textoBusca, franchise, order, true)}
            >
              <FontAwesomeIcon icon={faRedo} />
            </FormButton>
          </div>

          {/* LINHA 2: Franquia + Ordenar */}
          <div style={{ 
            display: 'flex', 
            flex: isMobile ? '1 1 100%' : '0 1 auto',
            minWidth: isMobile ? '100%' : 'auto',
            alignItems: 'flex-end',
            gap: '8px',
            flexWrap: isMobile ? 'nowrap' : 'wrap'
          }}>
            <div style={{ 
              flex: 1,
              minWidth: isMobile ? 0 : '130px',
            }}>
              <Select
                label="Franquia"
                value={franchise}
                options={franquiaOptions}
                onChange={(value: string) => {
                  setFranchise(value);
                  buscarClientes(textoBusca, value, order, true);
                }}
              />
            </div>

            <div style={{ 
              flex: 1,
              minWidth: isMobile ? 0 : '130px',
            }}>
              <Select
                label="Ordenar por"
                value={order}
                options={orderOptions}
                onChange={(value: string) => {
                  setOrder(value);
                  buscarClientes(textoBusca, franchise, value, true);
                }}
              />
            </div>
          </div>      
          {podeIncluir && (
            <div style={{ 
              flex: isMobile ? '1 1 100%' : '0 1 auto',
              minWidth: isMobile ? '100%' : 'auto',
              width: isMobile ? '100%' : 'auto',
            }}>
              <FormButton 
                className="justify-content-center" 
                onClick={onRegister}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  background: "#42ab8a",
                  border: "1px solid #42ab8a",
                  color: "#ffffff",
                }}
              >
                <FontAwesomeIcon icon={faPlus} color="#fff" />
                Novo Cliente
              </FormButton>
            </div>
          )}
        </div>

        <DataGrid
          columns={columns}
          data={clientes}
          refreshKey={refreshKey}
          autoPageSizeOnDesktop
          offsets={12}
          emptyMessage="Nenhum cliente encontrado"
        />
      </Card.Body>
    </Card>
  );
};

export default ClienteList;


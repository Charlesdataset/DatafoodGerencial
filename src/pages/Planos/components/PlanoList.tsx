import { faEdit, faPlus, faRedo, faTrash, faTags } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { useMessageBox } from "../../../contexts/MessageBoxContext";
import { api } from "../../../services/api";
import type { Plano } from "../types/Plano";
import Select from "../../../components/Inputs/Select/Select";
import DataGrid from "../../../components/DataGrid/DataGrid";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import { Switch } from "../../../components/Switch/Switch";

interface PlanoListProps {
  onRegister: () => void;
  onEdit: (row: Plano) => void;
}

const orderOptions = [
  { value: "code", label: "Código" },
  { value: "description", label: "Descrição" },
];

const PlanoList: React.FC<PlanoListProps> = ({ onRegister, onEdit }) => {
  const [textoBusca, setTextoBusca] = useState("");
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [carregou, setCarregou] = useState(false);
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

  // PERMISSÕES LIDAS DIRETO DO LOCALSTORAGE A CADA RENDER
  // (mesmo padrão usado em ClienteList) para nunca ficar desatualizado
  // após login/navegação, sem depender do evento 'focus' da janela.
  const dataRoute = JSON.parse(localStorage.getItem('dataRoutePlano') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;
  const podeExcluir = dataRoute.excluir || false;
  const podeEditar = dataRoute.editar || false;

  const buscarPlanos = useCallback(
    async (busca: string, orderSelecionado: string, deveCarregar = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (deveCarregar) setCarregandoBusca(true);
      setRefreshKey((prev) => prev + 1);

      try {
        const response = await api.get("/gerencial/planos", {
          params: {
            search: busca || undefined,
            order: orderSelecionado || undefined,
          },
          signal: controller.signal,
        });

        if (isMounted.current && response) {
          if (response.status === 200) {
            setPlanos(response.data || []);
            setCarregou(true);
          } else {
            setPlanos([]);
            toast.error("Erro ao carregar planos");
          }
        }
      } catch (error: any) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }
        if (isMounted.current) {
          console.error("Erro ao buscar planos:", error);
          toast.error("Erro ao carregar planos");
          setPlanos([]);
        }
      } finally {
        if (isMounted.current && deveCarregar) setCarregandoBusca(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!carregou) {
      buscarPlanos("", order, true);
    }
  }, [carregou, buscarPlanos, order]);

  useEffect(() => {
    if (!carregou) return;
    const timer = setTimeout(() => {
      buscarPlanos(textoBusca, order, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca, carregou, buscarPlanos, order]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleDelete = async (id: number, descricao: string) => {
    if (!podeExcluir) {
      toast.error("Você não tem permissão para excluir planos");
      return;
    }

    const confirmado = await messageBox.confirm({
      message: `Excluir plano ${descricao}?`,
      title: "Atenção",
      type: "warning",
    });

    if (!confirmado) return;

    try {
      await api.delete(`/gerencial/planos/${id}`);
      toast.success("Plano excluído com sucesso");
      buscarPlanos(textoBusca, order, true);
    } catch (error: any) {
      console.error("Erro ao excluir plano:", error);
      toast.error("Erro ao excluir plano");
    }
  };

  const handleEditClick = (row: Plano) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a edição");
      return;
    }
    onEdit(row);
  };

  const handleToggleAtivo = async (plano: Plano) => {
    if (!podeEditar) {
      toast.error("Você não tem permissão para editar planos");
      return;
    }

    try {
      const novoStatus = !plano.ativo;

      await api.put("/gerencial/planos", {
        id_plano: plano.id_plano,
        ativo: novoStatus,
      });

      toast.success(`Plano ${novoStatus ? "ativado" : "desativado"} com sucesso`);
      buscarPlanos(textoBusca, order, true);
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      toast.error(error.response?.data?.message || "Erro ao alterar status do plano");
    }
  };

  const columns: ExtendedColumnDef<Plano>[] = [
    {
      header: "ID",
      accessorKey: "id_plano",
      width: 90,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Descrição",
      accessorKey: "descricao",
      width: 260,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "Resumo",
      accessorKey: "resumo",
      width: 230,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "Caixas",
      accessorKey: "caixasMax",
      width: 100,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Usuários",
      accessorKey: "usuariosMax",
      width: 110,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Valor Mensal",
      accessorKey: "valorMensal",
      width: 160,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => {
        const valor = info.getValue() as number;
        return `R$ ${valor.toFixed(2)}`;
      },
    },
    {
      header: "Status",
      accessorKey: "ativo",
      width: 110,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => {
        const row = info.row.original;
        return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Switch
              checked={row.ativo}
              onChange={() => handleToggleAtivo(row)}
              disabled={!podeEditar}
              size="sm"
              style={{
                '--switch-color': '#42ab8a',
                '--switch-checked-color': '#42ab8a'
              } as React.CSSProperties}
            />
          </div>
        );
      },
    },
    {
      header: "Ações",
      width: 100,
      maxWidth: 100,
      minWidth: 100,
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
              }}
            />
          )}
          {podeExcluir && (
            <FontAwesomeIcon
              icon={faTrash}
              onClick={() => handleDelete(info.row.original.id_plano, info.row.original.descricao)}
              title="Excluir"
              style={{
                color: "#ef4444",
                fontSize: "16px",
                cursor: "pointer",
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
        {isMobile ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", width: "100%" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
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
                onClick={() => buscarPlanos(textoBusca, order, true)}
              >
                <FontAwesomeIcon icon={faRedo} />
              </FormButton>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", width: "100%", marginTop: "8px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Select
                  label="Ordenar por"
                  value={order}
                  options={orderOptions}
                  onChange={(value: string) => {
                    setOrder(value);
                    buscarPlanos(textoBusca, value, true);
                  }}
                />
              </div>

              {podeIncluir && (
                <FormButton
                  className="justify-content-center"
                  onClick={onRegister}
                  style={{
                    flex: 1,
                    background: "#42ab8a",
                    border: "1px solid #42ab8a",
                    color: "#ffffff",
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} color="#fff" />
                  Novo Plano
                </FormButton>
              )}
            </div>
          </>
        ) : (
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
              onClick={() => buscarPlanos(textoBusca, order, true)}
            >
              <FontAwesomeIcon icon={faRedo} />
            </FormButton>

            <div style={{ minWidth: "130px" }}>
              <Select
                label="Ordenar por"
                value={order}
                options={orderOptions}
                onChange={(value: string) => {
                  setOrder(value);
                  buscarPlanos(textoBusca, value, true);
                }}
              />
            </div>

            {podeIncluir && (
              <FormButton
                className="justify-content-center"
                onClick={onRegister}
                style={{
                  background: "#42ab8a",
                  border: "1px solid #42ab8a",
                  color: "#ffffff",
                }}
              >
                <FontAwesomeIcon icon={faPlus} color="#fff" />
                Novo Plano
              </FormButton>
            )}
          </div>
        )}

        <DataGrid
          columns={columns}
          data={planos}
          refreshKey={refreshKey}
          autoPageSizeOnDesktop
          offsets={12}
          emptyMessage="Nenhum plano encontrado"
        />
      </Card.Body>
    </Card>
  );
};

export default PlanoList;

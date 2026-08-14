import { faEdit, faPlus, faRedo, faTrash, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../../components/Card/Card";
import { FormButton } from "../../../components/Inputs/Button/FormButton";
import { TextSearch } from "../../../components/Inputs/TextSearch/TextSearch";
import { useMessageBox } from "../../../contexts/MessageBoxContext";
import { api } from "../../../services/api";
import type { Usuario } from "../types/Usuario";
import Select from "../../../components/Inputs/Select/Select";
import DataGrid from "../../../components/DataGrid/DataGrid";
import type { ExtendedColumnDef } from "../../../components/DataGrid/DataGrid";
import { Switch } from "../../../components/Switch/Switch";

interface UsuarioListProps {
  onRegister: () => void;
  onEdit: (row: Usuario) => void;
}

const orderOptions = [
  { value: "description", label: "Nome" },
];

const franquiaOptions = [
  { value: "1", label: "DATASET" },
  { value: "2", label: "ARS" },
  { value: "3", label: "GIGABYTE" },
];

const UsuarioList: React.FC<UsuarioListProps> = ({ onRegister, onEdit }) => {
  const [textoBusca, setTextoBusca] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [order, setOrder] = useState("description");
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtroFranquia, setFiltroFranquia] = useState<string>("1");
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

  const dataRoute = JSON.parse(localStorage.getItem('dataRoute') || '{}');
  const podeIncluir = dataRoute.incluir || false;
  const podeEntrar = dataRoute.entrar || false;
  const podeExcluir = dataRoute.excluir || false;
  const podeEditar = dataRoute.editar || false;

  const buscarUsuarios = useCallback(
    async (busca: string, orderSelecionado: string, franquiaId: string, deveCarregar = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (deveCarregar) setCarregandoBusca(true);
      setRefreshKey((prev) => prev + 1);

      try {
        const response = await api.get(`/gerencial/usuarios/${franquiaId}`, {
          params: {
            search: busca || undefined,
          },
          signal: controller.signal,
        });

        if (isMounted.current && response) {
          if (response.status === 200) {
            setUsuarios(response.data || []);
            setCarregou(true);
          } else {
            setUsuarios([]);
            toast.error("Erro ao carregar usuários");
          }
        }
      } catch (error: any) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }
        if (isMounted.current) {
          console.error("Erro ao buscar usuários:", error);
          toast.error("Erro ao carregar usuários");
          setUsuarios([]);
        }
      } finally {
        if (isMounted.current && deveCarregar) setCarregandoBusca(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!carregou) {
      buscarUsuarios("", order, filtroFranquia, true);
    }
  }, [carregou, buscarUsuarios, order, filtroFranquia]);

  useEffect(() => {
    if (!carregou) return;
    const timer = setTimeout(() => {
      buscarUsuarios(textoBusca, order, filtroFranquia, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusca, carregou, buscarUsuarios, order, filtroFranquia]);

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
      toast.error("Você não tem permissão para excluir usuários");
      return;
    }

    const confirmado = await messageBox.confirm({
      message: `Excluir usuário ${nome}?`,
      title: "Atenção",
      type: "warning",
    });

    if (!confirmado) return;

    try {
      await api.delete(`/gerencial/usuarios/${id}`);
      toast.success("Usuário excluído com sucesso");
      buscarUsuarios(textoBusca, order, filtroFranquia, true);
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleEditClick = (row: Usuario) => {
    if (!podeEntrar) {
      toast.error("Você não tem permissão para acessar a edição");
      return;
    }
    onEdit(row);
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    if (!podeEditar) {
      toast.error("Você não tem permissão para editar usuários");
      return;
    }

    try {
      const novoStatus = !usuario.ativo;
      await api.put("/gerencial/usuarios", {
        id_usuario: usuario.idUsuario,
        ativo: novoStatus,
      });
      
      toast.success(`Usuário ${novoStatus ? "ativado" : "desativado"} com sucesso`);
      buscarUsuarios(textoBusca, order, filtroFranquia, true);
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const columns: ExtendedColumnDef<Usuario>[] = [
    {
      header: "Código",
      accessorKey: "idUsuario",
      width: 80,
      headerAlign: "center",
      textAlign: "center",
    },
    {
      header: "Nome",
      accessorKey: "nome",
      width: 180,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "Franquia",
      accessorKey: "franquia",
      width: 120,
      headerAlign: "left",
      textAlign: "left",
    },
    {
      header: "Permissões",
      accessorKey: "permissoes",
      width: 220,
      headerAlign: "center",
      textAlign: "center",
      cell: (info) => {
        const row = info.row.original;
        const permissoes = [
          { key: "entrar", label: "Entrar", color: "info" },
          { key: "editar", label: "Editar", color: "warning" },
          { key: "excluir", label: "Excluir", color: "danger" },
          { key: "incluir", label: "Incluir", color: "success" },
          { key: "relatorio", label: "Relatório", color: "secondary" },
        ];
        const ativas = permissoes.filter(p => row[p.key as keyof Usuario] === true);
        if (ativas.length === 0) {
          return <span className="text-muted">Nenhuma</span>;
        }
        return (
          <div className="d-flex gap-1 flex-wrap justify-content-center">
            {ativas.map(p => (
              <span key={p.key} className={`badge bg-${p.color}`}>{p.label}</span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "ativo",
      width: 80,
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
              }}
            />
          )}
          {podeExcluir && (
            <FontAwesomeIcon
              icon={faTrash}
              onClick={() => handleDelete(info.row.original.idUsuario, info.row.original.nome)}
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
              onClick={() => buscarUsuarios(textoBusca, order, filtroFranquia, true)}
            >
              <FontAwesomeIcon icon={faRedo} />
            </FormButton>
          </div>

          {/* LINHA 2: Franquia + Ordenar por */}
          <div style={{ 
            display: 'flex', 
            flex: isMobile ? '1 1 100%' : '0 1 auto',
            minWidth: isMobile ? '100%' : 'auto',
            alignItems: 'flex-end',
            gap: '8px',
            flexWrap: isMobile ? 'nowrap' : 'wrap'
          }}>
            <div style={{ 
              flex: isMobile ? 1 : '0 1 auto',
              minWidth: isMobile ? '50%' : '130px',
            }}>
              <Select
                label="Franquia"
                value={filtroFranquia}
                options={franquiaOptions}
                onChange={(value: string) => {
                  setFiltroFranquia(value);
                  buscarUsuarios(textoBusca, order, value, true);
                }}
              />
            </div>

            <div style={{ 
              flex: isMobile ? 1 : '0 1 auto',
              minWidth: isMobile ? '50%' : '130px',
            }}>
              <Select
                label="Ordenar por"
                value={order}
                options={orderOptions}
                onChange={(value: string) => {
                  setOrder(value);
                  buscarUsuarios(textoBusca, value, filtroFranquia, true);
                }}
              />
            </div>
          </div>

          {/* LINHA 3: Novo Usuário */}
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
                Novo Usuário
              </FormButton>
            </div>
          )}
        </div>

        <DataGrid
          columns={columns}
          data={usuarios}
          refreshKey={refreshKey}
          autoPageSizeOnDesktop
          offsets={12}
          emptyMessage="Nenhum usuário encontrado"
        />
      </Card.Body>
    </Card>
  );
};

export default UsuarioList;
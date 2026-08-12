import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Checkbox } from "../../components/CheckBox/CheckBox";
import { useApp } from "../../contexts/AppContext";
import { useRememberMe } from "../../hooks/userRememberMe";
import AuthSimpleLayout from "../../layouts/Auth/AuthSimpleLayout";
import { api } from "../../services/api";
import "../../styles/components/_button.scss";
import "../../styles/components/_checkbox.scss";
import "../../styles/components/_input.scss";
import "../../styles/components/_select.scss";
import { maskCnpj, unMask } from "../../utils/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface Usuario {
  idUsuario: number;
  nome: string;
  franquiaId: number;
  franquia: string;
  cnpj: string;
  empresa: string;
}

const Login = () => {
  const [currUser, setcurrUser] = useState({ codigo: "", senha: "", cnpj: "" });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [cnpjValido, setCnpjValido] = useState(false);
  const { lembrar, credentials, saveCredentials, toggleLembrar } = useRememberMe();
  const nomeRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, setCompanyInfo } = useApp();
  const cnpjRef = useRef<HTMLInputElement>(null);

  // 🔥 FUNÇÃO PARA VOLTAR PARA A PRIMEIRA ETAPA
  const voltarPrimeiraEtapa = () => {
    setcurrUser({ codigo: "", senha: "", cnpj: "" });
    setUsuarios([]);
    setCnpjValido(false);
    navigate("/login", { replace: true });
    setTimeout(() => cnpjRef.current?.focus(), 100);
  };

  const carregarUsuarios = async (cnpj: string) => {
    if (!cnpj || cnpj.length < 14) {
      setUsuarios([]);
      setCnpjValido(false);
      return;
    }

    setCarregandoUsuarios(true);
    try {
      const response = await api.get("/gerencial/usuarios", {
        headers: { cnpj: cnpj }
      });

      if (response.status === 200) {
        const usuariosData = response.data;
        if (usuariosData && usuariosData.length > 0) {
          setUsuarios(usuariosData);
          setCnpjValido(true);
          
          const primeiroUsuario = usuariosData[0];
          setCompanyInfo({
            idCli: primeiroUsuario.idUsuario,
            nomeCli: primeiroUsuario.empresa,
            cnpj: cnpj,
            franquia: primeiroUsuario.franquia,
          });

          const codigoSalvo = localStorage.getItem('remember_codigo');
          const senhaSalva = localStorage.getItem('remember_senha');
          
          if (codigoSalvo) {
            const usuarioSalvo = usuariosData.find(
              (u) => String(u.idUsuario) === String(codigoSalvo)
            );
            if (usuarioSalvo) {
              setcurrUser({
                codigo: String(usuarioSalvo.idUsuario),
                senha: senhaSalva || "",
                cnpj: cnpj,
              });
              if (senhaSalva) {
                setTimeout(() => senhaRef.current?.focus(), 200);
              }
            }
          }
        } else {
          setUsuarios([]);
          setCnpjValido(false);
          toast.error("Nenhum usuário encontrado para este CNPJ");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsuarios([]);
      setCnpjValido(false);
      toast.error("CNPJ inválido ou empresa não encontrada");
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  useEffect(() => {
    const cnpjSalvo = localStorage.getItem('remember_cnpj');
    const codigoSalvo = localStorage.getItem('remember_codigo');
    const senhaSalva = localStorage.getItem('remember_senha');
    
    if (lembrar && cnpjSalvo) {
      setcurrUser({
        cnpj: cnpjSalvo,
        codigo: codigoSalvo || "",
        senha: senhaSalva || "",
      });
      carregarUsuarios(cnpjSalvo);
      navigate(`?cnpj=${cnpjSalvo}`, { replace: true });
      return;
    }

    const cnpj = new URLSearchParams(window.location.search).get("cnpj");
    if (cnpj && cnpj !== "") {
      setcurrUser((prev) => ({ ...prev, cnpj: cnpj }));
      carregarUsuarios(cnpj);
    }

    if (cnpjRef.current && !currUser.cnpj) {
      cnpjRef.current.focus();
    }
  }, []);

  const fazerLogin = async () => {
    try {
      setIsLoading(true);

      const cnpj = currUser.cnpj;

      if (!cnpj) {
        toast.error("CNPJ é obrigatório!");
        setIsLoading(false);
        return;
      }

      if (!currUser.codigo) {
        toast.error("Selecione um usuário!");
        setIsLoading(false);
        return;
      }

      const cnpjLimpo = unMask(cnpj);

      const loginData = {
        codigo: currUser.codigo,
        senha: currUser.senha,
      };

      const res = await api.post("/auth/login", loginData, {
        headers: { cnpj: cnpjLimpo },
      });

      if (res?.status === 200 || res?.status === 201) {
        localStorage.setItem("tokenDataFood", res.data.access_token);
        localStorage.setItem("cnpj", cnpjLimpo);

        localStorage.setItem('remember_cnpj', cnpjLimpo);
        localStorage.setItem('remember_codigo', currUser.codigo);
        localStorage.setItem('remember_senha', currUser.senha);
        saveCredentials(currUser.codigo, currUser.senha, cnpjLimpo);

        if (res.data.user?.permissoes) {
          const dataRoute = {
            entrar: res.data.user.permissoes.entrar || false,
            editar: res.data.user.permissoes.editar || false,
            excluir: res.data.user.permissoes.excluir || false,
            incluir: res.data.user.permissoes.incluir || false,
            relatorio: res.data.user.permissoes.relatorio || false,
          };
          localStorage.setItem('dataRoute', JSON.stringify(dataRoute));
        }

        setUser(res.data.user);

        const usuarioSelecionado = usuarios.find(
          (u) => u.idUsuario === parseInt(currUser.codigo)
        );
        if (usuarioSelecionado) {
          setCompanyInfo({
            idCli: usuarioSelecionado.idUsuario,
            nomeCli: usuarioSelecionado.empresa,
            cnpj: cnpjLimpo,
            franquia: usuarioSelecionado.franquia,
          });
        }

        toast.success("Login realizado com sucesso!");
        setIsAuthenticated(true);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Erro ao realizar login!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const usuarioOptions = usuarios.map((usuario) => ({
    value: String(usuario.idUsuario),
    label: usuario.nome,
  }));

  return (
    <AuthSimpleLayout>
      <div className="form-group">
        {/* 🔥 BOTÃO VOLTAR NO TOPO */}
        {cnpjValido && (
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-start", 
            marginBottom: "16px" 
          }}>
            <button
              type="button"
              onClick={voltarPrimeiraEtapa}
              style={{
                background: "transparent",
                border: "none",
                color: "#6c757d",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar
            </button>
          </div>
        )}

        <div className="field" style={{ marginBottom: "16px" }}>
          <label htmlFor="cnpj" className="form-label">
            CNPJ
          </label>
          <input
            type="text"
            id="cnpj"
            ref={cnpjRef}
            value={maskCnpj(currUser.cnpj ?? "")}
            placeholder="00.000.000/0000-00"
            onChange={(e) => {
              const newCnpj = unMask(e.target.value);
              navigate(`?cnpj=${newCnpj}`, { replace: true });
              setcurrUser({ ...currUser, cnpj: newCnpj });

              if (newCnpj.length === 14) {
                carregarUsuarios(newCnpj);
              } else {
                setUsuarios([]);
                setCnpjValido(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const cnpjLimpo = unMask(currUser.cnpj);
                if (cnpjLimpo.length === 14) {
                  carregarUsuarios(cnpjLimpo);
                }
              }
            }}
            onKeyUp={(e) => {
              const value = cnpjRef.current?.value || '';
              const unMasked = unMask(value);
              const navigationKeys = ['Backspace', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'];
              if (!navigationKeys.includes(e.key) && unMasked.length === 14) {
                nomeRef.current?.focus();
              }
            }}
            className="form-input"
          />
          {carregandoUsuarios && (
            <small style={{ color: "#6c757d" }}>Carregando usuários...</small>
          )}
        </div>

        {cnpjValido && usuarios.length > 0 && (
          <div className="field" style={{ marginBottom: "16px" }}>
            <label htmlFor="usuario" className="form-label">
              Usuário
            </label>
            <select
              id="usuario"
              value={currUser.codigo}
              onChange={(e) => {
                setcurrUser({ ...currUser, codigo: e.target.value });
                if (e.target.value) {
                  setTimeout(() => senhaRef.current?.focus(), 100);
                }
              }}
              className="form-input"
              style={{
                width: "100%",
                height: "48px",
                border: "2px solid #e8ecf1",
                borderRadius: "12px",
                padding: "0 16px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "'Outfit', sans-serif",
                color: "#1a2a3a",
                background: "transparent",
                transition: "all 0.2s ease",
                appearance: "auto",
                cursor: "pointer",
              }}
            >
              <option value="">Selecione um usuário</option>
              {usuarioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {currUser.codigo && (
          <div className="field" style={{ marginBottom: "16px" }}>
            <label htmlFor="senha" className="form-label">
              Senha
            </label>
            <input
              type="password"
              className="form-input"
              ref={senhaRef}
              id="senha"
              value={currUser.senha}
              onChange={(e) => setcurrUser({ ...currUser, senha: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && fazerLogin()}
              placeholder="Digite sua senha"
            />
          </div>
        )}

        <Checkbox
          label="Lembrar-me"
          className="mt-3"
          checked={lembrar}
          onChange={(e) => toggleLembrar(e.target.checked)}
        />
      </div>

      <button
        onClick={fazerLogin}
        className="btn btn--primary btn--full"
        disabled={isLoading || !currUser.cnpj || !currUser.codigo || !currUser.senha}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </AuthSimpleLayout>
  );
};

export default Login;
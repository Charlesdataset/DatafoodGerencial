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

const Login = () => {
  const [currUser, setcurrUser] = useState({ codigo: "", senha: "", cnpj: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { lembrar, credentials, saveCredentials, toggleLembrar } = useRememberMe();
  const nomeRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const verifyTimeoutRef = useRef<number | null>(null);
  const hasShownToast = useRef(false);
  const isFirstRender = useRef(true);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, setCompanyInfo, companyInfo } = useApp();

  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, []);

  const handleVerifyFranchise = async (cnpj: string) => {
    const cnpjTrimed = cnpj.replace(/\D/g, '');
    if (cnpjTrimed.length === 14) {
      
      if (localStorage.getItem("franchiseValidationFailed") === "true") {
        return;
      }

      setIsVerifying(true);
      try {
        const res = await api.get(`franquias?cnpj=${cnpjTrimed}`);
        if (res?.status == 200) {
          setCompanyInfo(prev => ({ ...prev, franquia: res.data.franquia }));
          localStorage.removeItem("franchiseValidationFailed");
        }
      } catch (error) {
        // O AXIOS JÁ VAI MOSTRAR O TOAST
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const debouncedVerify = (value: string) => {
    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
      verifyTimeoutRef.current = null;
    }

    verifyTimeoutRef.current = setTimeout(() => {
      handleVerifyFranchise(value);
      verifyTimeoutRef.current = null;
    }, 800);
  };

  useEffect(() => {
    const cnpj = new URLSearchParams(window.location.search).get('cnpj');
    if (cnpjRef.current && (!cnpj || cnpj === '')) {
      cnpjRef.current.focus();
    }

    if (lembrar && credentials) {
      setcurrUser(credentials);
      if (credentials.codigo === "") {
        nomeRef.current?.focus();
      } else {
        senhaRef.current?.focus();
      }
    } else if (cnpj && cnpj !== "") {
      nomeRef.current?.focus();
    }
  }, [credentials, lembrar]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const cnpjLimpo = currUser.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length === 14) {
      debouncedVerify(currUser.cnpj);
    }
    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
    };
  }, [currUser.cnpj]);

  useEffect(() => {
    const cnpj = new URLSearchParams(window.location.search).get("cnpj");
    if (cnpj) {
      setcurrUser((prev) => ({ ...prev, cnpj }));
      isFirstRender.current = false;
    }
  }, []);

  const fazerLogin = async () => {
    hasShownToast.current = false;

    try {
      setIsLoading(true);
      const cnpj = new URLSearchParams(window.location.search).get("cnpj");

      if (!cnpj) {
        toast.error("CNPJ não encontrado!");
        return;
      }

      const res = await api.post("/auth/login", currUser, {
        headers: { 'cnpj': cnpj }
      });

      if (res?.status === 200 || res?.status === 201) {
        localStorage.setItem("tokenDataFood", res.data.access_token);
        localStorage.setItem("cnpj", cnpj);
        let site = "www.datasetsistemas.com.br";
        switch (companyInfo?.franquia) {
          case "GIGABYTE":
            site = "www.gigabyteautomacao.com.br";
            break;
          case "ARS":
            site = "www.arsautomacao.com.br";
            break;
        }

        setCompanyInfo(prev => ({ ...prev, cnpj: cnpj, idCli: Number(currUser.codigo), nomeCli: res.data.user.nome, site: site }));
        localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
        saveCredentials(currUser.codigo, currUser.senha, unMask(currUser.cnpj));
        setUser(res.data.user);

        // =============================================
        // SALVAR PERMISSÕES ESPECÍFICAS POR TELA
        // =============================================
        if (res.data.user?.permissoes) {
          const permissoes = res.data.user.permissoes;
          
          // PERMISSÕES DE CLIENTE
          const clientePermissoes = {
            entrar: permissoes.cliente_entrar || false,
            editar: permissoes.cliente_editar || false,
            excluir: permissoes.cliente_excluir || false,
            incluir: permissoes.cliente_incluir || false,
            relatorio: permissoes.cliente_relatorio || false,
          };
          localStorage.setItem('dataRouteCliente', JSON.stringify(clientePermissoes));

          // PERMISSÕES DE CIDADE
          const cidadePermissoes = {
            entrar: permissoes.cidade_entrar || false,
            editar: permissoes.cidade_editar || false,
            excluir: permissoes.cidade_excluir || false,
            incluir: permissoes.cidade_incluir || false,
            relatorio: permissoes.cidade_relatorio || false,
          };
          localStorage.setItem('dataRouteCidade', JSON.stringify(cidadePermissoes));

          // PERMISSÕES DE USUÁRIO
          const usuarioPermissoes = {
            entrar: permissoes.usuario_entrar || false,
            editar: permissoes.usuario_editar || false,
            excluir: permissoes.usuario_excluir || false,
            incluir: permissoes.usuario_incluir || false,
            relatorio: permissoes.usuario_relatorio || false,
          };
          localStorage.setItem('dataRouteUsuario', JSON.stringify(usuarioPermissoes));

          // PERMISSÕES DE PLANO
          const planoPermissoes = {
            entrar: permissoes.plano_entrar || false,
            editar: permissoes.plano_editar || false,
            excluir: permissoes.plano_excluir || false,
            incluir: permissoes.plano_incluir || false,
            relatorio: permissoes.plano_relatorio || false,
          };
          localStorage.setItem('dataRoutePlano', JSON.stringify(planoPermissoes));

          // PERMISSÕES GERAIS
          const permissoesGerais = {
            dashboard: permissoes.dashboard || false,
            configuracao: permissoes.configuracao || false,
          };
          localStorage.setItem('dataRouteGerais', JSON.stringify(permissoesGerais));
        }

        toast.success("Login realizado com sucesso!");
        setIsAuthenticated(true);
        navigate(`/dashboard`);
      }
    } catch (error: any) {
      if (!hasShownToast.current) {
        if (error.response?.status === 401) {
          toast.error("Usuário ou senha inválidos");
        } else {
          const message = error.response?.data?.message || "Erro ao realizar login!";
          toast.error(message);
        }
        hasShownToast.current = true;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const newCnpj = unMask(rawValue);
    navigate(`?cnpj=${newCnpj}`, { replace: true });
    setcurrUser((prev) => ({ ...prev, cnpj: newCnpj }));
    
    localStorage.removeItem("franchiseValidationFailed");
  };

  const handleCnpjKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nomeRef.current?.focus();
    }
  };

  const handleCnpjKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = cnpjRef.current?.value || '';
    const unMasked = unMask(value);
    const navigationKeys = ['Backspace', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'];
    if (!navigationKeys.includes(e.key) && unMasked.length === 14) {
      nomeRef.current?.focus();
    }
  };

  return (
    <AuthSimpleLayout>
      <div className="form-group">
        <div className="field mb-4">
          <label htmlFor="cnpj" className="form-label">
            CNPJ/CPF
          </label>
          <input
            type="text"
            id="cnpj"
            ref={cnpjRef}
            autoComplete="off"
            value={maskCnpj(currUser.cnpj ?? '')}
            placeholder="00.000.000/0000-00"
            onChange={handleCnpjChange}
            onKeyDown={handleCnpjKeyDown}
            onKeyUp={handleCnpjKeyUp}
            disabled={isVerifying}
            inputMode="numeric"
            className="form-input"
          />
          {isVerifying && <small className="text-muted">Verificando...</small>}
        </div>

        <div className="field">
          <label htmlFor="nome" className="form-label">
            Código
          </label>
          <input
            type="text"
            className="form-input"
            autoComplete="off"
            id="nome"
            ref={nomeRef}
            inputMode="numeric"
            value={currUser.codigo}
            onChange={(e) => setcurrUser((prev) => ({ ...prev, codigo: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && senhaRef.current?.focus()}
          />
        </div>

        <div className="field mt-4">
          <label htmlFor="senha" className="form-label">
            Senha
          </label>
          <input
            type="password"
            autoComplete="off"
            className="form-input"
            ref={senhaRef}
            id="senha"
            value={currUser.senha}
            onChange={(e) => setcurrUser((prev) => ({ ...prev, senha: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && fazerLogin()}
          />
        </div>

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
        disabled={isLoading || !currUser.codigo || !currUser.senha}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </AuthSimpleLayout>
  );
};

export default Login;

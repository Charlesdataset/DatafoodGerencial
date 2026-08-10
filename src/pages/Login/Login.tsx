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
  const { lembrar, credentials, saveCredentials, toggleLembrar } = useRememberMe();
  const nomeRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useApp();
  const cnpjRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cnpj = new URLSearchParams(window.location.search).get('cnpj');
    
    if (cnpj && cnpj !== '') {
      setcurrUser(prev => ({ ...prev, cnpj: cnpj }));
    }
    
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
    }
  }, []);

  const fazerLogin = async () => {
    try {
      setIsLoading(true);

      const cnpj = new URLSearchParams(window.location.search).get("cnpj");

      if (!cnpj) {
        toast.error("CNPJ não encontrado!");
        return;
      }

      // Envia apenas codigo e senha, o cnpj vai no header
      const loginData = {
        codigo: currUser.codigo,
        senha: currUser.senha
      };

      const res = await api.post("/auth/login", loginData, {
        headers: { 'cnpj': cnpj }
      });

      if (res?.status === 200 || res?.status === 201) {
        localStorage.setItem("tokenDataFood", res.data.access_token);
        localStorage.setItem("cnpj", cnpj);

        saveCredentials(currUser.codigo, currUser.senha, unMask(currUser.cnpj));
        setUser(res.data.user);
        toast.success("Login realizado com sucesso!");
        setIsAuthenticated(true);
        navigate(`/dashboard`);
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Erro ao realizar login!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSimpleLayout>
      <div className="form-group">
        <div className="field mb-4">
          <label htmlFor="cnpj" className="form-label">
            CNPJ
          </label>
          <input
            type="text"
            id="cnpj"
            ref={cnpjRef}
            value={maskCnpj(currUser.cnpj ?? '')}
            placeholder="00.000.000/0000-00"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                nomeRef.current?.focus();
              }
            }}
            onKeyUp={(e) => {
              if (e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Shift' && 
                  unMask(cnpjRef.current?.value || '').length === 14) {
                nomeRef.current?.focus();
              }
            }}
            onChange={(e) => {
              const newCnpj = unMask(e.target.value);
              navigate(`?cnpj=${newCnpj}`, { replace: true });
              setcurrUser({ ...currUser, cnpj: newCnpj });
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="nome" className="form-label">
            Código
          </label>
          <input
            type="text"
            className="form-input"
            id="nome"
            ref={nomeRef}
            value={currUser.codigo}
            onChange={(e) => setcurrUser({ ...currUser, codigo: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && senhaRef.current?.focus()}
          />
        </div>

        <div className="field mt-4">
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
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
// import "../styles/abstracts/_variables.scss";
import "../styles/components/_button.scss";
import "../styles/components/_checkbox.scss";
import "../styles/components/_input.scss";
import "../styles/components/_select.scss";
import type { EmpresaState, User } from "../types/auth.types";
import { maskCnpj, maskCpf, unMask } from "../utils/format";
import { Checkbox } from "./CheckBox/CheckBox";
import { FormButton } from "./Inputs/Button/FormButton";

interface LoginFormProps {
  setStep: (step: number) => void;
  step: number;
  onLoginSuccess?: () => Promise<void> | void;
}

const LoginForm: React.FC<LoginFormProps> = ({ setStep, step, onLoginSuccess }) => {
  const eventInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { setUser, setEventsList, setCurrentEvent, setIsLoading, isLoading } = useAuth();
  const [navigate, setNavigate] = useState(false);

  const [empresa, setEmpresa] = useState<EmpresaState>({
    userId: 0,
    password: "",
    cnpjCpf: "",
    remember: false,
  });

  const [users, setUsers] = useState<User[]>([]);

  // Foca o campo de senha ao avançar para o step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => passwordInputRef.current?.focus(), 0);
    }
  }, [step]);

  // Verifica se tem credenciais salvas
  useEffect(() => {
    const cnpjCpf = localStorage.getItem("cnpjCpfTicketRemember");
    const password = localStorage.getItem("passTicketRemember");
    if (cnpjCpf && password) {
      handleSearchUsers(cnpjCpf);
      setEmpresa((prev) => ({
        ...prev,
        password,
        remember: true,
        cnpjCpf,
      }));
    }
  }, []);

  const handleSearchUsers = async (cnpjCpf: string, isManualSubmit = false) => {
    if (cnpjCpf.length !== 11 && cnpjCpf.length !== 14) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/users-auto-complete?cnpjCpf=${cnpjCpf}`);

      if (response?.status === 200 && response.data.length > 0) {
        setUsers(response.data);
        if (isManualSubmit || step === 1) {
          setEmpresa((prev) => ({
            ...prev,
            userId: response.data[0]?.idUsuario || 0,
          }));
          setStep(2);
        }
        return true;
      } else if (isManualSubmit) {
        toast.error("Nenhum usuário encontrado para este CPF/CNPJ");
      }
      return false;
    } catch (error) {
      if (isManualSubmit) {
        toast.error("Erro ao buscar usuários");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = unMask(e.target.value);
    setEmpresa((prev) => ({ ...prev, cnpjCpf: value }));

    if (value.length === 11 || value.length === 14) {
      handleSearchUsers(value);
    } else {
      setUsers([]);
    }
  };

  const handleBackToFirstStep = () => {
    setStep(1);
    setTimeout(() => {
      eventInputRef.current?.focus();
      eventInputRef.current?.select();
    }, 0);
  };

  const getEvents = async (token: string) => {
    try {
      const response = await api.get("/events-select", {
        headers: { "x-access-token": token },
      });

      if (response?.status === 200) {
        setCurrentEvent(response.data[0] || null);
        setEventsList(response.data || []);
      }
    } catch (error) {
      toast.error("Erro ao carregar eventos");
      setCurrentEvent(null);
      setEventsList([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      await handleSearchUsers(empresa.cnpjCpf, true);
      return;
    }

    try {
      setIsLoading(true);
      const loginResponse = await api.post("/v1/auth", empresa);

      if (loginResponse?.status === 200) {
        if (empresa.remember) {
          localStorage.setItem("cnpjCpfTicketRemember", empresa.cnpjCpf);
          localStorage.setItem("passTicketRemember", empresa.password);
        }

        const results = loginResponse.data;
        //toast.success(`Bem-vindo, ${results.nomeUsuario}`);
        setUser(results);

        localStorage.setItem("tokenTicket", results.token);
        localStorage.setItem("userIdTicket", results.idUsuario);
        localStorage.setItem("userNameTicket", results.nomeUsuario);
        localStorage.setItem("userCnpjTicket", results.cnpjCpf);
        localStorage.setItem("companyTicket", results.idEmpresa);

        const dataRoute = JSON.stringify(results.permissoes);
        localStorage.setItem("dataRoute", dataRoute);

        await getEvents(results.token);

        if (onLoginSuccess) {
          await onLoginSuccess();
        }

        setNavigate(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  if (navigate) {
    window.location.href = "/";
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      {step === 1 ? (
        <>
          {/* Etapa 1: CPF/CNPJ */}
          <div className="form-group">
            <label htmlFor="cnpjCpf" className="form-label form-label--required">
              CPF / CNPJ
            </label>
            <input
              ref={eventInputRef}
              id="cnpjCpf"
              type="text"
              
              inputMode="numeric"
              className="form-input"
              placeholder="Digite seu CPF ou CNPJ"
              value={empresa.cnpjCpf.length <= 11 ? maskCpf(empresa.cnpjCpf) : maskCnpj(empresa.cnpjCpf)}
              onChange={handleCpfChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
              maxLength={17}
              autoFocus
            />
            {isLoading && <div className="form-helper">Buscando usuários...</div>}
          </div>

          <button type="submit" className="btn btn--secondary btn--full" disabled={isLoading || !(empresa.cnpjCpf.length === 11 || empresa.cnpjCpf.length === 14)}>
            {isLoading ? "Carregando..." : "Continuar"}
          </button>
        </>
      ) : (
        <>
          {/* Etapa 2: Usuário e Senha */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <FormButton variant="link-secondary" onClick={handleBackToFirstStep}>
              ← Voltar
            </FormButton>

            <span className="form-helper">{empresa.cnpjCpf.length <= 11 ? maskCpf(empresa.cnpjCpf) : maskCnpj(empresa.cnpjCpf)}</span>
          </div>

          <div className="form-group">
            <label htmlFor="usuario" className="form-label form-label--required">
              Usuário
            </label>
            <select
              id="usuario"
              className="form-select"
              value={empresa.userId}
              onChange={(e) =>
                setEmpresa((prev) => ({
                  ...prev,
                  userId: Number(e.target.value),
                }))
              }
              disabled={isLoading}
            >
              {users.map((user) => (
                <option key={user.idUsuario} value={user.idUsuario}>
                  {user.nomeUsuario}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="senha" className="form-label form-label--required">
              Senha
            </label>
            <input
              ref={passwordInputRef}
              id="senha"
              type="password"
              className="form-input"
              placeholder="Digite sua senha"
              value={empresa.password}
              onChange={(e) =>
                setEmpresa((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
              disabled={isLoading}
              autoFocus
              minLength={1}
            />
          </div>

          <Checkbox
            className="mb-4"
            label="Lembrar me"
            checked={empresa.remember}
            onChange={(e) => {
              if (!e.target.checked) {
                localStorage.removeItem("cnpjCpfTicketRemember");
                localStorage.removeItem("passTicketRemember");
              }
              setEmpresa((prev) => ({
                ...prev,
                remember: e.target.checked,
              }));
            }}
            disabled={isLoading}
          />

          <button type="submit" className="btn btn--secondary btn--full " disabled={isLoading || !empresa.password || empresa.password.length < 1}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </>
      )}
    </form>
  );
};

export default LoginForm;

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

const Login = () => {
  const [currUser, setcurrUser] = useState({ codigo: "", senha: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { lembrar, credentials, saveCredentials, toggleLembrar } = useRememberMe();
  const nomeRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const {setIsAuthenticated, setUser} = useApp();
  useEffect(() => {
    if (nomeRef.current) {
      nomeRef.current.focus();
    }
    
    // Carrega credenciais salvas
    if (credentials.codigo) {
      setcurrUser(credentials);
    }
  }, [credentials]);

  const fazerLogin = async () => {
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
        // Salva token e CNPJ
        localStorage.setItem("tokenDataFood", res.data.access_token);
        localStorage.setItem("cnpj", cnpj);
        
        // Salva credenciais se "Lembrar-me" estiver ativo
        saveCredentials(currUser.codigo, currUser.senha);
        setUser(res.data.user)
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
        <div className="field">
          <label htmlFor="nome" className="form-label form-label--required">
            Código
          </label>
          <input
            type="text"
            className="form-input"
            id="nome"
            ref={nomeRef}
            value={currUser.codigo}
            onChange={(e) => setcurrUser({ ...currUser, codigo: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && fazerLogin()}
          />
        </div>
        
        <div className="field mt-4">
          <label htmlFor="senha" className="form-label form-label--required">
            Senha
          </label>
          <input
            type="password"
            className="form-input"
            id="senha"
            value={currUser.senha}
            onChange={(e) => setcurrUser({ ...currUser, senha: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && fazerLogin()}
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
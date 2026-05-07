import axios from "axios";
import { toast } from "react-toastify";

console.log("env", import.meta.env.VITE_API_BASE_URL);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token e o CNPJ
api.interceptors.request.use((config) => {
  // Verifica se a URL NÃO é de login
  const isLoginRoute = config.url?.includes('/auth/login') || 
                       config.url?.includes('/users/register');
  
  // Se for rota de login/registro, NÃO adiciona headers
  if (isLoginRoute) {
    console.log('🔓 Rota de autenticação - pulando headers');
    return config;
  }
  
  // Para todas as outras rotas, adiciona os headers
  const token = localStorage.getItem("tokenDataFood");
  const cnpj = localStorage.getItem("cnpj");
  
  if (token) {
    config.headers["x-access-token"] = token;
  }
  
  if (cnpj) {
    config.headers["cnpj"] = cnpj;
  }
  
  return config;
});

// Função para verificar se o erro é de cancelamento
const isCancelError = (error: any): boolean => {
  return (
    axios.isCancel(error) ||
    error.code === "ERR_CANCELED" ||
    error.message === "canceled" ||
    error.message?.includes("canceled") ||
    error?.__CANCEL__ === true
  );
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignora completamente erros de cancelamento
    if (isCancelError(error)) {
      console.log("Requisição cancelada - ignorando");
      return Promise.reject(error);
    }

    // Tratamento de erro de rede
    if (error.code === "ERR_NETWORK") {
      toast.info("Verifique a conexão da sua internet!");
      return Promise.reject(error);
    }

    // Tratamento de erro 401 (Não autorizado)
    const currentPath = window.location.pathname;
    if (currentPath !== "/login" && error.response?.status === 401) {
      localStorage.removeItem("tokenDataFood");
      localStorage.removeItem("cnpj"); // ← Remove também o CNPJ
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Tratamento de erro 500 (Erro interno do servidor)
    if (error.response?.status === 500) {
      if (error.response.data != 'canceled') {
        console.log(error.response);
        let errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
        
        // Tenta extrair a mensagem de erro da resposta
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        toast.error(errorMessage);
        console.error("Erro 500:", error.response?.data);
      }
      return Promise.reject(error);
    }

    // Tratamento de erro 400 (Bad Request)
    if (error.response?.status === 400) {
      let errorMessage = "Erro na requisição. Verifique os dados enviados.";
      
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // Tratamento de erro 403 (Proibido)
    if (error.response?.status === 403) {
      const errorMessage = 
        error.response?.data?.message || 
        "Você não tem permissão para realizar esta ação.";
      
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // Tratamento de erro 404 (Não encontrado)
    if (error.response?.status === 404) {
      const errorMessage = 
        error.response?.data?.message || 
        "Recurso não encontrado.";
      
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // Para outros códigos de erro
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error ||
      error.message || 
      "Ocorreu um erro inesperado. Tente novamente.";
    
    if (![400, 403, 404, 500].includes(error.response?.status)) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);
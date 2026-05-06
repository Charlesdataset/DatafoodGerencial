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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenTicket");
  if (token) {
    config.headers["x-access-token"] = token;
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
    // Ignora completamente erros de cancelamento (não faz nada)
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
      localStorage.removeItem("tokenTicket");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Tratamento de erro 500 (Erro interno do servidor)
    if (error.response?.status === 500) {
      if(error.response.data != 'canceled') {

        console.log(error.response)
        const errorMessage = 
          error.response.data ||
          error.response?.data?.message || 
          error.response?.data?.error ||
        
          "Erro interno do servidor. Tente novamente mais tarde.";
        
        toast.error(errorMessage);
        console.error("Erro 500:", error.response?.data);
      }
      return Promise.reject(error);
    }

    // Tratamento de erro 400 (Bad Request)
    if (error.response?.status === 400) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        "Erro na requisição. Verifique os dados enviados.";
      
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
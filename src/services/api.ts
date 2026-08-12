import axios from "axios";
import { toast } from "react-toastify";

console.log("env", import.meta.env.VITE_API_BASE_URL);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3018/food-gerencial";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token e o CNPJ
api.interceptors.request.use((config) => {
  const isLoginRoute = config.url?.includes("/auth/login") || config.url?.includes("/users/register");

  if (isLoginRoute) {
    console.log("🔓 Rota de autenticação - pulando headers");
    return config;
  }

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

const isCancelError = (error: any): boolean => {
  return (
    axios.isCancel(error) ||
    error.code === "ERR_CANCELED" ||
    error.message === "canceled" ||
    error.message?.includes("canceled") ||
    error?.__CANCEL__ === true
  );
};

// 🔥 ADICIONA ESTA FUNÇÃO
const isLoginRoute = (url: string | undefined): boolean => {
  return url?.includes("/auth/login") || url?.includes("/users/register") || false;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCancelError(error)) {
      console.log("Requisição cancelada - ignorando");
      return Promise.reject(error);
    }

    if (error.code === "ERR_NETWORK") {
      toast.info("Verifique a conexão da sua internet!");
      return Promise.reject(error);
    }

    const currentPath = window.location.pathname;
    if (currentPath !== "/login" && error.response?.status === 401) {
      localStorage.removeItem("tokenDataFood");
      localStorage.removeItem("cnpj");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isLoginRoute(error.config?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      if (error.response.data != "canceled") {
        console.log(error.response);
        let errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";

        if (typeof error.response.data === "string") {
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

    if (error.response?.status === 400) {
      let errorMessage = "Erro na requisição. Verifique os dados enviados.";

      if (typeof error.response.data === "string") {
        errorMessage = error.response.data;
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || "Você não tem permissão para realizar esta ação.";
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.message || "Recurso não encontrado.";
      toast.error(errorMessage);
      return Promise.reject(error);
    }

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

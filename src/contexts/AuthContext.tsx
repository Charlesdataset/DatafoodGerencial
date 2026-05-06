import React, { createContext, useEffect, useState, type ReactNode } from "react";
import type { Event, User } from "../types/auth.types";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  eventsList: Event[];
  setEventsList: (events: Event[]) => void;
  currentEvent: Event | null;
  setCurrentEvent: (event: Event | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Recupera usuário do localStorage ao iniciar
  useEffect(() => {
    const token = localStorage.getItem("tokenTicket");
    const userId = localStorage.getItem("userIdTicket");
    const userName = localStorage.getItem("userNameTicket");
    const userCnpj = localStorage.getItem("userCnpjTicket");

    if (token && userId && userName) {
      setUser({
        idUsuario: Number(userId),
        nomeUsuario: userName,
        cnpjCpf: userCnpj || "",
        email: "",
        token: token,
        idEmpresa: Number(localStorage.getItem("companyTicket")),
        permissoes: JSON.parse(localStorage.getItem("dataRoute") || "{}"),
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        eventsList,
        setEventsList,
        currentEvent,
        setCurrentEvent,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

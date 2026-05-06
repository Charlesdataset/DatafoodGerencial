import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import { initialUser } from "../types/user.types";

interface AppContextType {
  user: any;
  setUser: (user: any) => void;
  eventsList: any[];
  setEventsList: (events: any[]) => void;
  currentEvent: any;
  setCurrentEvent: (event: any) => void;
  dataInicial: string;
  setDataInicial: (date: string) => void;
  dataFinal: string;
  setDataFinal: (date: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isDark: boolean;
  setIsDark: (e: boolean) => void;
  isMobile: boolean;
  setIsMobile: (e: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (e: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(initialUser);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [dataInicial, setDataInicial] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Carregar eventos iniciais
  useEffect(() => {
    loadEvents();
    const checkMobile = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      // if (!mobile) {
      //   setIsSidebarOpen(false);
      // }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {}, []);

  const loadEvents = async () => {
    try {
      const response = await api.get("/events-select");
      if (response?.status === 200 && response.data.length > 0) {
        setEventsList(response.data);
        setCurrentEvent(response.data[0]?.value);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      eventsList,
      setEventsList,
      currentEvent,
      setCurrentEvent,
      dataInicial,
      setDataInicial,
      dataFinal,
      setDataFinal,
      isLoading,
      setIsLoading,
      isDark,
      setIsDark,
      isMobile,
      setIsMobile,
      isCollapsed,
      setIsCollapsed,
    }),
    [
      user,
      eventsList,
      currentEvent,
      dataInicial,
      dataFinal,
      isLoading,
      isDark,
      isMobile,
      isCollapsed,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

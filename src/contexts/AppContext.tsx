import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialUser } from "../types/user.types";

interface AppContextType {
  user: any;
  setUser: (user: any) => void;
  companyInfo: any;
  setCompanyInfo: (info: any) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isDark: boolean;
  setIsDark: (e: boolean) => void;
  isMobile: boolean;
  setIsMobile: (e: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (e: boolean) => void;
}

export interface CompanyInfo {
  cnpj: string,
  franquia: string,
  idCli: number,
  nomeCli: string
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  useEffect(() => {
    if (companyInfo) {
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    } else {
      localStorage.removeItem('companyInfo');
    }
  }, [companyInfo]);
  // Carregar eventos iniciais
  useEffect(() => {
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
  useEffect(() => { }, []);



  const value = useMemo(
    () => ({
      user,
      setUser,

      companyInfo,
      setCompanyInfo,
      isAuthenticated,
      setIsAuthenticated,
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
      companyInfo,
      isAuthenticated,
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

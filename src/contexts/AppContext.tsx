import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import logoArsRelatorio from '../assets/icones/ars/logo-a-fundo-branco.jpg';
import logoArs from "../assets/icones/ars/logo-a-fundo-branco.png";
import logoDataSet from "../assets/icones/dataset/logo-d-branco-transparente.png";
import logoDataSetRelatorio from '../assets/icones/dataset/logo-d-fundo-branco.jpg';
import logoGigaByte from "../assets/icones/gigabyte/logo-g-fundo-branco.png";
import logoGigaByteRelatorio from '../assets/icones/gigabyte/logo-g-relatorio.jpg';
import { initialUser } from "../types/user.types";

interface AppContextType {
  user: any;
  currLogo: string;
  primaryColor: string;
  currLogoRelatorio: string;
  secondaryColor: string;
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
  const [primaryColor, setPrimaryColor] = useState("#42ab8a");
  const [secondaryColor, setSecondaryColor] = useState("#21455f");
  const [currLogo, setCurrLogo] = useState<string>(logoDataSet);
  const [currLogoRelatorio, setCurrLogoRelatorio] = useState<string>(logoArsRelatorio);

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
  useEffect(() => {

    let franquia = companyInfo?.franquia || "";
    //franquia = 'DATASET';
    //franquia = 'GIGABYTE';
    //franquia = 'ARS';

    switch (franquia) {
      case "DATASET":
        setPrimaryColor("#21455f");
        setSecondaryColor("#21455f");
        setCurrLogo(logoDataSet);
        setCurrLogoRelatorio(logoDataSetRelatorio)
        break;
      case "GIGABYTE":
        setPrimaryColor("#000000");
        setSecondaryColor("#000000");
        setCurrLogo(logoGigaByte);
        setCurrLogoRelatorio(logoGigaByteRelatorio)
        break;
      case "ARS":
        setPrimaryColor("#55BACA");
        setSecondaryColor("#55BACA");
        setCurrLogo(logoArs);
        setCurrLogoRelatorio(logoArsRelatorio)
        break;
      default:
        setPrimaryColor("#55BACA");
        setSecondaryColor("#55BACA");
        setCurrLogo(logoDataSet);
        break;
    }




  }, [companyInfo]);



  const value = useMemo(
    () => ({
      user,
      setUser,
      currLogo,
      currLogoRelatorio,
      primaryColor,
      secondaryColor,
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
      currLogo,
      currLogoRelatorio,
      primaryColor,
      secondaryColor,
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

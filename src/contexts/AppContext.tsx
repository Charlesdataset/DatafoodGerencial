import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import logoArsRelatorio from '../assets/icones/ars/logo-a-fundo-branco.jpg';
import logoArs from "../assets/icones/ars/logo-a-fundo-branco.png";
import logoDataSetRelatorio from '../assets/icones/dataset/logo-d-fundo-branco.jpg';
import logoDataSet from "../assets/icones/dataset/logo-d-fundo-branco.png";
import logoGigaByte from "../assets/icones/gigabyte/logo-g-fundo-branco.png";
import logoGigaByteRelatorio from '../assets/icones/gigabyte/logo-g-relatorio.jpg';
import { initialUser } from "../types/user.types";

export type LoginTheme = "verde" | "laranja" | "marinho" | "aguasProfundas";

export const THEMES = {
  aguasProfundas: {
    bg: "radial-gradient(ellipse at center, #0a1628 0%, #0b2b3f 40%, #0f3a4a 100%)",
    accent: "#4FC3F7",
    dark: "#0a1628",
    dotColor: "rgba(100, 200, 255, 0.3)",
    logoColor: "rgba(255,255,255,0.1)",
  },
  verde: {
    bg: "linear-gradient(150deg,#1a3a4a 0%,#1e6b52 55%,#42AB8A 100%)",
    accent: "#42AB8A",
    dark: "#21455F",
    dotColor: "rgba(255,255,255,0.2)",
    logoColor: "#fff",
  },
  laranja: {
    bg: "#000",
    accent: "#FF6B1A",
    dark: "#000",
    dotColor: "rgba(255, 107, 26, 0.2)",
    logoColor: "#fff",
  },
  marinho: {
    bg: "linear-gradient(150deg,#55BACA 0%,#3F8AB6 55%,#3473AC 100%)",
    accent: "rgb(23, 62, 107)",
    dark: "#0a1628",
    dotColor: "rgba(255,255,255,0.2)",
    logoColor: "#fff",
  },
};

export const THEME_TRANSITION_MS = 1650;

export interface CompanyInfo {
  idCli: number;
  nomeCli: string;
  cnpj: string;
  franquia: string;
  site?: string;
}

export interface TransitionOrigin {
  x: number;
  y: number;
}

export const DEFAULT_THEME_ORIGIN: TransitionOrigin = { x: 100, y: 40 };

interface FranquiaThemeConfig {
  theme: LoginTheme;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  logoRelatorio?: string;
}

const FRANQUIA_THEME_MAP: Record<string, FranquiaThemeConfig> = {
  DATASET: {
    theme: "verde",
    primaryColor: "#42A588",
    secondaryColor: "#21455f",
    logo: logoDataSet,
    logoRelatorio: logoDataSetRelatorio,
  },
  GIGABYTE: {
    theme: "laranja",
    primaryColor: "#000000",
    secondaryColor: "#000000",
    logo: logoGigaByte,
    logoRelatorio: logoGigaByteRelatorio,
  },
  ARS: {
    theme: "marinho",
    primaryColor: "#55BACA",
    secondaryColor: "#55BACA",
    logo: logoArs,
    logoRelatorio: logoArsRelatorio,
  },
};

const DEFAULT_FRANQUIA_CONFIG: FranquiaThemeConfig = {
  theme: "aguasProfundas",
  primaryColor: "#55BACA",
  secondaryColor: "#55BACA",
  logo: logoDataSet,
};

interface AppContextType {
  user: any;
  currLogo: string;
  primaryColor: string;
  currLogoRelatorio: string;
  secondaryColor: string;
  setUser: (user: any) => void;
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo | ((prev: CompanyInfo) => CompanyInfo)) => void;
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
  dataInicial: Date;
  dataFinal: Date;
  setDataInicial: (date: Date) => void;
  setDataFinal: (date: Date) => void;
  tipoTurnos: Array<any>;
  setTipoTurnos: (turnos: Array<any>) => void;
  turnosSelecionados: any;
  setTurnosSelecionados: (turno: any) => void;
  canShowTurnoTipo: boolean;
  setCanShowTurnoTipo: (canShow: boolean) => void;
  version: string;
  themeColor: LoginTheme;
  setThemeColor: (e: LoginTheme) => void;
  previousTheme: LoginTheme;
  transitionOrigin: TransitionOrigin;
  changeTheme: (theme: LoginTheme, origin?: TransitionOrigin) => void;
  showLogo: boolean;
  setShowLogo: (e: boolean) => void;
  isThemeTransitioning: boolean;
  setIsThemeTransitioning: (e: boolean) => void;
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
  
  // DATAS PADRÃO - SISTEMA GERENCIAL NÃO TEM TURNOS
  const [dataInicial, setDataInicial] = useState<Date>(() => {
    const hoje = new Date();
    const semanaPassada = new Date();
    semanaPassada.setDate(hoje.getDate() - 7);
    return semanaPassada;
  });
  const [dataFinal, setDataFinal] = useState<Date>(() => new Date());
  
  const [tipoTurnos, setTipoTurnos] = useState([]);
  const [turnosSelecionados, setTurnosSelecionados] = useState([]);
  const [canShowTurnoTipo, setCanShowTurnoTipo] = useState(false);
  
  const [themeColor, setThemeColor] = useState<LoginTheme>('aguasProfundas');
  const [previousTheme, setPreviousTheme] = useState<LoginTheme>('aguasProfundas');
  const [transitionOrigin, setTransitionOrigin] = useState<TransitionOrigin>(DEFAULT_THEME_ORIGIN);
  const [showLogo, setShowLogo] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const version = 'v1.0.5';
  const navigate = useNavigate();

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAppliedInitialThemeRef = useRef(false);

  const changeTheme = (newTheme: LoginTheme, origin: TransitionOrigin = DEFAULT_THEME_ORIGIN) => {
    if (newTheme === themeColor) return;

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setPreviousTheme(themeColor);
    setTransitionOrigin(origin);
    setIsThemeTransitioning(true);
    setThemeColor(newTheme);

    transitionTimeoutRef.current = setTimeout(() => {
      setIsThemeTransitioning(false);
    }, THEME_TRANSITION_MS);
  };

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const applyFranquiaTheme = (
    franquia: string,
    animate: boolean,
    origin: TransitionOrigin = DEFAULT_THEME_ORIGIN,
  ) => {
    const config = FRANQUIA_THEME_MAP[franquia] ?? DEFAULT_FRANQUIA_CONFIG;

    setPrimaryColor(config.primaryColor);
    setSecondaryColor(config.secondaryColor);
    setCurrLogo(config.logo);
    if (config.logoRelatorio) {
      setCurrLogoRelatorio(config.logoRelatorio);
    }

    if (animate) {
      changeTheme(config.theme, origin);
    } else {
      setPreviousTheme(config.theme);
      setThemeColor(config.theme);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const companyInfoStored = localStorage.getItem("companyInfo");
    if (companyInfoStored) {
      const parsed = JSON.parse(companyInfoStored);
      setCompanyInfo(parsed);
      setShowLogo(true);
    } else {
      navigate('/login', { replace: true });
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (companyInfo?.franquia) {
      applyFranquiaTheme(companyInfo.franquia, hasAppliedInitialThemeRef.current);
      hasAppliedInitialThemeRef.current = true;
      setShowLogo(true);
    }
  }, [companyInfo?.franquia]);

  useEffect(() => {
    if (companyInfo) {
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    } else {
      localStorage.removeItem('companyInfo');
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
      dataInicial,
      dataFinal,
      setDataInicial,
      setDataFinal,
      tipoTurnos,
      setTipoTurnos,
      turnosSelecionados,
      setTurnosSelecionados,
      canShowTurnoTipo,
      setCanShowTurnoTipo,
      version,
      themeColor,
      setThemeColor,
      previousTheme,
      transitionOrigin,
      changeTheme,
      showLogo,
      setShowLogo,
      isThemeTransitioning,
      setIsThemeTransitioning,
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
      dataInicial,
      dataFinal,
      tipoTurnos,
      turnosSelecionados,
      canShowTurnoTipo,
      themeColor,
      previousTheme,
      transitionOrigin,
      showLogo,
      isThemeTransitioning,
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
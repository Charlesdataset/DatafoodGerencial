import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { api } from "../../services/api";
import styles from "./AuthSimpleLayout.module.scss";

export type LoginTheme = "verde" | "laranja" | "marinho";

interface AuthSimpleLayoutProps {
  children?: React.ReactNode;
  theme?: LoginTheme;
  onThemeChange?: (theme: LoginTheme) => void;
  showThemeSelector?: boolean;
}

const THEMES = {
  verde: {
    bg: "linear-gradient(150deg,#1a3a4a 0%,#1e6b52 55%,#42AB8A 100%)",
    accent: "#42AB8A",
    dark: "#21455F",
  },
  laranja: {
    bg: "#000",
    accent: "#FF6B1A",
    dark: "#000",
  },
  marinho: {
    bg: "linear-gradient(150deg,#55BACA 0%,#3F8AB6 55%,#3473AC 100%)",
    accent: "rgb(23, 62, 107)",
    dark: "#0a1628",
  },
};

/* ===== BOLINHAS ===== */
interface Dot {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
}

function useCanvasDots(canvasRef: React.RefObject<HTMLCanvasElement | null>, ready: boolean) {
  const dotsRef = useRef<Dot[]>([]);
  const animFrameRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const newDot = useCallback((width: number, height: number): Dot => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 0,
      maxAlpha: Math.random() * 0.55 + 0.15,
      life: 0,
      maxLife: Math.random() * 220 + 120,
    };
  }, []);

  const initDots = useCallback(
    (width: number, height: number) => {
      const dots: Dot[] = [];
      for (let i = 0; i < 35; i++) {
        const d = newDot(width, height);
        d.life = Math.random() * d.maxLife;
        d.alpha = d.maxAlpha * (d.life / d.maxLife);
        dots.push(d);
      }
      dotsRef.current = dots;
    },
    [newDot]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Evita reinicialização
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const resize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      initDots(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const drawDots = () => {
      // Verifica se o canvas ainda existe
      if (!canvas || !canvas.parentElement) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((d, i) => {
        d.life++;
        d.x += d.vx;
        d.y += d.vy;

        if (d.x < -10) d.x = canvas.width + 10;
        if (d.x > canvas.width + 10) d.x = -10;
        if (d.y < -10) d.y = canvas.height + 10;
        if (d.y > canvas.height + 10) d.y = -10;

        const half = d.maxLife / 2;
        if (d.life < half) {
          d.alpha = d.maxAlpha * (d.life / half);
        } else {
          d.alpha = d.maxAlpha * (1 - (d.life - half) / half);
        }

        if (d.life >= d.maxLife) {
          dotsRef.current[i] = newDot(canvas.width, canvas.height);
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.alpha})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(drawDots);
    };

    drawDots();

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      isInitializedRef.current = false;
    };
  }, [canvasRef, initDots, newDot, ready]);
}

/* ===== COMPONENTE ===== */
const AuthSimpleLayout = ({
  children,
  theme = "verde",
  onThemeChange,
  showThemeSelector = false,
}: AuthSimpleLayoutProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTheme, setCurrentTheme] = useState<LoginTheme>(theme);
  const [canShow, setChanShow] = useState(false);
  const [companyValidated, setCompanyValidated] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const {isAuthenticated, setCompanyInfo} = useApp();

  useEffect(() => {
    const onFocusIn  = (e: FocusEvent) => { if ((e.target as HTMLInputElement)?.type === 'password') setPasswordFocused(true);  };
    const onFocusOut = (e: FocusEvent) => { if ((e.target as HTMLInputElement)?.type === 'password') setPasswordFocused(false); };
    document.addEventListener('focusin',  onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin',  onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  useEffect(() => {
    if(!isAuthenticated) {
      
      const cnpj = new URLSearchParams(window.location.search).get("cnpj");
      if (cnpj) {
        handleValidateCompany(cnpj);
        
      }
    }
  }, [])

  const handleValidateCompany = async (cnpj: string) => {
    try {
      const res = await api.get("/company/validate", { headers: { "cnpj": cnpj } });
      if (res?.status == 200) {
        if (res.data.validated == true) {
          setCompanyInfo(res.data.data);
          const franquia = res.data.data.franquia;
          const franquiaTheme: Record<string, LoginTheme> = {
            "DATASET": "verde",
            "GIGABYTE": "laranja",
            "ARS": "marinho"
          };
          
          handleThemeChange(franquiaTheme[franquia])
          setCompanyValidated(true);
          setChanShow(true)

        }
        else {
          setCompanyValidated(false);
          setChanShow(false)
        }
      }
      else {
        setCompanyValidated(false);
      }
    }
    catch (error: any) {
      console.error("Erro ao validar empresa:", error);
    }
  }


  useCanvasDots(canvasRef, canShow);

  const t = THEMES[currentTheme];

  const handleThemeChange = (name: LoginTheme) => {
    setCurrentTheme(name);
    onThemeChange?.(name);
  };

  return (
    <>
     <div style={{ '--primary-color':THEMES[currentTheme].accent} as React.CSSProperties} >

    
      {canShow == true ? (

        <div className={styles.login_card}>
          {showThemeSelector && (
            <div className={styles.themes}>
              {(["verde", "laranja", "marinho"] as LoginTheme[]).map((name) => (
                <button
                  key={name}
                  className={currentTheme === name ? styles.active : ""}
                  style={{
                    background: currentTheme === name ? THEMES[name].accent : "rgba(255, 255, 255, 0.9)",
                    color: currentTheme === name ? "#fff" : "#333",
                  }}
                  onClick={() => handleThemeChange(name)}
                >
                  {name === "verde" && "🟢 Verde"}
                  {name === "laranja" && "🟠 Laranja"}
                  {name === "marinho" && "🔵 Marinho"}
                </button>
              ))}
            </div>
          )}

          <div className={styles.wrap}>
            {/* LADO ESQUERDO - APRESENTAÇÃO */}
            <div className={styles.left} style={{ background: t.bg }}>
              <canvas ref={canvasRef} className={styles.canvas} />

              {/* Logo + Nome */}
              <div className={styles.logo_container}>
                {/* <img src={logo} alt="DataFood" className={styles.logo_img} /> */}
                <div className={styles.logo_divider} />
                <div className={styles.logo_text}>
                  <div className={styles.logo_brand}>
                    {currentTheme === "verde" ? (
                      <>
                      DATA<span style={{ color: t.accent }}>FOOD</span>
                      </>

                    ) : currentTheme === "laranja" ? (
                      <>
                      GIGA<span style={{ color: t.accent }}>BYTE</span>
                      </>
                    ) : currentTheme === "marinho" ? (
                      <>
                      ARS<span style={{ color: t.accent }}>AUTOMAÇÃO</span>
                      </>
                    ) : null}
                  </div>
                  <div className={styles.logo_subtitle}>Delivery Inteligente</div>
                </div>
              </div>

              {/* Texto de apresentação */}
              <div className={styles.left_bottom}>
                <div className={styles.sep} style={{ background: t.accent }} />
                <div className={styles.tagline}>
                  Da visão geral do salão
                  <br />
                  ao <em style={{ color: t.accent }}>controle absoluto</em> do caixa.
                </div>
                <div className={styles.desc}>
                  Tome decisões estratégicas baseadas em dados reais e veja o seu
                  faturamento crescer de verdade.
                </div>
                <div className={styles.version}>v1.0.0</div>
              </div>
            </div>

            {/* LADO DIREITO - FORMULÁRIO */}
            <div className={styles.right}>
              <div className={styles.form_wrap}>
                <div className={styles.form_title} style={{ color: t.dark }}>
                  Entrar
                </div>
                <div className={styles.form_sub}>
                  Acesse sua conta para continuar
                </div>
                <div
                  className={styles.grad_bar}
                  style={{
                    background: `linear-gradient(90deg,${t.dark},${t.accent})`,
                  }}
                />
                <div
                  className={styles.content}
                  style={{ "--accent": t.accent } as React.CSSProperties}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.restricted}>
          <div className={styles.restricted_card}>

            {!companyValidated ? (
              // Estado: empresa não encontrada
              <>
                <svg className={styles.restricted_icon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a2a3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <circle cx="12" cy="16" r="0.5" fill="#1a2a3a" />
                </svg>
                <div className={styles.restricted_brand}>
                  OPS!
                </div>
                <div className={styles.restricted_divider} />
                <h2 className={styles.restricted_title}>Empresa não encontrada</h2>
                <p className={styles.restricted_desc}>
                  Não foi possível identificar sua empresa. Verifique o link de acesso ou entre em contato com o suporte.
                </p>
              </>
            ) : (
              // Estado: acesso restrito (sem CNPJ)
              <>
                <svg className={styles.restricted_icon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a2a3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" fill="#1a2a3a" />
                </svg>
                <div className={styles.restricted_brand}>
                  OPS!
                </div>
                <div className={styles.restricted_divider} />
                <h2 className={styles.restricted_title}>Acesso Restrito</h2>
                <p className={styles.restricted_desc}>
                  Por favor, acesse a página de login através do link fornecido pela sua empresa.
                </p>
              </>
            )}

          </div>
        </div>
      )}
       </div>
    </>
  );
};

export default AuthSimpleLayout;
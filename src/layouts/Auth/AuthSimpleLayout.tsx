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
    bg: "linear-gradient(135deg,#0f2b38 0%,#1a5c4a 55%,#3a9d80 100%)",
    accent: "#3a9d80",
    dark: "#0f2b38",
    light: "#e8f5f0",
    cardBg: "#ffffff",
  },
  laranja: {
    bg: "linear-gradient(135deg,#1a1a1a 0%,#4a2a1a 55%,#e86820 100%)",
    accent: "#e86820",
    dark: "#1a1a1a",
    light: "#fdf0e8",
    cardBg: "#ffffff",
  },
  marinho: {
    bg: "linear-gradient(135deg,#0a1628 0%,#1a4a6a 55%,#3a8aaa 100%)",
    accent: "#3a8aaa",
    dark: "#0a1628",
    light: "#e8f2f8",
    cardBg: "#ffffff",
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
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { isAuthenticated } = useApp();

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => { if ((e.target as HTMLInputElement)?.type === 'password') setPasswordFocused(true); };
    const onFocusOut = (e: FocusEvent) => { if ((e.target as HTMLInputElement)?.type === 'password') setPasswordFocused(false); };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  
  // 🔥 REMOVIDO: useEffect que chamava handleValidateCompany
  // 🔥 REMOVIDO: handleValidateCompany
  // 🔥 REMOVIDO: setCompanyInfo
  // 🔥 REMOVIDO: canShow
  // 🔥 REMOVIDO: companyValidated

  useCanvasDots(canvasRef, false);

  const t = THEMES[currentTheme];

  const handleThemeChange = (name: LoginTheme) => {
    setCurrentTheme(name);
    onThemeChange?.(name);
  };

  return (
    <div className={styles.login_container} style={{ background: t.bg }}>
      {/* Seletor de temas */}
      {showThemeSelector && (
        <div className={styles.themes}>
          {(["verde", "laranja", "marinho"] as LoginTheme[]).map((name) => (
            <button
              key={name}
              className={currentTheme === name ? styles.active : ""}
              style={{
                background: currentTheme === name ? THEMES[name].accent : "rgba(255,255,255,0.9)",
                color: currentTheme === name ? "#fff" : "#555",
              }}
              onClick={() => handleThemeChange(name)}
            >
              {name === "verde" && "🌿 Verde"}
              {name === "laranja" && "🔥 Laranja"}
              {name === "marinho" && "🌊 Marinho"}
            </button>
          ))}
        </div>
      )}

      {/* Card centralizado */}
      <div className={styles.login_card} style={{ background: t.cardBg }}>
        {/* Canvas de fundo do card */}
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Logo no topo - DATA GERENCIAL */}
        <div className={styles.logo_container}>
          <div className={styles.logo_icon}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill={t.accent} opacity="0.15" />
              <path d="M28 16L33 23L28 30L23 23L28 16Z" fill={t.accent} />
              <path d="M28 25L37 39L19 39L28 25Z" fill={t.accent} opacity="0.7" />
              <path d="M28 39L33 46L23 46L28 39Z" fill={t.accent} opacity="0.4" />
            </svg>
          </div>
          <div className={styles.logo_text}>
            <div className={styles.logo_brand} style={{ color: t.dark }}>
              DATA <span style={{ color: t.accent }}>GERENCIAL</span>
            </div>
            <div className={styles.logo_subtitle}>Sistema de Gestão</div>
          </div>
        </div>

        {/* Formulário */}
        <div className={styles.form_container}>
          <div className={styles.form_header}>
            <div className={styles.form_title} style={{ color: t.dark }}>
              Acesse sua conta
            </div>
            <div className={styles.form_sub}>
              Informe suas credenciais para continuar
            </div>
            <div
              className={styles.grad_bar}
              style={{
                background: `linear-gradient(90deg, ${t.dark}, ${t.accent})`,
              }}
            />
          </div>
          <div
            className={styles.content}
            style={{ "--accent": t.accent } as React.CSSProperties}
          >
            {children}
          </div>
        </div>

        {/* Rodapé do card */}
        <div className={styles.card_footer}>
          <span>© 2024 DATA GERENCIAL - Todos os direitos reservados</span>
        </div>
      </div>
    </div>
  );
};

export default AuthSimpleLayout;
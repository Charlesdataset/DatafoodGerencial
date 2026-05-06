import { useCallback, useEffect, useRef, useState } from "react";
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
    bg: "linear-gradient(150deg,#7a2800 0%,#c04a00 55%,#FF6B1A 100%)",
    accent: "#FF6B1A",
    dark: "#7a2800",
  },
  marinho: {
    bg: "linear-gradient(150deg,#050e1f 0%,#0d2a4e 55%,#1565C0 100%)",
    accent: "#4A90E2",
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

function useCanvasDots(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const dotsRef = useRef<Dot[]>([]);
  const animFrameRef = useRef<number>(0);

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
    
    const ctx = canvas.getContext("2d")!;
    const parent = canvas.parentElement!;

    const resize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      initDots(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const drawDots = () => {
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
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasRef, initDots, newDot]);
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

  useCanvasDots(canvasRef);

  const t = THEMES[currentTheme];

  const handleThemeChange = (name: LoginTheme) => {
    setCurrentTheme(name);
    onThemeChange?.(name);
  };

  return (
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
                DATA<span style={{ color: t.accent }}>FOOD</span>
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
  );
};

export default AuthSimpleLayout;
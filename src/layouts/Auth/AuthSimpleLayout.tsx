import { useCallback, useEffect, useRef, useState } from "react";
import { THEMES, useApp, type LoginTheme } from "../../contexts/AppContext";
import { api } from "../../services/api";
import styles from "./AuthSimpleLayout.module.scss";

interface AuthSimpleLayoutProps {
  children?: React.ReactNode;
  showThemeSelector?: boolean;
}

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
  isBubble: boolean;
}

function useCanvasDots(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  ready: boolean,
  theme: LoginTheme
) {
  const dotsRef = useRef<Dot[]>([]);
  const animFrameRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const newDot = useCallback((width: number, height: number): Dot => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.2;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 4 + 1.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.1,
      alpha: 0,
      maxAlpha: Math.random() * 0.5 + 0.2,
      life: 0,
      maxLife: Math.random() * 300 + 200,
      isBubble: Math.random() > 0.3,
    };
  }, []);

  const initDots = useCallback(
    (width: number, height: number) => {
      const dots: Dot[] = [];
      for (let i = 0; i < 45; i++) {
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

      const isDeepWater = theme === "aguasProfundas";

      dotsRef.current.forEach((d, i) => {
        d.life++;
        d.x += d.vx + Math.sin(d.life * 0.01) * 0.1;
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

        if (d.isBubble) {
          const gradient = ctx.createRadialGradient(
            d.x - d.r * 0.3,
            d.y - d.r * 0.3,
            0.5,
            d.x,
            d.y,
            d.r
          );

          if (isDeepWater) {
            gradient.addColorStop(0, `rgba(100, 200, 255, ${d.alpha * 0.6})`);
            gradient.addColorStop(0.3, `rgba(50, 150, 220, ${d.alpha * 0.4})`);
            gradient.addColorStop(1, `rgba(20, 80, 150, ${d.alpha * 0.1})`);
          } else {
            gradient.addColorStop(0, `rgba(255, 255, 255, ${d.alpha * 0.5})`);
            gradient.addColorStop(0.4, `rgba(255, 255, 255, ${d.alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${d.alpha * 0.05})`);
          }

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          if (d.r > 2) {
            ctx.beginPath();
            ctx.arc(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = isDeepWater
              ? `rgba(200, 240, 255, ${d.alpha * 0.3})`
              : `rgba(255, 255, 255, ${d.alpha * 0.15})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.strokeStyle = isDeepWater
            ? `rgba(100, 200, 255, ${d.alpha * 0.1})`
            : `rgba(255, 255, 255, ${d.alpha * 0.05})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
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
  }, [canvasRef, initDots, newDot, ready, theme]);

  return { isInitialized: isInitializedRef.current };
}

// Divide um texto em spans para animação letra-por-letra (stagger)
const renderLetters = (
  text: string,
  opts: { startDelay?: number; color?: string } = {}
) => {
  const { startDelay = 0, color } = opts;
  return text.split("").map((char, i) => (
    <span
      key={`${char}-${i}`}
      className={styles.stagger_letter}
      style={{
        animationDelay: `${(startDelay + i * 0.032).toFixed(3)}s`,
        color,
      }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

const AuthSimpleLayout = ({
  children,
  showThemeSelector = false,
}: AuthSimpleLayoutProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const [canShow, setCanShow] = useState(false);

  const {
    themeColor,
    setThemeColor, // 🔥 ADICIONEI!
    previousTheme,
    transitionOrigin,
    changeTheme,
    showLogo,
    setShowLogo,
    isThemeTransitioning,
    setCompanyInfo,
    isAuthenticated,
  } = useApp();

  useCanvasDots(canvasRef, canShow, themeColor);

  const cnpj = new URLSearchParams(window.location.search).get("cnpj");

  useEffect(() => {
    if (!isAuthenticated) {
      if (cnpj) {
        handleValidateCompany(cnpj);
      } else {
        setCanShow(true);
        setShowLogo(false);
        setThemeColor("aguasProfundas"); 
      }
    }
  }, [cnpj]);

 const handleValidateCompany = async (cnpj: string) => {
  try {
    const res = await api.get(`franquias?cnpj=${cnpj}`);

    if (res?.status === 200) {
      const franquia = res.data.franquia;
      setCompanyInfo((prev) => ({ ...prev, franquia }));
      setCanShow(true);

      // 🔥 ADICIONA ISSO!
      const franquiaTheme: Record<string, LoginTheme> = {
        "DATASET": "verde",
        "GIGABYTE": "laranja",
        "ARS": "marinho",
      };

      const newTheme = franquiaTheme[franquia] || "marinho";
      setThemeColor(newTheme); // 🔥 MUDA O TEMA DIRETO!
      setShowLogo(true);
    } else {
      setCanShow(true);
      setShowLogo(false);
      setThemeColor("aguasProfundas");
    }
  } catch (error: any) {
    console.error("Erro ao validar empresa:", error);
    setCanShow(true);
    setShowLogo(false);
    setThemeColor("aguasProfundas");
  }
};

  const t = THEMES[themeColor] || THEMES.aguasProfundas;
  const prevT = THEMES[previousTheme] || THEMES.aguasProfundas;
  const isDeepWater = themeColor === "aguasProfundas";
  const showContent = canShow && !isDeepWater;

  const getBrandName = () => {
    if (isDeepWater) return null;
    switch (themeColor) {
      case "verde": return { main: "DATA", highlight: "FOOD" };
      case "laranja": return { main: "GIGA", highlight: "BYTE" };
      case "marinho": return { main: "ARS", highlight: "AUTOMAÇÃO" };
      default: return null;
    }
  };

  const brand = getBrandName();

  const handleThemeChange = (name: LoginTheme, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = leftRef.current?.getBoundingClientRect();
    let origin = { x: 85, y: 5 };

    if (rect) {
      origin = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    }

    changeTheme(name, origin);
    setShowLogo(true);
  };

  return (
    <div style={{ '--primary-color': t.accent } as React.CSSProperties}>
      <div className={styles.login_card}>
        {showThemeSelector && (
          <div className={styles.themes}>
            {(["verde", "laranja", "marinho"] as LoginTheme[]).map((name) => (
              <button
                key={name}
                className={themeColor === name ? styles.active : ""}
                style={{
                  background: themeColor === name ? THEMES[name].accent : "rgba(255, 255, 255, 0.9)",
                  color: themeColor === name ? "#fff" : "#333",
                }}
                onClick={(e) => handleThemeChange(name, e)}
              >
                {name === "verde" && "🟢 Verde"}
                {name === "laranja" && "🟠 Laranja"}
                {name === "marinho" && "🔵 Marinho"}
              </button>
            ))}
          </div>
        )}

        <div className={styles.wrap}>
          <div
            ref={leftRef}
            className={`${styles.left} ${isThemeTransitioning ? styles.transitioning : ''} ${showContent ? styles.hasContent : ''}`}
            style={{
              '--origin-x': `${transitionOrigin.x}%`,
              '--origin-y': `${transitionOrigin.y}%`,
            } as React.CSSProperties}
          >
            <div className={styles.grain} />

            <div
              className={styles.bg_layer_base}
              style={{ background: isThemeTransitioning ? prevT.bg : t.bg }}
            />

            {isThemeTransitioning && (
              <>
                <div className={`${styles.bg_layer_reveal} ${styles.rgb_red}`} style={{ background: t.bg }} />
                <div className={`${styles.bg_layer_reveal} ${styles.rgb_blue}`} style={{ background: t.bg }} />
              </>
            )}

            <div
              key={themeColor}
              className={`${styles.bg_layer_reveal} ${isThemeTransitioning ? styles.revealing : ''}`}
              style={{ background: t.bg }}
            />

            {isThemeTransitioning && (
              <>
                <div className={styles.vignette_pulse} />
                <div className={styles.bloom_flash} style={{ color: t.accent }} />
                <div className={styles.shock_rings} style={{ color: t.accent }}>
                  <span />
                  <span />
                  <span />
                </div>
              </>
            )}

            <canvas ref={canvasRef} className={styles.canvas} />

            <div className={styles.logo_container}>
              <div
                className={`${styles.logo_wrapper} ${showLogo ? styles.logoVisible : ''}`}
              >
                {!showLogo ? (
                  <div className={styles.logo_placeholder}>
                    <div className={styles.logo_placeholder_icon}>🌊</div>
                    <div className={styles.logo_placeholder_text}>
                      <span>Águas</span>
                      <span>Profundas</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.logo_brand} key={themeColor}>
                    {brand && (
                      <>
                        {renderLetters(brand.main)}
                        {renderLetters(brand.highlight, {
                          startDelay: brand.main.length * 0.032,
                          color: t.accent,
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
              {showLogo && (
                <>
                  <div className={styles.logo_divider} />
                  <div className={styles.logo_text}>
                    <div className={styles.logo_subtitle}>Delivery Inteligente</div>
                  </div>
                </>
              )}
            </div>

            <div className={`${styles.left_bottom} ${showLogo ? styles.visible : ''}`}>
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

          <div className={styles.right}>
            <div className={styles.form_wrap}>
              <div className={styles.form_title} style={{ color: showLogo ? t.dark : "#4a6a8a" }}>
                {showLogo ? "Entrar" : "Aguardando..."}
              </div>
              <div className={styles.form_sub}>
                {showLogo ? "Acesse sua conta para continuar" : "Digite o CNPJ para validar a franquia"}
              </div>
              <div
                className={styles.grad_bar}
                style={{
                  background: showLogo
                    ? `linear-gradient(90deg,${t.dark},${t.accent})`
                    : "linear-gradient(90deg, #1a3a5a, #4FC3F7)",
                  transition: 'background 0.8s ease',
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
    </div>
  );
};

export default AuthSimpleLayout;
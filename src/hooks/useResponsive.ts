// src/hooks/useResponsive.ts
import { useState, useEffect, useCallback } from "react";

// Seus breakpoints
const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  nt: 992,
  lg: 1332,
  xl: 1595,
  xxl: 1900,
} as const;

type BreakpointKey = keyof typeof breakpoints;

interface UseResponsiveReturn {
  // Altura atual da janela
  height: number;
  // Largura atual da janela
  width: number;
  // Verifica se está em um breakpoint específico ou maior
  up: (breakpoint: BreakpointKey) => boolean;
  // Verifica se está em um breakpoint específico ou menor
  down: (breakpoint: BreakpointKey) => boolean;
  // Verifica se está exatamente entre dois breakpoints
  between: (start: BreakpointKey, end: BreakpointKey) => boolean;
  // Retorna o breakpoint atual
  current: BreakpointKey;
}

export const useResponsive = (): UseResponsiveReturn => {
  const [dimensions, setDimensions] = useState({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    window.addEventListener("resize", handleResize);
    // Call inicial para garantir valores corretos
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getCurrentBreakpoint = useCallback((): BreakpointKey => {
    const width = dimensions.width;
    const entries = Object.entries(breakpoints) as [BreakpointKey, number][];

    // Encontra o maior breakpoint que é menor ou igual à largura atual
    const current = entries.reduce((acc, [key, value]) => {
      if (width >= value) return key;
      return acc;
    }, "xs" as BreakpointKey);

    return current;
  }, [dimensions.width]);

  const up = useCallback(
    (breakpoint: BreakpointKey): boolean => {
      return dimensions.width >= breakpoints[breakpoint];
    },
    [dimensions.width],
  );

  const down = useCallback(
    (breakpoint: BreakpointKey): boolean => {
      return dimensions.width < breakpoints[breakpoint];
    },
    [dimensions.width],
  );

  const between = useCallback(
    (start: BreakpointKey, end: BreakpointKey): boolean => {
      return (
        dimensions.width >= breakpoints[start] &&
        dimensions.width < breakpoints[end]
      );
    },
    [dimensions.width],
  );

  return {
    height: dimensions.height,
    width: dimensions.width,
    up,
    down,
    between,
    current: getCurrentBreakpoint(),
  };
};

// Versão singleton para usar fora de componentes React (se necessário)
export const breakpointUtils = {
  up: (breakpoint: BreakpointKey): boolean => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= breakpoints[breakpoint];
  },
  down: (breakpoint: BreakpointKey): boolean => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoints[breakpoint];
  },
  getCurrent: (): BreakpointKey => {
    if (typeof window === "undefined") return "xs";
    const width = window.innerWidth;
    const entries = Object.entries(breakpoints) as [BreakpointKey, number][];

    return entries.reduce((acc, [key, value]) => {
      if (width >= value) return key;
      return acc;
    }, "xs" as BreakpointKey);
  },
  getHeight: (): number => {
    if (typeof window === "undefined") return 0;
    return window.innerHeight;
  },
};

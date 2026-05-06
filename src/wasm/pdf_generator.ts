// src/wasm/pdf_generator.ts

export interface PdfRow {
  /** One string per column (same order as `headers`) */
  cells: string[];
}

export interface MetricCard {
  title: string;
  value: string;
  change?: string; // e.g., "+12%"
  icon?: string; // emoji or text
}

export interface PdfConfig {
  /** Main report title shown in the header band */
  title: string;
  /** Optional second line below the title */
  subtitle?: string;
  /** Column header labels */
  headers: string[];
  /** Data rows */
  rows: PdfRow[];
  /**
   * Primary gradient colour – RGB channels, each 0–1.
   * @default [0.122, 0.302, 0.702]  (deep blue)
   */
  primaryColor?: [number, number, number];
  /**
   * Accent gradient colour – RGB channels, each 0–1.
   * @default [0.118, 0.694, 0.831]  (cyan)
   */
  accentColor?: [number, number, number];
  /** Shown in the header corner and footer. */
  companyName?: string;

  // 🆕 NOVOS CAMPOS (opcionais para compatibilidade)
  /** Metric cards to display at the top */
  metricCards?: MetricCard[];
  /** Show decorative separators between sections - default true */
  showDecorativeSeparators?: boolean;
  /** Generation date (enviada do JavaScript) */
  generationDate?: string;
}

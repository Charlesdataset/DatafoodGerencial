import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  base: "/",

  server: {
    port: 3000,
    host: "192.168.0.136",
    open: true,
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**"],
    },
    // Pre-compila as páginas mais usadas durante o startup (background)
    // para que o primeiro clique seja instantâneo
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/layouts/Admin/AdminLayout.tsx",
        "./src/layouts/Admin/Header.tsx",
        "./src/layouts/Admin/Sidebar.tsx",
        "./src/pages/Login/Login.tsx",
        "./src/pages/Dashboard/Dashboard.tsx",


        "./src/components/DataGrid/DataGrid.tsx",
        "./src/components/Modal/SelectModal/SelectModal.tsx",
      ],
    },
  },

  // Tell esbuild NOT to pre-bundle the wasm-pack output (it is already an ES module
  // and contains dynamic import("…bg.wasm") which esbuild can't handle).
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["pdf_wasm", "@vitejs/pluguin-react-swc"],
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "@tanstack/react-table",
      "react-toastify",
      "dayjs",
      "@embedpdf/engines",
      "@embedpdf/pdfium",
      "exceljs",
    ],
    force: true,
  },

  build: {
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    sourcemap: false,
    target: "es2022",

    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            )
              return "vendor-react";
            if (id.includes("@tanstack/react-table")) return "vendor-table";
            if (
              id.includes("axios") ||
              id.includes("dayjs") ||
              id.includes("react-toastify")
            )
              return "vendor-misc";
          }
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: ({ name }) => {
          if (name && name.endsWith(".css"))
            return "assets/css/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["import", "legacy-js-api"],
        // Removido additionalData: causava @use duplicado em arquivos que já
        // importam sass:math / sass:color, forçando Sass a processar erros em
        // cada compilação de módulo SCSS
      },
    },
  },
});

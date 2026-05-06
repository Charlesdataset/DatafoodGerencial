export interface FetchDashboardDataParams {
  currentEvent: number;
  dataInicial: string | null;
  dataFinal: string | null;
  token: string | null;
  apiBaseUrl: string;
}

export interface DashboardBackgroundData {
  sales: any | null;
  vendasPorProduto: any[];
  vendasPorVendedor: any[];
  vendasPorGrupo: any[];
  vendasPorMaquininha: any[];
  heatmapDataBuffer?: ArrayBuffer;
  heatmapDataMeta?: Array<[string | number, string | number]>;
  heatmapData: any[];
  companyInfo: any | null;
  wasmMetrics?: {
    totalProductUnits: number;
    totalGroupRevenue: number;
    heatmapSum: number;
    heatmapNonZeroCells: number;
  };
}

export const fetchDashboardDataWithWorker = async (
  params: FetchDashboardDataParams,
): Promise<DashboardBackgroundData> => {
  return new Promise<DashboardBackgroundData>((resolve, reject) => {
    const worker = new Worker(
      new URL("./dashboardBackgroundWorker.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    const cleanup = () => {
      worker.terminate();
    };

    worker.addEventListener("message", (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === "allData") {
        cleanup();
        const payload = message.payload as DashboardBackgroundData;

        // Desserializar heatmap do ArrayBuffer se disponível
        if (payload.heatmapDataBuffer && payload.heatmapDataMeta) {
          const float32Array = new Float32Array(payload.heatmapDataBuffer);
          const meta = payload.heatmapDataMeta as Array<
            [string | number, string | number]
          >;

          // Reconstruir array original: [x, y, value | "-"]
          payload.heatmapData = meta.map((coords, idx) => [
            coords[0],
            coords[1],
            float32Array[idx] === 0 ? "-" : float32Array[idx],
          ]) as any[];
        }

        resolve(payload);
      } else if (message?.type === "error") {
        cleanup();
        reject(new Error(message.payload));
      }
    });

    worker.addEventListener("error", (event) => {
      cleanup();
      reject(event.error ?? new Error("Erro no worker de dashboard."));
    });

    worker.postMessage({ type: "fetchAllData", payload: params });
  });
};

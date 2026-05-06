export interface DashboardBackgroundRequest {
  currentEvent: number;
  dataInicial: string | null;
  dataFinal: string | null;
  token: string | null;
  apiBaseUrl: string;
}

export interface DashboardBackgroundResponse {
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

type WorkerRequest = {
  type: "fetchAllData";
  payload: DashboardBackgroundRequest;
};

type WorkerResponse =
  | { type: "allData"; payload: DashboardBackgroundResponse }
  | { type: "error"; payload: string };

const buildUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  if (!normalizedBase) return path;
  return path.startsWith("/")
    ? `${normalizedBase}${path}`
    : `${normalizedBase}/${path}`;
};

const formatDate = (date: string | null): string => {
  if (!date) return "";
  if (date.includes("T")) return date;
  return date.replace(" ", "T");
};

const fetchJson = async (url: string, token: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["x-access-token"] = token;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} ${text}`);
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(`Invalid JSON response from ${url}: ${err?.message}`);
  }
};

type WasmProcessor = {
  memory: WebAssembly.Memory;
  sum_i32: (ptr: number, len: number) => number;
  sum_f64: (ptr: number, len: number) => number;
  count_nonzero_i32: (ptr: number, len: number) => number;
  average_i32: (ptr: number, len: number) => number;
};

type WasmMetrics = {
  totalProductUnits: number;
  totalGroupRevenue: number;
  heatmapSum: number;
  heatmapNonZeroCells: number;
};

const wasmProcessorUrl = new URL(
  "../wasm/dashboard_processor_bg.wasm",
  import.meta.url,
);
let wasmProcessor: Promise<WasmProcessor> | null = null;

const loadWasmProcessor = async (): Promise<WasmProcessor> => {
  if (!wasmProcessor) {
    wasmProcessor = (async () => {
      const response = await fetch(wasmProcessorUrl);
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      const exports = instance.exports as unknown as WasmProcessor;
      if (!exports.memory) {
        throw new Error("WASM processor did not export memory.");
      }
      return exports;
    })();
  }
  return wasmProcessor;
};

const allocateWasmMemory = (memory: WebAssembly.Memory, byteLength: number) => {
  const pageSize = 65536;
  const pagesToGrow = Math.ceil(byteLength / pageSize);
  const oldPages = memory.grow(pagesToGrow);
  return oldPages * pageSize;
};

const copyI32ArrayToWasm = (numbers: number[], memory: WebAssembly.Memory) => {
  const byteLength = numbers.length * 4;
  const offset = allocateWasmMemory(memory, byteLength);
  const view = new Int32Array(memory.buffer, offset, numbers.length);
  view.set(numbers);
  return offset;
};

const copyF64ArrayToWasm = (numbers: number[], memory: WebAssembly.Memory) => {
  const byteLength = numbers.length * 8;
  const offset = allocateWasmMemory(memory, byteLength);
  const view = new Float64Array(memory.buffer, offset, numbers.length);
  view.set(numbers);
  return offset;
};

const computeWasmMetrics = (
  processor: WasmProcessor,
  productResponse: any,
  groupResponse: any,
  heatmapResponse: any,
): WasmMetrics => {
  const productUnits = Array.isArray(productResponse)
    ? productResponse
        .filter((item: any) => typeof item?.qtd === "number")
        .map((item: any) => item.qtd as number)
    : [];

  const groupRevenue = Array.isArray(groupResponse)
    ? groupResponse
        .filter((item: any) => typeof item?.receitaTotal === "number")
        .map((item: any) => item.receitaTotal as number)
    : [];

  const heatmapNumbers = Array.isArray(heatmapResponse?.vendas)
    ? heatmapResponse.vendas
        .filter(
          (item: any) => Array.isArray(item) && typeof item[2] === "number",
        )
        .map((item: any) => item[2] as number)
    : [];

  const totalProductUnits = productUnits.length
    ? processor.sum_i32(
        copyI32ArrayToWasm(productUnits, processor.memory),
        productUnits.length,
      )
    : 0;

  const totalGroupRevenue = groupRevenue.length
    ? processor.sum_f64(
        copyF64ArrayToWasm(groupRevenue, processor.memory),
        groupRevenue.length,
      )
    : 0;

  const heatmapSum = heatmapNumbers.length
    ? processor.sum_i32(
        copyI32ArrayToWasm(heatmapNumbers, processor.memory),
        heatmapNumbers.length,
      )
    : 0;

  const heatmapNonZeroCells = heatmapNumbers.length
    ? processor.count_nonzero_i32(
        copyI32ArrayToWasm(heatmapNumbers, processor.memory),
        heatmapNumbers.length,
      )
    : 0;

  return {
    totalProductUnits,
    totalGroupRevenue,
    heatmapSum,
    heatmapNonZeroCells,
  };
};

const transformProduto = (item: any, index: number) => ({
  id: index + 1,
  img: item.foto,
  unit: item.qtd,
  price: item.preco,
  title: item.nomeProduto,
  type: item.grupo ?? "SEM GRUPO",
  eventId: item.idEventoItem,
  bucketEvent: item.bucketEvent,
});

const transformGrupo = (item: any, index: number) => ({
  id: index + 1,
  img: item.foto,
  unit: item.totalVendido,
  price: item.receitaTotal,
  title: item.grupo,
  eventId: item.id_evento,
  bucketEvent: item.bucketEvent,
});

const transformDevice = (item: any, index: number, currentEvent: number) => ({
  id: index + 1,
  unit: item.qtdVendas,
  price: item.receitaTotal,
  title: `${item.codigoInterno} (${item.descricaoMaquina} ${item.modeloMaquina})`,
  eventId: currentEvent,
});

const normalizeHeatmap = (heatmapData: any[]) =>
  heatmapData.map((item: any) => {
    if (item[2] === 0) {
      return [item[0], item[1], "-"] as [
        string | number,
        string | number,
        number | "-",
      ];
    }
    return item;
  });

// Otimização: Converte heatmap para ArrayBuffer (Transferable)
// Isso elimina a serialização JSON e cópia de dados grandes
const heatmapToTransferable = (heatmapData: any[]) => {
  const values: number[] = [];
  const metadata: Array<[string | number, string | number]> = [];

  heatmapData.forEach((item: any) => {
    const value = item[2] === 0 ? 0 : (item[2] ?? 0);
    values.push(value);
    metadata.push([item[0], item[1]]);
  });

  // Float32Array mantém precisão suficiente para contagens
  const buffer = new Float32Array(values).buffer;
  return { buffer, metadata };
};

self.addEventListener("message", async (event: MessageEvent) => {
  const message = event.data as WorkerRequest;
  if (message?.type !== "fetchAllData") {
    return;
  }

  const { currentEvent, dataInicial, dataFinal, token, apiBaseUrl } =
    message.payload;
  const dates = `dataInicial=${formatDate(dataInicial)}&dataFinal=${formatDate(dataFinal)}&idEvento=${currentEvent}`;
  const baseUrl = apiBaseUrl || "";

  try {
    const salesPromise = fetchJson(
      buildUrl(
        baseUrl,
        `/v1/dashboard/sales-summary?eventId=${currentEvent}&dataInicial=${formatDate(dataInicial)}&dataFinal=${formatDate(dataFinal)}`,
      ),
      token,
    );
    const productPromise = fetchJson(
      buildUrl(baseUrl, `/v1/dashboard/sales-by-product?${dates}`),
      token,
    );
    const sellerPromise = fetchJson(
      buildUrl(baseUrl, `/v1/dashboard/sales-by-seler?${dates}`),
      token,
    );
    const groupPromise = fetchJson(
      buildUrl(baseUrl, `/v1/dashboard/sales-by-group?${dates}`),
      token,
    );
    const devicePromise = fetchJson(
      buildUrl(baseUrl, `/v1/dashboard/sales-by-device?${dates}`),
      token,
    );
    const heatmapPromise = fetchJson(
      buildUrl(baseUrl, `/v1/dashboard/sales-hotmap?${dates}`),
      token,
    );
    const companyPromise = fetchJson(
      buildUrl(baseUrl, `/reports-title-ticket?eventId=${currentEvent}`),
      token,
    );

    const [
      sales,
      productResponse,
      sellerResponse,
      groupResponse,
      deviceResponse,
      heatmapResponse,
      companyInfo,
    ] = await Promise.all([
      salesPromise,
      productPromise,
      sellerPromise,
      groupPromise,
      devicePromise,
      heatmapPromise,
      companyPromise,
    ]);

    const processor = await loadWasmProcessor();
    const wasmMetrics = computeWasmMetrics(
      processor,
      productResponse,
      groupResponse,
      heatmapResponse,
    );

    // Otimizar heatmapData com Transferable
    const normalizedHeatmap = Array.isArray(heatmapResponse?.vendas)
      ? normalizeHeatmap(heatmapResponse.vendas)
      : [];
    const { buffer: heatmapBuffer, metadata: heatmapMeta } =
      heatmapToTransferable(normalizedHeatmap);

    const payload: DashboardBackgroundResponse = {
      sales,
      vendasPorProduto: Array.isArray(productResponse)
        ? productResponse.map(transformProduto)
        : [],
      vendasPorVendedor: Array.isArray(sellerResponse) ? sellerResponse : [],
      vendasPorGrupo: Array.isArray(groupResponse)
        ? groupResponse.map(transformGrupo)
        : [],
      vendasPorMaquininha: Array.isArray(deviceResponse)
        ? deviceResponse.map((item: any, index: number) =>
            transformDevice(item, index, currentEvent),
          )
        : [],
      heatmapData: normalizedHeatmap, // Mantém para compatibilidade
      heatmapDataBuffer: heatmapBuffer,
      heatmapDataMeta: heatmapMeta,
      companyInfo: companyInfo ?? null,
      wasmMetrics,
    };

    const response: WorkerResponse = { type: "allData", payload };
    // Transferir propriedade do ArrayBuffer (zero-copy)
    (self as any).postMessage(response, [heatmapBuffer]);
  } catch (error: any) {
    const response: WorkerResponse = {
      type: "error",
      payload:
        error?.message ?? "Erro desconhecido ao buscar dados no serviço wasm.",
    };
    self.postMessage(response);
  }
});

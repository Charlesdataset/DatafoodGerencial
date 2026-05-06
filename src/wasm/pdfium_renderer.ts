export interface PdfiumModuleAPI {
  _FPDF_InitLibrary?: () => void;
  _FPDF_DestroyLibrary?: () => void;
  _FPDF_LoadMemDocument: (dataPtr: number, size: number, passwordPtr: number) => number;
  _FPDF_CloseDocument: (doc: number) => void;
  _FPDF_GetPageCount: (doc: number) => number;
  _FPDF_LoadPage: (doc: number, pageIndex: number) => number;
  _FPDF_ClosePage: (page: number) => void;
  _FPDF_GetPageWidth: (page: number) => number;
  _FPDF_GetPageHeight: (page: number) => number;
  _FPDFBitmap_Create: (width: number, height: number, alpha: number) => number;
  _FPDFBitmap_Destroy: (bitmap: number) => void;
  _FPDFBitmap_GetBuffer: (bitmap: number) => number;
  _FPDFBitmap_FillRect?: (bitmap: number, left: number, top: number, width: number, height: number, color: number) => void;
  _FPDF_RenderPageBitmap: (bitmap: number, page: number, left: number, top: number, width: number, height: number, rotate: number, flags: number) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
}

let _module: PdfiumModuleAPI | null = null;
let _loadPromise: Promise<PdfiumModuleAPI> | null = null;
let _initialized = false;

async function loadModule(): Promise<PdfiumModuleAPI> {
  if (_module) return _module;
  if (!_loadPromise) {
    _loadPromise = (async () => {
      const origin = window.location.origin;
      const jsFile = `${origin}/wasm/pdfium_wasm.js`;
      const wasmFile = `${origin}/wasm/pdfium_wasm_bg.wasm`;

      const wasmResp = await fetch(wasmFile);
      if (!wasmResp.ok) {
        throw new Error(`Falha ao carregar WASM (${wasmResp.status}): ${wasmFile}`);
      }

      const wasmBytes = await wasmResp.arrayBuffer();
      const magic = new Uint8Array(wasmBytes, 0, 4);
      if (magic[0] !== 0x00 || magic[1] !== 0x61 || magic[2] !== 0x73 || magic[3] !== 0x6d) {
        throw new Error(`O arquivo ${wasmFile} não é um binário WASM válido.`);
      }

      const dynamicImport = new Function("p", "return import(p)") as (p: string) => Promise<any>;
      const mod = await dynamicImport(jsFile);
      await mod.default({ module_or_path: wasmBytes });
      _module = mod as PdfiumModuleAPI;
      return _module;
    })();
  }
  return _loadPromise;
}

function initLibrary(module: PdfiumModuleAPI) {
  if (_initialized) return;
  if (typeof module._FPDF_InitLibrary === "function") {
    module._FPDF_InitLibrary();
  }
  _initialized = true;
}

function copyBitmapToCanvas(module: PdfiumModuleAPI, bitmapPtr: number, width: number, height: number, canvas: HTMLCanvasElement) {
  const bufferPtr = module._FPDFBitmap_GetBuffer(bitmapPtr);
  const size = width * height * 4;
  const view = new Uint8ClampedArray(module.HEAPU8.buffer, bufferPtr, size);
  const imageData = new ImageData(width, height);

  for (let i = 0; i < size; i += 4) {
    imageData.data[i] = view[i + 2];
    imageData.data[i + 1] = view[i + 1];
    imageData.data[i + 2] = view[i];
    imageData.data[i + 3] = view[i + 3];
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível obter contexto 2D para o canvas.");
  ctx.putImageData(imageData, 0, 0);
}

export async function renderPdfPageToCanvas(pdfBytes: Uint8Array, canvas: HTMLCanvasElement, pageIndex = 0, scale = 1) {
  const module = await loadModule();
  initLibrary(module);

  const dataPtr = module._malloc(pdfBytes.length);
  module.HEAPU8.set(pdfBytes, dataPtr);

  const doc = module._FPDF_LoadMemDocument(dataPtr, pdfBytes.length, 0);
  if (!doc) {
    module._free(dataPtr);
    throw new Error("Falha ao abrir documento PDF no PDFium.");
  }

  try {
    const pageCount = module._FPDF_GetPageCount(doc);
    const page = module._FPDF_LoadPage(doc, pageIndex);
    if (!page) {
      throw new Error(`Falha ao carregar página ${pageIndex}.`);
    }

    try {
      const width = Math.round(module._FPDF_GetPageWidth(page) * scale);
      const height = Math.round(module._FPDF_GetPageHeight(page) * scale);
      const bitmap = module._FPDFBitmap_Create(width, height, 1);
      if (!bitmap) {
        throw new Error("Falha ao criar bitmap no PDFium.");
      }

      try {
        if (typeof module._FPDFBitmap_FillRect === "function") {
          module._FPDFBitmap_FillRect(bitmap, 0, 0, width, height, 0xffffffff);
        }
        module._FPDF_RenderPageBitmap(bitmap, page, 0, 0, width, height, 0, 0);
        copyBitmapToCanvas(module, bitmap, width, height, canvas);
      } finally {
        module._FPDFBitmap_Destroy(bitmap);
      }
    } finally {
      module._FPDF_ClosePage(page);
    }

    return pageCount;
  } finally {
    module._FPDF_CloseDocument(doc);
    module._free(dataPtr);
  }
}

export async function getPdfPageCount(pdfBytes: Uint8Array) {
  const module = await loadModule();
  initLibrary(module);

  const dataPtr = module._malloc(pdfBytes.length);
  module.HEAPU8.set(pdfBytes, dataPtr);

  const doc = module._FPDF_LoadMemDocument(dataPtr, pdfBytes.length, 0);
  if (!doc) {
    module._free(dataPtr);
    throw new Error("Falha ao abrir documento PDF no PDFium.");
  }

  try {
    return module._FPDF_GetPageCount(doc);
  } finally {
    module._FPDF_CloseDocument(doc);
    module._free(dataPtr);
  }
}

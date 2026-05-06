
import type { ReportV3 } from "../../types/v3.types";
import { gerarRelatorioPdfV3 } from "../../wasm/pdfium_generator";

interface ProductPrice {
  id: number;
  description: string;
  price: number;
  groupId: number;
  group?: string;
  [key: string]: unknown;
}

interface ProdutoListaData {
  imagePath: string;
  data: ProductPrice[];
}

async function convertImageToBase64(
  url: string
): Promise<{ data: string } | { error: string }> {
  try {
    const response = await fetch(url);
    console.log("Resposta do fetch da imagem:", response );
    if (!response.ok)
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

const handleProdutoLista = async (
  data: ProdutoListaData,
  /** Quando fornecido, ignora a imagem e exibe este erro no header */
  imageErrorOverride?: string
): Promise<Uint8Array> => {
  const imageResult =
    !imageErrorOverride && data.imagePath
      ? await convertImageToBase64(data.imagePath)
      : null;
  const imageBase64 = imageResult && "data" in imageResult ? imageResult.data : null;
  const imageFetchError =
    imageErrorOverride ??
    (imageResult && "error" in imageResult ? imageResult.error : null);

  const dataset = data.data.map((p) => ({
    ...p,
    group: (p.group as string) ?? `Grupo ${p.groupId}`,
  }));

  const buildHeaderContent = (errorMsg?: string) => {
    if (errorMsg) {
      return [{
        type: "text" as const,
        value: `Erro ao carregar imagem: ${errorMsg}`,
        fontSize: 9,
        color: "#cc0000",
        align: "left" as const,
        margin: { four: [5, 0, 5, 0] as [number, number, number, number] },
      }];
    }
    if (imageBase64) {
      return [{
        type: "image-box" as const,
        variable: "eventImage",
        width: 525,
        height: 290,
        align: "center" as const,
        margin: { four: [5, 0, 5, 0] as [number, number, number, number] },
      }];
    }
    return [];
  };

  const json: ReportV3 = {
    pageConfiguration: {
      backgroundColor: "#ffffff",
      margin: { four: [40, 35, 40, 35] },
    },
    header: {
      repeat: false,
      minHeight: imageBase64 ? 200 : imageFetchError ? 25 : 0,
      backgroundColor: "#ffffff",
      content: buildHeaderContent(imageFetchError ?? undefined),
    },
    
    content: [
      {
        type: "priceList",
        datasetName: "produtos",
        nameKey: "description",
        priceKey: "price",
        groupKey: "group",
        itemFontSize: 20,
        groupHeaderFontSize: 20,
        groupHeaderColor: "#ffffff",
        groupHeaderTextColor: "#111111",
        itemColor: "#111111",
        priceColor: "#111111",
        dotColor: "#111111",
        margin: { four: [8, 0, 8, 0] },
      },
    ],
  };

  json._datasets = {
    produtos: dataset as any,
  };

  if (imageBase64) {
    json._variables = { eventImage: imageBase64 };
  }

  try {
    return await gerarRelatorioPdfV3(json as any);
  } catch (e) {
    // Image caused WASM to fail — retry without image, show error in header
    const errorMsg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    json.header = {
      ...json.header,
      minHeight: 25,
      content: buildHeaderContent(errorMsg),
    };
    delete json._variables;
    return await gerarRelatorioPdfV3(json as any);
  }
};

export default handleProdutoLista;

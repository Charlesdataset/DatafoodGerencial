export type V3Size = number | string;

export type V3EdgeValues =
  | number
  | [number, number]
  | [number, number, number, number]
  | {
      all?: number;
      four?: [number, number, number, number];
    };

export type V3TableWidth = number | string; // use "auto" or "expand" for flexible columns

export type V3TextAlign = "left" | "center" | "right";

export type V3ChartModel =
  | "bar"
  | "line"
  | "pie"
  | "donut"
  | "candles"
  | "heatmap";

export interface PageConfigV3 {
  backgroundColor?: string;
  margin?: V3EdgeValues;
  orientation?: "portrait" | "landscape" | string;
}

export interface BoxShadowDef {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
}

export interface GradientDef {
  startColor: string;
  endColor: string;
  direction?: "vertical" | "horizontal";
}

export interface SectionV3 {
  repeat?: boolean;
  backgroundColor?: string;
  height?: number;
  minHeight?: number;
  boxShadow?: BoxShadowDef;
  gradient?: GradientDef;
  border?: V3EdgeValues;
  borderColor?: string;
  borderStyle?: "solid" | "dashed" | "thin" | "double";
  content: ComponentV3[];
}

export type V3Mask =
  | "number"
  | "currency"
  | "percentage"
  | "cnpj"
  | "cpf"
  | "cnpjCpf"
  | "cep"
  | "phone"
  | "date"
  | "date-time"
  | string;

export interface TableHeaderDef {
  key: string;
  prefix?: string;
  mask?: V3Mask;
  align?: V3TextAlign;
  sum?: boolean;
  pill?: boolean;
  pillCases?: Array<{ case: string; color: string; transform?: string }>;
  pillWidth?: number;
}

export interface GroupingConfig {
  groupBy: string;
  groupHeader?: string;
  prefix?: string;
  subtotal?: boolean;
  gap?: number;
  groupHeaderBackgroundColor?: string;
  groupHeaderTextColor?: string;
  groupHeaderBorderColor?: string;
  groupHeaderBorderWidth?: number;
  groupHeaderBorderStyle?: "solid" | "dashed" | "none";
  /** Campos que identificam unicidade do agregado (ex: ['fornecedor']) */
  aggregate?: string[];
  /** Campos numéricos que devem ser somados no agregado (ex: ['vlr', 'taxa']) */
  aggregateSum?: string[];
  /** SummaryBox exibido após cada grupo */
  summaryBox?: SummaryBoxDef;
  /** Campo para sub-agrupamento dentro de cada grupo */
  subGroupBy?: string;
  /** Prefixo exibido no cabeçalho do sub-grupo (ex: "Funcionário: ") */
  subGroupPrefix?: string;
}

export interface PreHeaderDef {
  variable: string;
  fontSize?: number;
  align?: V3TextAlign;
  color?: string;
  backgroundColor?: string;
  mask?: string;
  margin?: V3EdgeValues;
}

export interface CardComponent {
  type: "card";
  content: ComponentV3[];
  height?: V3Size;
  width?: V3Size;
  margin?: V3EdgeValues;
  padding?: V3EdgeValues;
  cornerRadius?: number;
  backgroundColor?: string;
  borderColor?: string;
  icon?: string;
  iconColor?: string;
  flex?: number;
  preStyle?: string;
  topAccentHeight?: V3Size;
  topAccentWidth?: V3Size;
  topAccentRadius?: number;
  leftAccentWidth?: V3Size;
  leftAccentHeight?: V3Size;
  leftAccentRadius?: number;
  accentBorderColor?: string;
  accentBorderWidth?: number;
  showTopAccent?: boolean;
  showLeftAccent?: boolean;
}

export interface TextComponent {
  type: "text";
  value: string;
  fontSize?: number;
  lineHeight?: number;
  align?: V3TextAlign;
  bold?: boolean;
  color?: string;
  margin?: V3EdgeValues;
  marginBottom?: number;
}

export interface FluidLayoutComponent {
  type: "fluidLayout";
  sizes: V3Size[];
  content: ComponentV3[];
  gap?: number;
  margin?: V3EdgeValues;
}

export interface HorizontalStackComponent {
  type: "horizontalStack";
  content: ComponentV3[];
  gap?: number;
  margin?: V3EdgeValues;
}

export interface StackLayoutComponent {
  type: "stackLayout";
  content: ComponentV3[];
  gap?: number;
  margin?: V3EdgeValues;
}

export interface TableFieldMapping {
  key: string;
  sourceKey: string;
}

export interface TableRowExpansion {
  path: string;
  descriptionKey?: string;
  descriptionTemplate?: string;
  fieldMappings?: TableFieldMapping[];
  tableHeader?: TableHeaderDef[];
  widths?: V3TableWidth[];
  subtotal?: boolean;
  indent?: number;
  gap?: number;
  gapTop?: number;
  preHeader?: PreHeaderDef;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "none";
  textColor?: string;
  zebraTextColor?: string;
  zebraBackgroundColor?: string;
  children?: TableRowExpansion[];
  /** SummaryBox exibido após os itens desta seção */
  summaryBox?: SummaryBoxDef;
  /** Campos que identificam unicidade do agregado dos itens */
  aggregate?: string[];
  /** Campos numéricos somados no agregado dos itens */
  aggregateSum?: string[];
}

export interface SummaryBoxRow {
  label: string;
  key?: string;
  value?: string;
  mask?: "currency" | "number" | "percentage";
  bold?: boolean;
  dividerBefore?: boolean;
}

export interface SummaryBoxDef {
  rows: SummaryBoxRow[];
  width?: number;
  align?: "left" | "center" | "right";
}

export interface TableComponent {
  type: "table";
  datasetName: string;
  tableHeader: TableHeaderDef[];
  widths: V3TableWidth[];
  grouping?: GroupingConfig;
  grandTotal?: boolean;
  summaryBox?: SummaryBoxDef;
  margin?: V3EdgeValues;
  preHeader?: PreHeaderDef;
  rowExpansion?: TableRowExpansion;
  items?: TableRowExpansion;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "none";
  textColor?: string;
  zebraTextColor?: string;
  zebraBackgroundColor?: string;
  /** Campos que identificam unicidade do agregado das linhas da tabela */
  aggregate?: string[];
  /** Campos numéricos somados no agregado das linhas da tabela */
  aggregateSum?: string[];
}

export interface ChartComponent {
  type: "chart";
  chartModel: V3ChartModel;
  dataset?: string;
  datasetName?: string;
  topCount?: number;
  header?: {
    value: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    height?: number;
    align?: V3TextAlign;
  };
  keySum?: string;
  keyPresent?: string;
  keyGroup?: string;
  labelKey?: string;
  valueKey?: string;
  width?: V3Size;
  align?: V3TextAlign;
  colors?: string[];
  colorFrom?: string;
  colorTo?: string;
  title?: string;
  labels?: string[];
  values?: number[];
  valueSuffix?: string;
  labelFontSize?: number;
  labelColor?: string;
  gridColor?: string;
  labelMaxChars?: number;
  margin?: V3EdgeValues;
  showDetails?: boolean;
}

export type ComponentV3 =
  | CardComponent
  | TextComponent
  | FluidLayoutComponent
  | HorizontalStackComponent
  | StackLayoutComponent
  | TableComponent
  | TableMultiDataComponent
  | ChartComponent
  | ImageBoxComponent
  | PriceListComponent;

export interface ImageBoxComponent {
  type: "image-box";
  /** Nome da variável que contém o base64 da imagem */
  variable: string;
  /** Largura em pontos PDF. Default: largura do conteúdo */
  width?: number;
  /** Altura em pontos PDF. Default: proporcional ao width */
  height?: number;
  /** Alinhamento horizontal */
  align?: "left" | "center" | "right";
  margin?: V3EdgeValues;
}

// ─── TableMultiData ──────────────────────────────────────────────────────────

/**
 * Um campo exibido dentro de cada bloco de registro do tableMultiData.
 */
export interface TableMultiDataField {
  /** Chave no dataset */
  key: string;
  /** Label exibido acima do valor */
  prefix?: string;
  mask?: V3Mask;
  align?: V3TextAlign;
  bold?: boolean;
  /** Quantas colunas este campo ocupa (colspan). Padrão: 1 */
  span?: number;
}

/**
 * Tabela multi-linha por registro: cada item do dataset é exibido como um bloco
 * com título (opcional) + grade de N colunas com label + valor por campo.
 *
 * Ideal para relatórios detalhados com 10+ campos por registro.
 *
 * @example
 * ```json
 * {
 *   "type": "tableMultiData",
 *   "datasetName": "clientes",
 *   "titleField": "razaoSocial",
 *   "titlePrefix": "Cliente: ",
 *   "columns": 4,
 *   "fields": [
 *     { "key": "idCliente",    "prefix": "Código" },
 *     { "key": "dataCadastro", "prefix": "Data Cadastro", "mask": "date-time" },
 *     { "key": "celular",      "prefix": "Celular" },
 *     { "key": "limiteCredito","prefix": "Limite",         "mask": "currency" },
 *     { "key": "cpf",          "prefix": "CPF/CNPJ",       "mask": "cnpjCpf", "span": 2 },
 *     { "key": "endereco",     "prefix": "Endereço",        "span": 2 }
 *   ]
 * }
 * ```
 */
export interface TableMultiDataComponent {
  type: "tableMultiData";
  /** Nome do dataset */
  datasetName: string;
  /** Lista de campos a exibir por registro */
  fields: TableMultiDataField[];
  /** Agrupamento dos registros (igual ao table normal) */
  grouping?: GroupingConfig;
  /** Cor de fundo do cabeçalho de grupo. Padrão: #404040 */
  groupHeaderBackgroundColor?: string;
  /** Cor do texto do cabeçalho de grupo. Padrão: #ffffff */
  groupHeaderTextColor?: string;
  /** Quantas colunas por linha dentro do bloco de cada registro. Padrão: 4 */
  columns?: number;
  /** Campo do dataset usado como título do bloco. Se omitido, não exibe título */
  titleField?: string;
  /** Prefixo antes do valor do título (ex: "Cliente: ") */
  titlePrefix?: string;
  /** Cor de fundo da barra de título. Padrão: #20435C */
  titleBackgroundColor?: string;
  /** Cor do texto do título. Padrão: #ffffff */
  titleTextColor?: string;
  /** Cor de fundo da linha de labels. Padrão: #EEF1F6 */
  labelBackgroundColor?: string;
  /** Cor dos textos de label. Padrão: #555e74 */
  labelColor?: string;
  /** Cor dos textos de valor. Padrão: #1e222b */
  valueColor?: string;
  /** Cor das bordas da grade. Padrão: #c8cdd8 */
  borderColor?: string;
  /** Espessura da borda. Padrão: 0.4 */
  borderWidth?: number;
  /** Espaço entre blocos de registros. Padrão: 8 */
  gap?: number;
  /** Cor de fundo zebra (registros pares). Padrão: #f9fafc */
  zebraBackgroundColor?: string;
  margin?: V3EdgeValues;
}

export interface PriceListComponent {
  type: "priceList";
  /** Nome do dataset contendo os produtos */
  datasetName: string;
  /** Chave do campo nome/descrição do produto */
  nameKey: string;
  /** Chave do campo preço (numérico) */
  priceKey: string;
  /** Chave para agrupamento (ex: 'group') */
  groupKey?: string;
  /** Tamanho da fonte dos itens. Default: 12 */
  itemFontSize?: number;
  /** Tamanho da fonte do cabeçalho do grupo. Default: 14 */
  groupHeaderFontSize?: number;
  /** Cor de fundo do cabeçalho do grupo. Default: #20435C */
  groupHeaderColor?: string;
  /** Cor do texto do cabeçalho do grupo. Default: #ffffff */
  groupHeaderTextColor?: string;
  /** Cor do texto do nome. Default: #000000 */
  itemColor?: string;
  /** Cor do texto do preço. Default: #000000 */
  priceColor?: string;
  /** Cor da linha tracejada. Default: #888888 */
  dotColor?: string;
  margin?: V3EdgeValues;
}

export interface ReportV3 {
  pageConfiguration: PageConfigV3;
  header?: SectionV3;
  footer?: SectionV3;
  content: ComponentV3[];
  _datasets?: V3Datasets;
  _variables?: V3Variables;
}

export type V3Datasets = Record<string, Record<string, unknown>[]>;
export type V3Variables = Record<string, string>;

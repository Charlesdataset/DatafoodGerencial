//================================================
//  RELATÓRIOS - TIPAGENS Nota de Entrada
//================================================

export enum EntradaNFOrderBy {
  NENHUM = '',
  FORNECEDOR_AZ = 'FAZ',
  FORNECEDOR_ZA = 'FZA',
  CODIGO_AZ = 'CAZ',
  CODIGO_ZA = 'CZA',
  ENTRADA_AZ = 'EAZ',
  ENTRADA_ZA = 'EZA',
}

export enum EntradaNFAgrupadoPor {
  NENHUM = '',
  FORNECEDOR = 'F',
  DATA_ENTRADA = 'D',
  CFOP_UF_DIA = 'CUD',
}

export interface EntradaNfTotais {
  totalRows: number;
  totalNotas: number;
  totalIPI: number;
  totalICMSST: number;
  totalPIS: number;
  totalCOFINS: number;
  totalProdutos: number;
}

export interface RelatorioEntradaNF {
  numero: number;
  entrada: Date;
  fornecedor: string;
  serie: number;
  baseSt: number;
  icmsSt: number;
  ipi: number;
  frete: number;
  total: number;
  natureza: string;
  chave: number;
  itens?: ItensEntradaNFDto[];
}
export class ItensEntradaNFDto {
  id: number;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  vlrUnitario: number;
  vlrDesconto: number;
  vlrTotal: number;
}

export enum NfceAgrupadoPor {
  Nenhum = '',
  Cliente = 'Cliente',
  DataEmissao = 'Data Emissão',
  DataSaida = 'Data Saída',
  DataRecebimento = 'Data Recebimento',
  Status = 'Status',
}

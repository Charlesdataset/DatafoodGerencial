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

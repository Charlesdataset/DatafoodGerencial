export interface Cidade {
  id_cidade: number;
  nome: string;
  uf: string;
  codigo_ibge?: number;
  ativo: boolean;
  data_cadastro?: string;
  excluido?: boolean;
}

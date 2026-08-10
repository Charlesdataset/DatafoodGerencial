export interface Cliente {
  id_cliente: number;
  cnpj: string;
  razao_social: string;
  fantasia: string;
  inscricao_estadual: string;
  cnae: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  responsavel_nome: string;
  whatsapp: string;
  telefone: string;
  email: string;
  codigo_ramo: string;
  franquia: string;
  origem: string;
  observacoes: string;
  excluido: boolean;
}

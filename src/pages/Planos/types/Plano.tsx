export interface Plano {
  id_plano: number;
  descricao: string;
  resumo: string;
  caixasMax: number;
  usuariosMax: number;
  valorMensal: number;
  diasValidade: number | null;
  ordem: number;
  ativo: boolean;
}

export interface Recurso {
  codigoFormulario: string;
  liberado: boolean;
}

export interface PlanoFormData {
  id_plano: number;
  descricao: string;
  resumo: string;
  caixasMax: number;
  usuariosMax: number;
  valorMensal: number;
  diasValidade: number | null;
  ordem: number;
  ativo: boolean;
  recursos: Recurso[];
}
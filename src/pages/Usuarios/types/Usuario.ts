export interface Usuario {
  idUsuario: number;
  nome: string;
  franquiaId: number;
  franquia: string;
  ativo: boolean;
  entrar: boolean;
  editar: boolean;
  excluir: boolean;
  incluir: boolean;
  relatorio: boolean;
}

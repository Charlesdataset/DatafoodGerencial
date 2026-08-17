export interface Usuario {
  idUsuario: number;
  nome: string;
  franquiaId: number;
  franquia: string;
  ativo: boolean;

  // ===== PERMISSÕES DE CLIENTE =====
  cliente_entrar: boolean;
  cliente_editar: boolean;
  cliente_excluir: boolean;
  cliente_incluir: boolean;
  cliente_relatorio: boolean;

  // ===== PERMISSÕES DE CIDADE =====
  cidade_entrar: boolean;
  cidade_editar: boolean;
  cidade_excluir: boolean;
  cidade_incluir: boolean;
  cidade_relatorio: boolean;

  // ===== PERMISSÕES DE USUÁRIO =====
  usuario_entrar: boolean;
  usuario_editar: boolean;
  usuario_excluir: boolean;
  usuario_incluir: boolean;
  usuario_relatorio: boolean;

  // ===== PERMISSÕES DE PLANO =====
  plano_entrar: boolean;
  plano_editar: boolean;
  plano_excluir: boolean;
  plano_incluir: boolean;
  plano_relatorio: boolean;

  // ===== PERMISSÕES GERAIS =====
  dashboard: boolean;
  configuracao: boolean;
}

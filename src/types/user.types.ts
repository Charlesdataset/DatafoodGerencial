// src/types/user.types.ts

export interface User {
  id: number;
  nome: string;
  franquia: string;
  permissoes?: {
    entrar: boolean;
    editar: boolean;
    excluir: boolean;
    incluir: boolean;
    relatorio: boolean;
  };
}

export const initialUser: User = {
  id: 0,
  nome: "",
  franquia: "",
  permissoes: {
    entrar: false,
    editar: false,
    excluir: false,
    incluir: false,
    relatorio: false,
  },
};

// Tipos para o sistema de autenticação

export interface EmpresaState {
  userId: number;
  password: string;
  cnpjCpf: string;
  remember: boolean;
}

export interface User {
  idUsuario: number;
  nomeUsuario: string;
  email: string;
  token: string;
  cnpjCpf: string;
  idEmpresa: number;
  permissoes: Permissoes;
}

export interface Permissoes {
  dashView: boolean;
  grupView: boolean;
  grupCad: boolean;
  grupEdi: boolean;
  grupDel: boolean;
  prodView: boolean;
  prodCad: boolean;
  prodEdi: boolean;
  prodDel: boolean;
  caixaView: boolean;
  frmpView: boolean;
  frmpCad: boolean;
  frmpEdi: boolean;
  frmpDel: boolean;
  usuView: boolean;
  usuCad: boolean;
  usuEdi: boolean;
  usuDel: boolean;
  eventView: boolean;
  eventEdi: boolean;
  maqView: boolean;
  maqCad: boolean;
  maqEdi: boolean;
  setaPermissao: boolean;
}

export interface Event {
  value: number;
  label: string;
}

export interface LoginResponse {
  idUsuario: number;
  nomeUsuario: string;
  email: string;
  token: string;
  cnpjCpf: string;
  idEmpresa: number;
  permissoes: Permissoes;
}

export interface ApiError {
  message: string;
  status: number;
}

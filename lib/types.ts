export type Role = 'superuser' | 'delegacia';

export interface DelegaciaRecord {
  id: number;
  nome: string;
  codigo: string;
  username: string;
  ativa: boolean;
  criada_em: string;
  senha_hash?: string;
}

export interface IndexInfo {
  tipo: string;
  ultimo_numero: number;
  numero_inicial: number;
}

export interface DocumentoRecord {
  id: number;
  delegacia: string;
  tipo: string;
  numero: string;
  destino: string | null;
  data_emissao: string;
  ano: number;
}

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  delegacia?: {
    id: number;
    nome: string;
    codigo: string;
    username: string;
  };
}

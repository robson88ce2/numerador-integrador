export type Delegacia = {
  id: number;
  nome: string;
  codigo: string;
  username: string;
  ativa: boolean;
};

export type Documento = {
  delegacia: string;
  tipo: string;
  numero: string;
  destino: string;
  data_emissao: string;
  ano: number;
};

export type IndexInfo = {
  tipo: string;
  ultimo_numero: number;
  numero_inicial: number;
};

export type FormState = {
  nome: string;
  codigo: string;
  username: string;
  senha: string;
  senha2: string;
};

export type EditFormState = {
  nome: string;
  codigo: string;
  username: string;
};

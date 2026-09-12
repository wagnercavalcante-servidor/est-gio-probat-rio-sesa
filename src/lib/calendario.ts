export const ETAPAS = [
  { valor: "avaliacao_chefia", rotulo: "Avaliação pela chefia imediata (FAPEP 1)" },
  { valor: "avaliacao_pares", rotulo: "Avaliação pelos pares (FAPEP 2)" },
  { valor: "ciencia_servidor", rotulo: "Ciência do servidor avaliado" },
  { valor: "pedido_reconsideracao", rotulo: "Pedido de reconsideração" },
  { valor: "resposta_chefia", rotulo: "Resposta da chefia ao pedido de reconsideração" },
  { valor: "ciencia_resposta_chefia", rotulo: "Ciência da resposta ao pedido de reconsideração" },
  { valor: "recurso_comissao_setorial", rotulo: "Recurso à comissão setorial" },
  { valor: "resposta_comissao_setorial", rotulo: "Resposta da comissão setorial" },
  { valor: "ciencia_resposta_setorial", rotulo: "Ciência da resposta da comissão setorial" },
  { valor: "recurso_comissao_central", rotulo: "Recurso à comissão central" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["valor"];

export const ROTULO_ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.valor, e.rotulo])) as Record<Etapa, string>;

export type Ciclo = {
  id: string;
  nome: string;
  numero_avaliacao: number | null;
  orgao: string | null;
  ativo: boolean;
  created_at: string;
};

export type CicloEtapa = {
  id: string;
  ciclo_id: string;
  etapa: Etapa;
  data_inicio: string | null;
  data_fim: string | null;
};

export function formatarDataBr(valor?: string | null): string {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

/** Verifica se hoje está dentro da janela (datas ausentes não restringem). */
export function dentroDaJanela(etapa?: Pick<CicloEtapa, "data_inicio" | "data_fim"> | null): boolean {
  if (!etapa) return true;
  const hoje = new Date().toISOString().slice(0, 10);
  if (etapa.data_inicio && hoje < etapa.data_inicio) return false;
  if (etapa.data_fim && hoje > etapa.data_fim) return false;
  return true;
}

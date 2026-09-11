import type { TipoFormulario } from "@/lib/formularios";

export type StatusFluxo =
  | "aguardando_servidor"
  | "em_revisao"
  | "aguardando_servidor_revisao"
  | "aguardando_recurso"
  | "recurso_apresentado"
  | "aguardando_homologacao"
  | "homologado"
  | "concluido";

export const ROTULO_STATUS: Record<string, string> = {
  aguardando_servidor: "Aguardando manifestação do servidor",
  em_revisao: "Aguardando revisão da chefia imediata",
  aguardando_servidor_revisao: "Aguardando manifestação sobre a revisão",
  aguardando_recurso: "Aguardando recurso do servidor",
  recurso_apresentado: "Recurso apresentado — aguardando comissão",
  aguardando_homologacao: "Aguardando homologação da comissão setorial",
  homologado: "Homologado pela comissão setorial",
  concluido: "Concluído",
};

export const COLUNAS_FORMULARIO =
  "id, tipo, servidor_nome, servidor_matricula, orgao, numero_avaliacao, pontuacao, created_at, dados, status, prazo_resposta, resposta_servidor, resposta_em, dados_revisao, revisado_em, homologacao, homologado_em, servidor_user_id, created_by, raep_formulario_id";

export type RegistroFormulario = {
  id: string;
  tipo: TipoFormulario;
  servidor_nome: string;
  servidor_matricula: string | null;
  orgao: string | null;
  numero_avaliacao: number | null;
  pontuacao: number | null;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: any;
  status: StatusFluxo;
  prazo_resposta: string | null;
  resposta_servidor: string | null;
  resposta_em: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados_revisao: any;
  revisado_em: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  homologacao: any;
  homologado_em: string | null;
  servidor_user_id: string | null;
  created_by: string;
  raep_formulario_id: string | null;
};

/** Prazo de resposta: 3 dias úteis a contar de hoje, até as 23h59. */
export function prazoTresDiasUteis(inicio = new Date()): string {
  const data = new Date(inicio.getTime());
  let uteis = 0;
  while (uteis < 3) {
    data.setDate(data.getDate() + 1);
    const dia = data.getDay();
    if (dia !== 0 && dia !== 6) uteis += 1;
  }
  data.setHours(23, 59, 0, 0);
  return data.toISOString();
}

export function formatarPrazo(valor?: string | null): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

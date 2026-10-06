import { ErroDominio } from "../shared/base";
import { PRAZOS_LEGAIS, PrazoDiasUteis } from "../prazos/PrazoDiasUteis";

/** Estados persistidos do fluxo de um FAPEP 1/2. */
export type EstadoFluxo =
  | "aguardando_servidor"
  | "em_revisao"
  | "aguardando_servidor_revisao"
  | "aguardando_recurso"
  | "recurso_apresentado"
  | "aguardando_homologacao"
  | "homologado"
  | "concluido";

export type AcaoFluxo =
  | "concordar"
  | "discordar"
  | "revisar"
  | "protocolar_recurso"
  | "homologar";

export type ContextoFluxo = {
  /** Prazo final de manifestação do servidor (ISO). */
  prazoResposta?: string | null;
  /** Data em que o servidor se manifestou (ISO) — início dos prazos seguintes. */
  respostaEm?: string | null;
  agora?: Date;
  prazos?: PrazoDiasUteis;
};

const TRANSICOES: Record<AcaoFluxo, Partial<Record<EstadoFluxo, EstadoFluxo>>> = {
  concordar: {
    aguardando_servidor: "aguardando_homologacao",
    aguardando_servidor_revisao: "aguardando_homologacao",
  },
  discordar: {
    aguardando_servidor: "em_revisao",
    aguardando_servidor_revisao: "aguardando_recurso",
  },
  revisar: { em_revisao: "aguardando_servidor_revisao" },
  protocolar_recurso: { aguardando_recurso: "recurso_apresentado" },
  homologar: { aguardando_homologacao: "homologado", recurso_apresentado: "homologado" },
};

const MENSAGEM: Record<AcaoFluxo, string> = {
  concordar: "A manifestação do servidor só é possível enquanto a avaliação aguarda sua ciência.",
  discordar: "A manifestação do servidor só é possível enquanto a avaliação aguarda sua ciência.",
  revisar: "A revisão só é possível após pedido de reconsideração do servidor.",
  protocolar_recurso: "O recurso (RAEP) só é possível após discordância da revisão.",
  homologar: "A homologação exige concordância do servidor ou recurso apresentado.",
};

/**
 * Serviço de domínio: valida estado e prazo legal antes de cada ação e
 * devolve o próximo estado. Lança ErroDominio quando a ação não é permitida.
 */
export function decidirTransicao(estado: EstadoFluxo, acao: AcaoFluxo, ctx: ContextoFluxo = {}): EstadoFluxo {
  const proximo = TRANSICOES[acao][estado];
  if (!proximo) throw new ErroDominio(MENSAGEM[acao]);
  const agora = ctx.agora ?? new Date();
  const prazos = ctx.prazos ?? new PrazoDiasUteis();

  if ((acao === "concordar" || acao === "discordar") && ctx.prazoResposta) {
    if (agora.getTime() > new Date(ctx.prazoResposta).getTime()) {
      throw new ErroDominio(
        `Prazo de ${PRAZOS_LEGAIS.pedidoReconsideracao} dias úteis para manifestação encerrado (concordância tácita).`,
      );
    }
  }
  if (acao === "revisar" && ctx.respostaEm) {
    if (prazos.vencido(new Date(ctx.respostaEm), PRAZOS_LEGAIS.respostaReconsideracao, agora)) {
      throw new ErroDominio(
        `Prazo de ${PRAZOS_LEGAIS.respostaReconsideracao} dias úteis para resposta à reconsideração encerrado.`,
      );
    }
  }
  if (acao === "protocolar_recurso" && ctx.respostaEm) {
    if (prazos.vencido(new Date(ctx.respostaEm), PRAZOS_LEGAIS.recursoSetorial, agora)) {
      throw new ErroDominio(`Preclusão: prazo de ${PRAZOS_LEGAIS.recursoSetorial} dias úteis para recurso encerrado.`);
    }
  }
  return proximo;
}

/** Termo final em dias úteis, até 23h59 do último dia. */
export function prazoFinalDiasUteis(inicio: Date, dias: number, prazos = new PrazoDiasUteis()): string {
  const local = new Date(Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()));
  const termo = prazos.termoFinal(local, dias);
  return new Date(termo.getUTCFullYear(), termo.getUTCMonth(), termo.getUTCDate(), 23, 59, 0, 0).toISOString();
}

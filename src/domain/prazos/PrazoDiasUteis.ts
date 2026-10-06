import { ErroDominio } from "../shared/base";

/** Prazos regulamentares em dias úteis (Decreto nº 36.773/2025). */
export const PRAZOS_LEGAIS = {
  pedidoReconsideracao: 3,
  respostaReconsideracao: 5,
  recursoSetorial: 5,
  julgamentoSetorial: 10,
  recursoCentral: 5,
  julgamentoCentral: 10,
} as const;

function chave(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Objeto de valor: calcula prazos em dias úteis, excluindo sábados, domingos
 * e feriados informados (formato AAAA-MM-DD). Datas tratadas em UTC.
 */
export class PrazoDiasUteis {
  private readonly feriados: ReadonlySet<string>;

  constructor(feriados: Iterable<string> = []) {
    this.feriados = new Set(feriados);
  }

  public ehDiaUtil(data: Date): boolean {
    const dia = data.getUTCDay();
    return dia !== 0 && dia !== 6 && !this.feriados.has(chave(data));
  }

  /** Termo final: conta a partir do primeiro dia útil seguinte à ciência. */
  public termoFinal(dataCiencia: Date, dias: number): Date {
    if (!Number.isInteger(dias) || dias < 1) throw new ErroDominio("Prazo deve ser um número inteiro positivo de dias úteis.");
    const d = new Date(Date.UTC(dataCiencia.getUTCFullYear(), dataCiencia.getUTCMonth(), dataCiencia.getUTCDate()));
    let contados = 0;
    while (contados < dias) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (this.ehDiaUtil(d)) contados++;
    }
    return d;
  }

  /** O prazo vence ao fim do dia do termo final. */
  public vencido(dataCiencia: Date, dias: number, agora: Date): boolean {
    return chave(agora) > chave(this.termoFinal(dataCiencia, dias));
  }
}

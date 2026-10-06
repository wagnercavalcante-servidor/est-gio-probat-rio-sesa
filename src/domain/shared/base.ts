/** Erro de regra de negócio (violação de invariante do Decreto nº 36.773/2025). */
export class ErroDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDominio";
  }
}

/** Evento de domínio: fato relevante ocorrido no ciclo avaliativo. */
export interface EventoDominio {
  readonly tipo: string;
  readonly ocorridoEm: Date;
  readonly dados: Record<string, unknown>;
}

/** Raiz de agregação: acumula eventos de domínio para publicação posterior. */
export abstract class RaizAgregado {
  private eventos: EventoDominio[] = [];

  protected registrarEvento(tipo: string, dados: Record<string, unknown> = {}, ocorridoEm = new Date()): void {
    this.eventos.push({ tipo, ocorridoEm, dados });
  }

  /** Retorna e limpa os eventos pendentes. */
  public coletarEventos(): EventoDominio[] {
    const lista = this.eventos;
    this.eventos = [];
    return lista;
  }
}

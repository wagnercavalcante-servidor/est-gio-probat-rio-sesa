import { ErroDominio, RaizAgregado } from "../shared/base";
import { PRAZOS_LEGAIS, type PrazoDiasUteis } from "../prazos/PrazoDiasUteis";

export type Instancia = "setorial" | "central";
export type StatusRecurso = "protocolado" | "deferido" | "indeferido";

/**
 * Raiz de agregação do RAEP. Invariantes:
 * - protocolo em até 5 dias úteis da ciência (senão, preclusão);
 * - julgamento em 10 dias úteis, com no máximo uma prorrogação justificada de igual prazo.
 */
export class RecursoRaep extends RaizAgregado {
  private _status: StatusRecurso = "protocolado";
  private prorrogado = false;

  private constructor(
    public readonly id: string,
    public readonly instancia: Instancia,
    public readonly protocoladoEm: Date,
    private readonly prazos: PrazoDiasUteis,
  ) {
    super();
  }

  public static protocolar(p: {
    id: string;
    instancia: Instancia;
    dataCienciaDecisao: Date;
    razoes: string;
    prazos: PrazoDiasUteis;
    agora?: Date;
  }): RecursoRaep {
    const agora = p.agora ?? new Date();
    if (!p.razoes.trim()) throw new ErroDominio("O recurso deve apresentar as razões do servidor.");
    const dias = p.instancia === "setorial" ? PRAZOS_LEGAIS.recursoSetorial : PRAZOS_LEGAIS.recursoCentral;
    if (p.prazos.vencido(p.dataCienciaDecisao, dias, agora)) {
      throw new ErroDominio(`Preclusão: prazo de ${dias} dias úteis para recurso encerrado.`);
    }
    const r = new RecursoRaep(p.id, p.instancia, agora, p.prazos);
    r.registrarEvento("RecursoRaepProtocolado", { id: p.id, instancia: p.instancia }, agora);
    return r;
  }

  get status() { return this._status; }

  public prazoJulgamento(): Date {
    const base = this.instancia === "setorial" ? PRAZOS_LEGAIS.julgamentoSetorial : PRAZOS_LEGAIS.julgamentoCentral;
    return this.prazos.termoFinal(this.protocoladoEm, this.prorrogado ? base * 2 : base);
  }

  public prorrogar(justificativa: string, agora = new Date()): void {
    if (this._status !== "protocolado") throw new ErroDominio("Recurso já julgado.");
    if (this.prorrogado) throw new ErroDominio("Só é admitida uma prorrogação por igual prazo.");
    if (!justificativa.trim()) throw new ErroDominio("A prorrogação exige justificativa.");
    this.prorrogado = true;
    this.registrarEvento("PrazoJulgamentoProrrogado", { id: this.id, justificativa }, agora);
  }

  public julgar(deferido: boolean, fundamentacao: string, agora = new Date()): void {
    if (this._status !== "protocolado") throw new ErroDominio("Recurso já julgado.");
    if (!fundamentacao.trim()) throw new ErroDominio("A decisão da comissão deve ser fundamentada.");
    this._status = deferido ? "deferido" : "indeferido";
    this.registrarEvento("RecursoJulgado", { id: this.id, deferido }, agora);
  }
}

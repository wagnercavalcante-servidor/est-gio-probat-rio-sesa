import { ErroDominio, RaizAgregado } from "../shared/base";
import { PRAZOS_LEGAIS, type PrazoDiasUteis } from "../prazos/PrazoDiasUteis";
import { Nota, PontuacaoTotal } from "./Nota";

export type StatusAvaliacao =
  | "rascunho"
  | "assinada"
  | "aguardando_ciencia"
  | "concordancia"
  | "concordancia_tacita"
  | "reconsideracao_solicitada"
  | "revisada"
  | "homologada";

export type Alteracao = { criterio: string; anterior: number; nova: number };

/**
 * Raiz de agregação do FAPEP 1/2. Garante as invariantes:
 * - só assina com todos os critérios pontuados;
 * - notas só mudam em rascunho ou na resposta à reconsideração (com histórico);
 * - concordância tácita somente após 3 dias úteis da ciência;
 * - homologada é imutável.
 */
export class AvaliacaoFapep extends RaizAgregado {
  private notas = new Map<string, Nota>();
  private _status: StatusAvaliacao = "rascunho";
  private dataCiencia?: Date;
  private _alteracoes: Alteracao[] = [];

  constructor(public readonly id: string, private readonly criterios: readonly string[]) {
    super();
    if (criterios.length === 0) throw new ErroDominio("A avaliação precisa de ao menos um critério.");
  }

  get status() { return this._status; }
  get alteracoes(): readonly Alteracao[] { return this._alteracoes; }
  get pontuacao(): PontuacaoTotal { return PontuacaoTotal.de([...this.notas.values()]); }

  public pendencias(): string[] {
    return this.criterios.filter((c) => !this.notas.has(c));
  }

  public pontuar(criterio: string, nota: Nota): void {
    if (!this.criterios.includes(criterio)) throw new ErroDominio(`Critério desconhecido: ${criterio}.`);
    if (this._status === "rascunho") {
      this.notas.set(criterio, nota);
      return;
    }
    if (this._status === "reconsideracao_solicitada") {
      const anterior = this.notas.get(criterio);
      if (anterior && !anterior.igual(nota)) {
        this._alteracoes.push({ criterio, anterior: anterior.valor, nova: nota.valor });
      }
      this.notas.set(criterio, nota);
      return;
    }
    throw new ErroDominio("As notas só podem ser alteradas em rascunho ou na resposta à reconsideração.");
  }

  public assinar(agora = new Date()): void {
    if (this._status !== "rascunho") throw new ErroDominio("Somente avaliações em rascunho podem ser assinadas.");
    const faltam = this.pendencias();
    if (faltam.length) throw new ErroDominio(`Critérios sem nota: ${faltam.join(", ")}.`);
    this._status = "assinada";
    this.registrarEvento("AvaliacaoAssinada", { id: this.id }, agora);
  }

  public notificarServidor(agora = new Date()): void {
    if (this._status !== "assinada" && this._status !== "revisada") throw new ErroDominio("Avaliação ainda não está pronta para ciência.");
    this._status = "aguardando_ciencia";
    this.dataCiencia = agora;
    this.registrarEvento("NotificacaoCienciaDisparada", { id: this.id }, agora);
  }

  public concordar(agora = new Date()): void {
    this.exigir("aguardando_ciencia");
    this._status = "concordancia";
    this.registrarEvento("ConcordanciaRegistrada", { id: this.id }, agora);
  }

  public solicitarReconsideracao(justificativa: string, prazos: PrazoDiasUteis, agora = new Date()): void {
    this.exigir("aguardando_ciencia");
    if (!justificativa.trim()) throw new ErroDominio("O pedido de reconsideração deve ser justificado.");
    if (this._alteracoes.length > 0) throw new ErroDominio("Após a revisão, a discordância segue por recurso (RAEP).");
    if (prazos.vencido(this.dataCiencia!, PRAZOS_LEGAIS.pedidoReconsideracao, agora)) {
      throw new ErroDominio("Prazo de 3 dias úteis para reconsideração encerrado.");
    }
    this._status = "reconsideracao_solicitada";
    this.registrarEvento("ReconsideracaoSolicitada", { id: this.id, justificativa }, agora);
  }

  public concluirRevisao(agora = new Date()): void {
    this.exigir("reconsideracao_solicitada");
    this._status = "revisada";
    this.registrarEvento("RevisaoConcluida", { id: this.id, alteracoes: this._alteracoes.length }, agora);
  }

  public registrarConcordanciaTacita(prazos: PrazoDiasUteis, agora = new Date()): void {
    this.exigir("aguardando_ciencia");
    if (!prazos.vencido(this.dataCiencia!, PRAZOS_LEGAIS.pedidoReconsideracao, agora)) {
      throw new ErroDominio("O prazo de 3 dias úteis ainda não decorreu.");
    }
    this._status = "concordancia_tacita";
    this.registrarEvento("ConcordanciaTacitaRegistrada", { id: this.id }, agora);
  }

  public homologar(agora = new Date()): void {
    if (this._status !== "concordancia" && this._status !== "concordancia_tacita") {
      throw new ErroDominio("Só é possível homologar após concordância (expressa ou tácita) ou decisão de recurso.");
    }
    this._status = "homologada";
    this.registrarEvento("AvaliacaoHomologada", { id: this.id, percentual: this.pontuacao.percentual }, agora);
  }

  private exigir(status: StatusAvaliacao): void {
    if (this._status !== status) throw new ErroDominio(`Operação inválida no estado "${this._status}".`);
  }
}

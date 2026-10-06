import { describe, expect, it } from "vitest";
import { AvaliacaoFapep, Nota, PrazoDiasUteis, RecursoRaep } from "./index";

const prazos = new PrazoDiasUteis(["2026-10-12"]); // feriado
const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe("PrazoDiasUteis", () => {
  it("ignora fim de semana e feriado", () => {
    // sex 09/10 + 3 úteis: ter 13, qua 14, qui 15 (seg 12 feriado)
    expect(prazos.termoFinal(d("2026-10-09"), 3).toISOString().slice(0, 10)).toBe("2026-10-15");
  });
});

describe("AvaliacaoFapep", () => {
  const nova = () => new AvaliacaoFapep("a1", ["assiduidade", "disciplina"]);

  it("não assina com critérios pendentes", () => {
    const a = nova();
    a.pontuar("assiduidade", Nota.criar(8, 10));
    expect(() => a.assinar()).toThrow(/sem nota/);
  });

  it("rejeita nota fora da escala", () => {
    expect(() => Nota.criar(11, 10)).toThrow();
  });

  it("registra concordância tácita só após 3 dias úteis e homologa", () => {
    const a = nova();
    a.pontuar("assiduidade", Nota.criar(8, 10));
    a.pontuar("disciplina", Nota.criar(10, 10));
    a.assinar();
    a.notificarServidor(d("2026-10-09"));
    expect(() => a.registrarConcordanciaTacita(prazos, d("2026-10-15"))).toThrow();
    a.registrarConcordanciaTacita(prazos, d("2026-10-16"));
    a.homologar();
    expect(a.status).toBe("homologada");
    expect(a.pontuacao.percentual).toBe(90);
  });

  it("guarda histórico das notas alteradas na reconsideração", () => {
    const a = nova();
    a.pontuar("assiduidade", Nota.criar(6, 10));
    a.pontuar("disciplina", Nota.criar(10, 10));
    a.assinar();
    a.notificarServidor(d("2026-10-09"));
    a.solicitarReconsideracao("Faltas justificadas", prazos, d("2026-10-13"));
    a.pontuar("assiduidade", Nota.criar(9, 10));
    a.concluirRevisao();
    expect(a.alteracoes).toEqual([{ criterio: "assiduidade", anterior: 6, nova: 9 }]);
  });
});

describe("RecursoRaep", () => {
  it("aplica preclusão e prorrogação única", () => {
    expect(() =>
      RecursoRaep.protocolar({ id: "r", instancia: "setorial", dataCienciaDecisao: d("2026-10-01"), razoes: "x", prazos, agora: d("2026-10-20") }),
    ).toThrow(/Preclusão/);
    const r = RecursoRaep.protocolar({ id: "r", instancia: "setorial", dataCienciaDecisao: d("2026-10-09"), razoes: "x", prazos, agora: d("2026-10-13") });
    r.prorrogar("Diligências");
    expect(() => r.prorrogar("de novo")).toThrow(/uma prorrogação/);
  });
});

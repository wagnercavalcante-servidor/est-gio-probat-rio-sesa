import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bloco, CampoArea } from "@/components/Campos";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";
import { PONTUACAO_MAXIMA, REQUISITOS, TIPOS, somaNotas } from "@/lib/formularios";
import { AlternarTestes } from "@/components/AlternarTestes";
import { COLUNAS_FORMULARIO, prazoTresDiasUteis, type RegistroFormulario } from "@/lib/fluxo";

export function PainelRevisao({ userId }: { userId: string }) {
  const [registros, setRegistros] = useState<RegistroFormulario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ativo, setAtivo] = useState<RegistroFormulario | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [incluirTestes, setIncluirTestes] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    let consulta = supabase
      .from("formularios")
      .select(COLUNAS_FORMULARIO)
      .eq("created_by", userId)
      .eq("status", "em_revisao")
      .order("created_at", { ascending: false });
    if (!incluirTestes) consulta = consulta.eq("teste", false);
    const { data, error } = await consulta;
    setCarregando(false);
    if (error) {
      toast.error("Erro ao carregar revisões: " + error.message);
      return;
    }
    setRegistros((data ?? []) as unknown as RegistroFormulario[]);
  }, [userId, incluirTestes]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const abrir = (r: RegistroFormulario) => {
    setAtivo(r);
    setNotas({ ...(r.dados?.notas ?? {}) });
    setJustificativas({ ...(r.dados?.justificativas ?? {}) });
    setObservacoes(r.dados?.observacoes ?? "");
  };

  const total = useMemo(() => somaNotas(notas), [notas]);

  const revisao = useMemo(
    () => (ativo ? { ...ativo.dados, notas, justificativas, observacoes } : null),
    [ativo, notas, justificativas, observacoes],
  );

  const enviar = async () => {
    if (!ativo || !revisao) return;
    setSalvando(true);
    const { error } = await supabase
      .from("formularios")
      .update({
        dados_revisao: revisao,
        revisado_em: new Date().toISOString(),
        pontuacao: total,
        status: "aguardando_servidor_revisao",
        prazo_resposta: prazoTresDiasUteis(),
      })
      .eq("id", ativo.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível registrar a revisão: " + error.message);
      return;
    }
    toast.success("Revisão registrada. O servidor avaliado foi notificado e tem 3 dias úteis para se manifestar.");
    setAtivo(null);
    void carregar();
  };

  if (ativo && revisao) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <p className="mr-auto text-sm">
              Revisão da avaliação de <strong>{ativo.servidor_nome}</strong>. Os pontos alterados aparecem destacados
              em outra cor no documento.
            </p>
            <Button variant="outline" size="sm" onClick={() => setAtivo(null)}>
              Voltar
            </Button>
            <Button size="sm" onClick={enviar} disabled={salvando}>
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Concluir revisão
            </Button>
          </div>

          <Bloco titulo={`Revisão dos critérios — máximo ${PONTUACAO_MAXIMA} pontos`}>
            <div className="space-y-5">
              {REQUISITOS.map((req) => (
                <div key={req.id}>
                  <p className="text-xs font-bold uppercase text-foreground">{req.titulo}</p>
                  <div className="mt-2 space-y-3">
                    {req.criterios.map((crit) => {
                      const original = String(ativo.dados?.notas?.[crit.id] ?? "");
                      const alterada = String(notas[crit.id] ?? "") !== original;
                      return (
                        <div key={crit.id} className="rounded-md border border-border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">
                              {crit.id} — {crit.nome}
                              {alterada && (
                                <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase text-accent-foreground">
                                  revisado
                                </span>
                              )}
                            </p>
                            <div className="w-24 shrink-0">
                              <Label className="text-[10px] uppercase text-muted-foreground">
                                Nota (antes {original || "—"})
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={notas[crit.id] ?? ""}
                                onChange={(e) => setNotas((a) => ({ ...a, [crit.id]: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <CampoArea
                            rotulo="Considerações / justificativa / feedback"
                            linhas={3}
                            valor={justificativas[crit.id] ?? ""}
                            aoMudar={(v) => setJustificativas((a) => ({ ...a, [crit.id]: v }))}
                            className="mt-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
              Resultado revisado: {total} de {PONTUACAO_MAXIMA} pontos (
              {Math.round((total / PONTUACAO_MAXIMA) * 100)}%)
            </p>
          </Bloco>

          <Bloco titulo="Observações da revisão">
            <CampoArea rotulo="Observações" valor={observacoes} aoMudar={setObservacoes} />
          </Bloco>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-auto rounded-lg border border-border bg-muted p-4">
            <div className="mx-auto w-fit shadow-panel">
              <DocumentoFormulario
                tipo={ativo.tipo}
                dados={ativo.dados}
                revisao={revisao}
                registro={{ id: ativo.id, created_at: ativo.created_at }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlternarTestes valor={incluirTestes} aoMudar={setIncluirTestes} />
      {carregando ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando…
        </p>
      ) : registros.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma avaliação aguardando revisão.
        </p>
      ) : (
        <ul className="space-y-3">
          {registros.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-panel"
            >
              <div className="min-w-56 flex-1">
                <p className="text-sm font-semibold">{r.servidor_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {TIPOS[r.tipo].sigla}
                  {r.numero_avaliacao ? ` · ${r.numero_avaliacao}ª avaliação` : ""} · pedido de reconsideração em{" "}
                  {r.resposta_em ? new Date(r.resposta_em).toLocaleString("pt-BR") : "—"}
                </p>
              </div>
              <Button size="sm" onClick={() => abrir(r)}>
                Refazer avaliação
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

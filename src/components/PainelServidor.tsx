import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";
import { FormRaep } from "@/components/forms/FormRaep";
import { baixarPdfPaginaUnica } from "@/lib/pdf";
import { TIPOS } from "@/lib/formularios";
import {
  COLUNAS_FORMULARIO,
  ROTULO_STATUS,
  formatarPrazo,
  type RegistroFormulario,
} from "@/lib/fluxo";

export function PainelServidor({ userId }: { userId: string }) {
  const [registros, setRegistros] = useState<RegistroFormulario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<RegistroFormulario | null>(null);
  const [recurso, setRecurso] = useState<RegistroFormulario | null>(null);
  const referencia = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    await supabase.rpc("expirar_prazos_avaliacao" as never);
    const { data, error } = await supabase
      .from("formularios")
      .select(COLUNAS_FORMULARIO)
      .eq("servidor_user_id", userId)
      .order("created_at", { ascending: false });
    setCarregando(false);
    if (error) {
      toast.error("Erro ao carregar suas avaliações: " + error.message);
      return;
    }
    setRegistros((data ?? []) as unknown as RegistroFormulario[]);
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const responder = async (r: RegistroFormulario, concorda: boolean) => {
    const revisao = r.status === "aguardando_servidor_revisao";
    const novoStatus = concorda ? "aguardando_homologacao" : revisao ? "aguardando_recurso" : "em_revisao";
    const { error } = await supabase
      .from("formularios")
      .update({
        status: novoStatus,
        resposta_servidor: concorda ? "concorda" : "discorda",
        resposta_em: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (error) {
      toast.error("Não foi possível registrar sua manifestação: " + error.message);
      return;
    }
    toast.success(
      concorda
        ? "Concordância registrada. A avaliação segue para homologação da comissão setorial."
        : revisao
          ? "Discordância registrada. Você já pode apresentar o recurso (RAEP) à comissão setorial."
          : "Pedido de reconsideração registrado. A chefia imediata fará a revisão da avaliação.",
    );
    void carregar();
  };

  const baixar = async (r: RegistroFormulario) => {
    setSelecionado(r);
    toast.info("Gerando PDF…");
    await new Promise((resolver) => setTimeout(resolver, 400));
    if (referencia.current) {
      await baixarPdfPaginaUnica(referencia.current, `${r.tipo}-${r.servidor_nome.replace(/\s+/g, "_")}.pdf`);
    }
  };

  if (recurso) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setRecurso(null)}>
          Voltar às minhas avaliações
        </Button>
        <FormRaep
          vinculo={{
            formularioId: recurso.id,
            nome: recurso.servidor_nome,
            matricula: recurso.servidor_matricula ?? "",
            orgao: recurso.orgao ?? "",
            descricao: `${TIPOS[recurso.tipo].sigla}${
              recurso.numero_avaliacao ? ` — ${recurso.numero_avaliacao}ª avaliação parcial` : ""
            }`,
          }}
          aoConcluir={() => {
            setRecurso(null);
            void carregar();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {carregando ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando suas avaliações…
        </p>
      ) : registros.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Você ainda não possui avaliações registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {registros.map((r) => {
            const aguardando = r.status === "aguardando_servidor" || r.status === "aguardando_servidor_revisao";
            return (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4 shadow-panel">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-56 flex-1">
                    <p className="text-sm font-semibold">
                      {TIPOS[r.tipo].sigla}
                      {r.numero_avaliacao ? ` — ${r.numero_avaliacao}ª avaliação parcial` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROTULO_STATUS[r.status] ?? r.status}
                      {aguardando ? ` · prazo até ${formatarPrazo(r.prazo_resposta)}` : ""}
                      {r.pontuacao != null ? ` · ${r.pontuacao} pontos` : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelecionado(r)}>
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => baixar(r)}>
                    <Download className="size-4" /> PDF
                  </Button>
                </div>

                {aguardando && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-secondary p-3">
                    <p className="mr-auto text-xs text-secondary-foreground">
                      Você tem até {formatarPrazo(r.prazo_resposta)} para se manifestar. Sem manifestação no prazo, a
                      concordância é registrada automaticamente.
                    </p>
                    <Button size="sm" onClick={() => responder(r, true)}>
                      <CheckCircle2 className="size-4" /> Concordo
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => responder(r, false)}>
                      <XCircle className="size-4" />
                      {r.status === "aguardando_servidor" ? "Peço reconsideração" : "Discordo da revisão"}
                    </Button>
                  </div>
                )}

                {r.status === "aguardando_recurso" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-secondary p-3">
                    <p className="mr-auto text-xs text-secondary-foreground">
                      Redija o recurso (RAEP) à Comissão Setorial de Avaliação Especial.
                    </p>
                    <Button size="sm" onClick={() => setRecurso(r)}>
                      Redigir recurso
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {selecionado && (
        <div className="overflow-auto rounded-lg border border-border bg-muted p-4">
          <div className="mx-auto w-fit shadow-panel">
            <DocumentoFormulario
              ref={referencia}
              tipo={selecionado.tipo}
              dados={selecionado.dados}
              revisao={selecionado.dados_revisao ?? undefined}
              homologacao={selecionado.homologacao ?? undefined}
              registro={{ id: selecionado.id, created_at: selecionado.created_at }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

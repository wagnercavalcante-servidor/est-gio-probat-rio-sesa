import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Loader2, Plus, TimerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bloco } from "@/components/Campos";
import { TIPOS } from "@/lib/formularios";
import { COLUNAS_FORMULARIO, ROTULO_STATUS, formatarPrazo, type RegistroFormulario } from "@/lib/fluxo";
import { ROTEIRO_TESTE, dadosFapepTeste } from "@/lib/teste";

export function PainelTeste({ userId, email }: { userId: string; email?: string }) {
  const [registros, setRegistros] = useState<RegistroFormulario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    await supabase.rpc("expirar_prazos_avaliacao" as never);
    const { data, error } = await supabase
      .from("formularios")
      .select(COLUNAS_FORMULARIO)
      .eq("teste", true)
      .order("created_at", { ascending: false });
    setCarregando(false);
    if (error) {
      toast.error("Erro ao carregar os registros de teste: " + error.message);
      return;
    }
    setRegistros((data ?? []) as unknown as RegistroFormulario[]);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const criar = async (tipo: "FAPEP1" | "FAPEP2") => {
    setOcupado(true);
    const { dados, pontuacao } = dadosFapepTeste(tipo, email ?? "Administrador de teste");
    const { error } = await supabase.from("formularios").insert({
      tipo,
      servidor_nome: dados.identificacao.nome,
      servidor_matricula: dados.identificacao.matricula,
      orgao: dados.identificacao.orgao,
      numero_avaliacao: 1,
      pontuacao,
      dados,
      created_by: userId,
      teste: true,
    });
    setOcupado(false);
    if (error) {
      toast.error("Não foi possível criar a avaliação de teste: " + error.message);
      return;
    }
    toast.success(
      `${TIPOS[tipo].sigla} de teste criado. Abra a aba “Minhas avaliações” e marque “incluir registros de teste”.`,
    );
    void carregar();
  };

  const encerrarPrazo = async (id: string) => {
    setOcupado(true);
    const { error } = await supabase.rpc("encerrar_prazo_teste" as never, { _id: id } as never);
    setOcupado(false);
    if (error) {
      toast.error("Não foi possível encerrar o prazo: " + error.message);
      return;
    }
    toast.success("Prazo encerrado. A concordância tácita foi aplicada.");
    void carregar();
  };

  const apagar = async (ids: string[]) => {
    if (ids.length === 0) return;
    setOcupado(true);
    await supabase.from("assinaturas").delete().in("formulario_id", ids);
    const { error } = await supabase.from("formularios").delete().in("id", ids);
    setOcupado(false);
    if (error) {
      toast.error("Não foi possível apagar: " + error.message);
      return;
    }
    toast.success(ids.length > 1 ? "Registros de teste apagados." : "Registro de teste apagado.");
    void carregar();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <FlaskConical className="size-4" /> Ambiente de teste
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Aqui você experimenta o sistema inteiro com registros fictícios, marcados como teste e escondidos das telas
          normais. Nos registros criados aqui você também é o servidor avaliado, então consegue percorrer todas as
          etapas sozinho: ciência, pedido de reconsideração, revisão, recurso e homologação.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button size="sm" onClick={() => criar("FAPEP1")} disabled={ocupado}>
            <Plus className="size-4" /> Criar FAPEP 1 de teste
          </Button>
          <Button size="sm" variant="outline" onClick={() => criar("FAPEP2")} disabled={ocupado}>
            <Plus className="size-4" /> Criar FAPEP 2 de teste
          </Button>
          {registros.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="ml-auto"
              disabled={ocupado}
              onClick={() => apagar(registros.map((r) => r.id))}
            >
              <Trash2 className="size-4" /> Limpar tudo
            </Button>
          )}
        </div>
      </div>

      <Bloco titulo="Registros de teste">
        {carregando ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </p>
        ) : registros.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum registro de teste. Crie um acima para começar.
          </p>
        ) : (
          <ul className="space-y-3">
            {registros.map((r) => {
              const aguardando = r.status === "aguardando_servidor" || r.status === "aguardando_servidor_revisao";
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-56 flex-1">
                    <p className="text-sm font-semibold">
                      {TIPOS[r.tipo]?.sigla ?? r.tipo} · {r.servidor_nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROTULO_STATUS[r.status] ?? r.status}
                      {aguardando ? ` · prazo até ${formatarPrazo(r.prazo_resposta)}` : ""}
                      {r.resposta_servidor === "concorda_tacito" ? " · concordância tácita" : ""}
                    </p>
                  </div>
                  {aguardando && (
                    <Button size="sm" variant="outline" disabled={ocupado} onClick={() => encerrarPrazo(r.id)}>
                      <TimerOff className="size-4" /> Encerrar prazo agora
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" disabled={ocupado} onClick={() => apagar([r.id])}>
                    <Trash2 className="size-4" /> Apagar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Roteiro de verificação">
        <ol className="space-y-3">
          {ROTEIRO_TESTE.map((passo) => (
            <li key={passo.titulo}>
              <p className="text-sm font-semibold">{passo.titulo}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </Bloco>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";
import { baixarPdfPaginaUnica } from "@/lib/pdf";
import { TIPOS } from "@/lib/formularios";
import { AssinaturaEletronica } from "@/components/AssinaturaEletronica";
import { useAssinaturas } from "@/hooks/useAssinaturas";
import { AlternarTestes } from "@/components/AlternarTestes";
import { COLUNAS_FORMULARIO, ROTULO_STATUS, type RegistroFormulario } from "@/lib/fluxo";

export function Consulta() {
  const [registros, setRegistros] = useState<RegistroFormulario[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [incluirTestes, setIncluirTestes] = useState(false);
  const [selecionado, setSelecionado] = useState<RegistroFormulario | null>(null);
  const referencia = useRef<HTMLDivElement>(null);
  const { assinaturas } = useAssinaturas(selecionado?.id);

  const carregar = async () => {
    setCarregando(true);
    let consulta = supabase
      .from("formularios")
      .select(COLUNAS_FORMULARIO)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!incluirTestes) consulta = consulta.eq("teste", false);
    if (busca.trim()) {
      consulta = consulta.or(`servidor_nome.ilike.%${busca.trim()}%,servidor_matricula.ilike.%${busca.trim()}%`);
    }
    const { data, error } = await consulta;
    setCarregando(false);
    if (error) {
      toast.error("Erro ao consultar: " + error.message);
      return;
    }
    setRegistros((data ?? []) as unknown as RegistroFormulario[]);
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incluirTestes]);

  const baixar = async (registro: RegistroFormulario) => {
    setSelecionado(registro);
    toast.info("Gerando PDF…");
    await new Promise((resolver) => setTimeout(resolver, 400));
    if (referencia.current) {
      await baixarPdfPaginaUnica(
        referencia.current,
        `${registro.tipo}-${registro.servidor_nome.replace(/\s+/g, "_")}.pdf`,
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && carregar()}
            placeholder="Buscar por nome ou matrícula do servidor avaliado"
            className="pl-9"
          />
        </div>
        <Button onClick={carregar} variant="outline">
          Buscar
        </Button>
        <AlternarTestes valor={incluirTestes} aoMudar={setIncluirTestes} />
      </div>

      {carregando ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando registros…
        </p>
      ) : registros.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum formulário salvo encontrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {registros.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-panel"
            >
              <FileText className="size-5 text-primary" />
              <div className="min-w-56 flex-1">
                <p className="text-sm font-semibold">{r.servidor_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {TIPOS[r.tipo]?.sigla ?? r.tipo} · matrícula {r.servidor_matricula ?? "—"} ·{" "}
                  {r.numero_avaliacao ? `${r.numero_avaliacao}ª avaliação · ` : ""}
                  {r.pontuacao != null ? `${r.pontuacao} pontos · ` : ""}
                  salvo em {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs font-medium text-primary">{ROTULO_STATUS[r.status] ?? r.status}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelecionado(r)}>
                Visualizar
              </Button>
              <Button size="sm" onClick={() => baixar(r)}>
                <Download className="size-4" /> PDF
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selecionado && (
        <div className="space-y-4">
          <AssinaturaEletronica
            formularioId={selecionado.id}
            tipoAssinatura="gestao_pessoas"
            assinaturas={assinaturas}
            somenteLeitura
          />
          <div className="overflow-auto rounded-lg border border-border bg-muted p-4">
          <div className="mx-auto w-fit shadow-panel">
            <DocumentoFormulario
              ref={referencia}
              tipo={selecionado.tipo}
              dados={selecionado.dados}
              revisao={selecionado.dados_revisao ?? undefined}
              homologacao={selecionado.homologacao ?? undefined}
              registro={{ id: selecionado.id, created_at: selecionado.created_at }}
              assinaturas={assinaturas}
              teste={selecionado.teste}
            />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

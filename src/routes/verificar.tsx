import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Search, ShieldCheck, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROTULO_ASSINATURA, formatarDataHora } from "@/lib/assinaturas";
import { ROTULO_STATUS } from "@/lib/fluxo";
import { TIPOS } from "@/lib/formularios";

export const Route = createFileRoute("/verificar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conferência de documento — Estágio Probatório" },
      {
        name: "description",
        content:
          "Confira a autenticidade dos formulários de avaliação de estágio probatório informando o código de verificação impresso no rodapé do PDF.",
      },
      { property: "og:title", content: "Conferência de documento — Estágio Probatório" },
      {
        property: "og:description",
        content: "Informe o código do rodapé do PDF e veja as assinaturas eletrônicas registradas no documento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

type Resultado = {
  encontrado: boolean;
  codigo?: string;
  tipo?: keyof typeof TIPOS;
  orgao?: string | null;
  servidor_nome?: string | null;
  numero_avaliacao?: number | null;
  status?: string;
  registrado_em?: string;
  assinaturas?: { nome: string; perfil: string | null; tipo_assinatura: string; assinado_em: string }[];
};

function Pagina() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [buscando, setBuscando] = useState(false);

  const conferir = async () => {
    if (!codigo.trim()) return;
    setBuscando(true);
    const { data, error } = await supabase.rpc("verificar_documento" as never, { _codigo: codigo.trim() } as never);
    setBuscando(false);
    if (error) {
      setResultado({ encontrado: false });
      return;
    }
    setResultado(data as unknown as Resultado);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <ShieldCheck className="size-5" />
          <div className="mr-auto">
            <h1 className="font-display text-base leading-tight">Conferência de documento</h1>
            <p className="text-xs opacity-80">Avaliação de Estágio Probatório — Decreto nº 36.773/2025</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">Entrar no sistema</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-sm text-muted-foreground">
          Digite o código de verificação que aparece no rodapé do formulário em PDF (exemplo: 8F3A-21C4-90BE) para
          conferir se o documento é autêntico e quem o assinou eletronicamente.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && conferir()}
              placeholder="Código de verificação"
              className="pl-9 uppercase"
            />
          </div>
          <Button onClick={conferir} disabled={buscando}>
            {buscando ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Conferir
          </Button>
        </div>

        {resultado && !resultado.encontrado && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <ShieldX className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Documento não localizado</p>
              <p className="text-xs text-muted-foreground">
                Não há formulário registrado com esse código. Confira a digitação.
              </p>
            </div>
          </div>
        )}

        {resultado?.encontrado && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary" />
              <div>
                <p className="text-sm font-semibold">Documento autêntico</p>
                <p className="text-xs text-muted-foreground">Código {resultado.codigo}</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Formulário</dt>
                <dd>
                  {resultado.tipo ? (TIPOS[resultado.tipo]?.sigla ?? resultado.tipo) : "—"}
                  {resultado.numero_avaliacao ? ` — ${resultado.numero_avaliacao}ª avaliação parcial` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Servidor avaliado</dt>
                <dd>{resultado.servidor_nome || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Órgão/Entidade</dt>
                <dd>{resultado.orgao || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Situação</dt>
                <dd>{(resultado.status && ROTULO_STATUS[resultado.status]) || resultado.status || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Registrado em</dt>
                <dd>{resultado.registrado_em ? formatarDataHora(resultado.registrado_em) : "—"}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Assinaturas eletrônicas</p>
              {resultado.assinaturas && resultado.assinaturas.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {resultado.assinaturas.map((a, i) => (
                    <li key={i}>
                      <strong>{a.nome}</strong> — {ROTULO_ASSINATURA[a.tipo_assinatura] ?? a.tipo_assinatura} ·{" "}
                      {formatarDataHora(a.assinado_em)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  O documento ainda não possui assinaturas eletrônicas registradas.
                </p>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Por proteção de dados pessoais, o conteúdo avaliado não é exibido nesta página pública e o nome do
              servidor aparece abreviado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessao, ROTULO_PAPEL } from "@/hooks/useSessao";
import { TelaLogin } from "@/components/TelaLogin";
import { Consulta } from "@/components/Consulta";
import { FormFapep } from "@/components/forms/FormFapep";
import { FormFafep } from "@/components/forms/FormFafep";
import { FormFada } from "@/components/forms/FormFada";
import { PainelServidor } from "@/components/PainelServidor";
import { PainelRevisao } from "@/components/PainelRevisao";
import { PainelComissao } from "@/components/PainelComissao";
import { PainelCalendario } from "@/components/PainelCalendario";
import { PainelTeste } from "@/components/PainelTeste";
import { TIPOS, type TipoFormulario } from "@/lib/formularios";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Avaliação de Estágio Probatório — Decreto 36.773/2025" },
      {
        name: "description",
        content:
          "Sistema para preenchimento, tramitação e emissão em PDF dos formulários FAPEP 1, FAPEP 2, FAFEP, RAEP e FADA do estágio probatório.",
      },
      { property: "og:title", content: "Avaliação de Estágio Probatório — Decreto 36.773/2025" },
      {
        property: "og:description",
        content:
          "Formulários oficiais de avaliação de estágio probatório com fluxo de manifestação do servidor, revisão, recurso e homologação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { sessao, carregando, papeis, orgao, ehAdmin, ehServidor, ehComissao, ehGestaoPessoas, ehAvaliador } =
    useSessao();

  if (carregando) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!sessao) return <TelaLogin />;

  const abas: { valor: string; rotulo: string }[] = [];
  if (ehAvaliador || ehAdmin) {
    abas.push(
      { valor: "FAPEP1", rotulo: "FAPEP 1 — Chefia" },
      { valor: "FAPEP2", rotulo: "FAPEP 2 — Pares" },
      { valor: "FADA", rotulo: "FADA — Atividades" },
      { valor: "REVISAO", rotulo: "Revisões pendentes" },
    );
  }
  if (ehServidor || ehAdmin) abas.push({ valor: "MINHAS", rotulo: "Minhas avaliações" });
  if (ehComissao || ehAdmin) {
    abas.push(
      { valor: "HOMOLOGAR", rotulo: "Homologações" },
      { valor: "FAFEP", rotulo: "FAFEP — Final" },
    );
  }
  abas.push({ valor: "CONSULTA", rotulo: ehGestaoPessoas ? "Formulários (somente leitura)" : "Consultar salvos" });
  if (ehAdmin) abas.push({ valor: "CALENDARIO", rotulo: "Calendário de prazos" });
  if (ehAdmin) abas.push({ valor: "TESTE", rotulo: "Ambiente de teste" });

  const abaInicial = abas[0]?.valor ?? "CONSULTA";
  const formulariosProprios = (["FAPEP1", "FAPEP2", "FADA", "FAFEP"] as const).filter((t) =>
    abas.some((a) => a.valor === t),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-6 py-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <ShieldCheck className="size-5" />
          </span>
          <div className="mr-auto">
            <h1 className="font-display text-base leading-tight">Avaliação de Estágio Probatório</h1>
            <p className="text-xs opacity-80">Decreto nº 36.773, de 06 de agosto de 2025 — Estado do Ceará</p>
          </div>
          <div className="text-right text-xs opacity-90">
            <p>{sessao.user.email}</p>
            <p>{papeis.map((p) => ROTULO_PAPEL[p] ?? p).join(", ") || "Avaliador"}</p>
            {orgao && <p className="opacity-80">{orgao}</p>}
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/verificar">Conferir documento</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6">
        <Tabs defaultValue={abaInicial}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {abas.map((aba) => (
              <TabsTrigger key={aba.valor} value={aba.valor} className="text-xs sm:text-sm">
                {aba.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>

          {formulariosProprios.map((tipo: TipoFormulario) => (
            <TabsContent key={tipo} value={tipo} className="mt-5">
              <p className="mb-4 rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">{TIPOS[tipo].anexo}</strong> — {TIPOS[tipo].titulo}
              </p>
              {tipo === "FAPEP1" || tipo === "FAPEP2" ? (
                <FormFapep key={tipo} tipo={tipo} />
              ) : tipo === "FAFEP" ? (
                <FormFafep />
              ) : (
                <FormFada />
              )}
            </TabsContent>
          ))}

          {(ehAvaliador || ehAdmin) && (
            <TabsContent value="REVISAO" className="mt-5">
              <PainelRevisao userId={sessao.user.id} />
            </TabsContent>
          )}

          {(ehServidor || ehAdmin) && (
            <TabsContent value="MINHAS" className="mt-5">
              <PainelServidor userId={sessao.user.id} />
            </TabsContent>
          )}

          {(ehComissao || ehAdmin) && (
            <TabsContent value="HOMOLOGAR" className="mt-5">
              <PainelComissao />
            </TabsContent>
          )}

          <TabsContent value="CONSULTA" className="mt-5">
            {ehGestaoPessoas && !ehAdmin && (
              <p className="mb-4 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
                Perfil Gestão de Pessoas: os formulários FAPEP 1 e 2 são exibidos por completo, apenas para consulta e
                download, sem possibilidade de edição.
              </p>
            )}
            <Consulta />
          </TabsContent>

          {ehAdmin && (
            <TabsContent value="CALENDARIO" className="mt-5">
              <PainelCalendario userId={sessao.user.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

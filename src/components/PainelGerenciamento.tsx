import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { detalharOrgao, listarOrgaosPlanilha } from "@/lib/gerenciamento.functions";

export function PainelGerenciamento() {
  const listar = useServerFn(listarOrgaosPlanilha);
  const detalhar = useServerFn(detalharOrgao);
  const [orgao, setOrgao] = useState("");
  const [busca, setBusca] = useState("");

  const orgaos = useQuery({ queryKey: ["planilha-orgaos"], queryFn: () => listar(), staleTime: 300_000 });
  const detalhe = useQuery({
    queryKey: ["planilha-orgao", orgao],
    queryFn: () => detalhar({ data: { orgao } }),
    enabled: !!orgao,
    staleTime: 300_000,
  });

  const linhas = useMemo(() => {
    const todas = detalhe.data?.linhas ?? [];
    const t = busca.trim().toLowerCase();
    return t ? todas.filter((l) => l.some((c) => c?.toLowerCase().includes(t))) : todas;
  }, [detalhe.data, busca]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="w-full max-w-xs">
          <Label>Órgão</Label>
          <Select value={orgao} onValueChange={setOrgao}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={orgaos.isLoading ? "Carregando…" : "Selecione o órgão"} />
            </SelectTrigger>
            <SelectContent>
              {(orgaos.data ?? []).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {orgaos.error && <p className="text-sm text-destructive">Não foi possível ler a planilha.</p>}
      </div>

      {orgao && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-display text-lg text-foreground">Detalhamento — {orgao}</h2>
            {detalhe.data && (
              <span className="text-sm text-muted-foreground">{linhas.length} servidor(es)</span>
            )}
            <Input
              placeholder="Buscar por nome, matrícula ou cargo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-64"
            />
          </div>
          {detalhe.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando…
            </p>
          ) : detalhe.error ? (
            <p className="text-sm text-destructive">Não foi possível carregar os dados deste órgão.</p>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    {(detalhe.data?.colunas ?? []).map((c, i) => (
                      <th key={i} className="whitespace-nowrap px-2 py-2 text-left font-semibold text-foreground">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-t border-border">
                      {(detalhe.data?.colunas ?? []).map((_, j) => (
                        <td key={j} className="whitespace-nowrap px-2 py-1.5 text-foreground">{l[j] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

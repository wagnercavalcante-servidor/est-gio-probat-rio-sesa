import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { detalharOrgao, listarOrgaosPlanilha } from "@/lib/gerenciamento.functions";

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function PainelGerenciamento() {
  const listar = useServerFn(listarOrgaosPlanilha);
  const detalhar = useServerFn(detalharOrgao);
  const [orgao, setOrgao] = useState("");
  const [busca, setBusca] = useState("");
  const [dataExercicio, setDataExercicio] = useState("todas");

  const orgaos = useQuery({ queryKey: ["planilha-orgaos"], queryFn: () => listar(), staleTime: 300_000 });
  const detalhe = useQuery({
    queryKey: ["planilha-orgao", orgao],
    queryFn: () => detalhar({ data: { orgao } }),
    enabled: !!orgao,
    staleTime: 300_000,
  });

  const colunas = detalhe.data?.colunas ?? [];
  const todas = detalhe.data?.linhas ?? [];

  const idxAdmissao = useMemo(() => {
    const i = colunas.findIndex((c) => semAcento(c ?? "").includes("ADMISSAO"));
    return i >= 0 ? i : 3;
  }, [colunas]);

  const porData = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of todas) {
      const d = (l[idxAdmissao] ?? "").trim();
      if (!d) continue;
      mapa.set(d, (mapa.get(d) ?? 0) + 1);
    }
    const dataChave = (d: string) => {
      const [dd, mm, aa] = d.split("/");
      return aa && mm && dd ? `${aa}${mm}${dd}` : d;
    };
    return [...mapa.entries()].sort((a, b) => dataChave(a[0]).localeCompare(dataChave(b[0])));
  }, [todas, idxAdmissao]);

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return todas.filter((l) => {
      if (dataExercicio !== "todas" && (l[idxAdmissao] ?? "").trim() !== dataExercicio) return false;
      if (!t) return true;
      return l.some((c) => c?.toLowerCase().includes(t));
    });
  }, [todas, busca, dataExercicio, idxAdmissao]);

  function trocarOrgao(v: string) {
    setOrgao(v);
    setDataExercicio("todas");
    setBusca("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="w-full max-w-xs">
          <Label>Órgão</Label>
          <Select value={orgao} onValueChange={trocarOrgao}>
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
        {orgao && (
          <div className="w-full max-w-xs">
            <Label>Data do efetivo exercício</Label>
            <Select value={dataExercicio} onValueChange={setDataExercicio}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as datas</SelectItem>
                {porData.map(([d, qtd]) => (
                  <SelectItem key={d} value={d}>
                    {d} ({qtd})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {orgaos.error && <p className="text-sm text-destructive">Não foi possível ler a planilha.</p>}
      </div>

      {orgao && detalhe.data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                <Users className="size-5 text-secondary-foreground" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Servidores em estágio probatório</p>
                <p className="font-display text-2xl text-foreground">{todas.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground">Por data de efetivo exercício</p>
            <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
              {porData.map(([d, qtd]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDataExercicio(dataExercicio === d ? "todas" : d)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors ${
                    dataExercicio === d
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{d}</span>
                  <span className={dataExercicio === d ? "opacity-90" : "text-muted-foreground"}>{qtd}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {orgao && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-display text-lg text-foreground">
              Detalhamento — {orgao}
              {dataExercicio !== "todas" && <span className="text-sm text-muted-foreground"> · exercício em {dataExercicio}</span>}
            </h2>
            {detalhe.data && (
              <span className="text-sm text-muted-foreground">
                {linhas.length} servidor(es){dataExercicio !== "todas" || busca ? ` de ${todas.length}` : ""}
              </span>
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
                    {colunas.map((c, i) => (
                      <th key={i} className="whitespace-nowrap px-2 py-2 text-left font-semibold text-foreground">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-t border-border">
                      {colunas.map((_, j) => (
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

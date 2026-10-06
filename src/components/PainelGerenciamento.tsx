import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dadosGerenciamento } from "@/lib/gerenciamento.functions";

function chaveData(d: string) {
  const [dd, mm, aa] = d.split("/");
  return aa && mm && dd ? `${aa}${mm}${dd}` : d;
}

export function PainelGerenciamento() {
  const consultar = useServerFn(dadosGerenciamento);
  const [orgao, setOrgao] = useState("todos");
  const [dataExercicio, setDataExercicio] = useState("todas");
  const [busca, setBusca] = useState("");

  const dados = useQuery({ queryKey: ["planilha-gerenciamento"], queryFn: () => consultar(), staleTime: 300_000 });
  const todas = dados.data?.linhas ?? [];

  const orgaos = useMemo(
    () => [...new Set(todas.map((l) => l.orgao).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [todas],
  );

  const porData = useMemo(() => {
    const base = orgao === "todos" ? todas : todas.filter((l) => l.orgao === orgao);
    const mapa = new Map<string, number>();
    for (const l of base) {
      if (!l.dataExercicio) continue;
      mapa.set(l.dataExercicio, (mapa.get(l.dataExercicio) ?? 0) + 1);
    }
    return [...mapa.entries()].sort((a, b) => chaveData(a[0]).localeCompare(chaveData(b[0])));
  }, [todas, orgao]);

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return todas.filter((l) => {
      if (orgao !== "todos" && l.orgao !== orgao) return false;
      if (dataExercicio !== "todas" && l.dataExercicio !== dataExercicio) return false;
      if (!t) return true;
      return [l.nome, l.matricula, l.cargo].some((c) => c.toLowerCase().includes(t));
    });
  }, [todas, orgao, dataExercicio, busca]);

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
              <SelectValue placeholder="Todos os órgãos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os órgãos</SelectItem>
              {orgaos.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        {dados.error && <p className="text-sm text-destructive">Não foi possível ler a planilha.</p>}
      </div>

      {dados.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando dados da planilha…
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                  <Users className="size-5 text-secondary-foreground" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Servidores em estágio probatório</p>
                  <p className="font-display text-2xl text-foreground">
                    {orgao === "todos" ? todas.length : todas.filter((l) => l.orgao === orgao).length}
                  </p>
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

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-display text-lg text-foreground">
                Detalhamento{orgao !== "todos" ? ` — ${orgao}` : ""}
                {dataExercicio !== "todas" && (
                  <span className="text-sm text-muted-foreground"> · exercício em {dataExercicio}</span>
                )}
              </h2>
              <span className="text-sm text-muted-foreground">
                {linhas.length} servidor(es){orgao !== "todos" || dataExercicio !== "todas" || busca ? ` de ${todas.length}` : ""}
              </span>
              <Input
                placeholder="Buscar por nome, matrícula ou cargo"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="max-h-[70vh] overflow-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    {["Órgão", "Nome", "Matrícula", "Cargo", "Exercício", "1ª avaliação", "2ª", "3ª", "4ª", "5ª", "6ª"].map(
                      (c) => (
                        <th key={c} className="whitespace-nowrap px-2 py-2 text-left font-semibold text-foreground">
                          {c}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{l.orgao}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{l.nome}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{l.matricula}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{l.cargo}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{l.dataExercicio}</td>
                      {l.avaliacoes.map((a, j) => (
                        <td key={j} className="whitespace-nowrap px-2 py-1.5 text-foreground">{a}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

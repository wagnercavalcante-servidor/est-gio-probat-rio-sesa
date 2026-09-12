import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bloco } from "@/components/Campos";
import { ETAPAS, type Ciclo, type CicloEtapa, type Etapa } from "@/lib/calendario";

export function PainelCalendario({ userId }: { userId: string }) {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [etapas, setEtapas] = useState<Record<string, Partial<Record<Etapa, CicloEtapa>>>>({});
  const [orgaos, setOrgaos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [orgao, setOrgao] = useState("__todos");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [{ data: listaCiclos }, { data: listaEtapas }] = await Promise.all([
      supabase
        .from("ciclos_avaliacao")
        .select("id, nome, numero_avaliacao, orgao, ativo, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("ciclo_etapas").select("id, ciclo_id, etapa, data_inicio, data_fim"),
    ]);
    const mapa: Record<string, Partial<Record<Etapa, CicloEtapa>>> = {};
    for (const linha of (listaEtapas ?? []) as CicloEtapa[]) {
      mapa[linha.ciclo_id] = { ...(mapa[linha.ciclo_id] ?? {}), [linha.etapa]: linha };
    }
    setCiclos((listaCiclos ?? []) as Ciclo[]);
    setEtapas(mapa);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
    void supabase.rpc("listar_orgaos" as never).then(({ data }) => {
      setOrgaos(((data ?? []) as Array<{ orgao: string }>).map((o) => o.orgao).filter(Boolean));
    });
  }, [carregar]);

  const criarCiclo = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do ciclo.");
      return;
    }
    setSalvando("novo");
    const { error } = await supabase.from("ciclos_avaliacao").insert({
      nome: nome.trim(),
      numero_avaliacao: numero ? Number(numero) : null,
      orgao: orgao === "__todos" ? null : orgao,
      created_by: userId,
    });
    setSalvando(null);
    if (error) {
      toast.error("Não foi possível criar o ciclo: " + error.message);
      return;
    }
    setNome("");
    setNumero("");
    setOrgao("__todos");
    toast.success("Ciclo criado. Agora defina as datas de cada etapa.");
    void carregar();
  };

  const salvarEtapa = async (cicloId: string, etapa: Etapa, campo: "data_inicio" | "data_fim", valor: string) => {
    const atual = etapas[cicloId]?.[etapa];
    const registro = {
      ciclo_id: cicloId,
      etapa,
      data_inicio: campo === "data_inicio" ? valor || null : (atual?.data_inicio ?? null),
      data_fim: campo === "data_fim" ? valor || null : (atual?.data_fim ?? null),
    };
    setEtapas((a) => ({
      ...a,
      [cicloId]: { ...(a[cicloId] ?? {}), [etapa]: { ...(atual ?? { id: "", ciclo_id: cicloId, etapa }), ...registro } },
    }));
    const { error } = await supabase.from("ciclo_etapas").upsert(registro, { onConflict: "ciclo_id,etapa" });
    if (error) toast.error("Não foi possível salvar a data: " + error.message);
  };

  const alternarAtivo = async (ciclo: Ciclo) => {
    const { error } = await supabase.from("ciclos_avaliacao").update({ ativo: !ciclo.ativo }).eq("id", ciclo.id);
    if (error) toast.error("Não foi possível alterar o ciclo: " + error.message);
    else void carregar();
  };

  const excluir = async (ciclo: Ciclo) => {
    if (!window.confirm(`Excluir o ciclo "${ciclo.nome}" e todas as suas datas?`)) return;
    const { error } = await supabase.from("ciclos_avaliacao").delete().eq("id", ciclo.id);
    if (error) toast.error("Não foi possível excluir: " + error.message);
    else void carregar();
  };

  return (
    <div className="space-y-6">
      <Bloco titulo="Novo ciclo de avaliação">
        <form onSubmit={criarCiclo} className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="1ª Avaliação — 2026" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avaliação nº</Label>
            <Input
              type="number"
              min={1}
              max={6}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="1 a 6"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Órgão ou entidade
            </Label>
            <Select value={orgao} onValueChange={setOrgao}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos">Todos os órgãos</SelectItem>
                {orgaos.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={salvando === "novo"}>
            {salvando === "novo" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar ciclo
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Somente administradores criam e alteram estes prazos. Etapas sem data preenchida não restringem o sistema.
        </p>
      </Bloco>

      {carregando && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!carregando && ciclos.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum ciclo cadastrado. Enquanto não houver ciclo ativo, o prazo de manifestação do servidor continua sendo
          de 3 dias úteis.
        </p>
      )}

      {ciclos.map((ciclo) => (
        <Bloco
          key={ciclo.id}
          titulo={`${ciclo.nome}${ciclo.numero_avaliacao ? ` — Avaliação ${ciclo.numero_avaliacao}` : ""}`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{ciclo.orgao ?? "Todos os órgãos"}</span>
            <span
              className={
                ciclo.ativo
                  ? "rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary"
                  : "rounded-full bg-muted px-2 py-0.5 font-semibold"
              }
            >
              {ciclo.ativo ? "Ativo" : "Encerrado"}
            </span>
            <Button variant="outline" size="sm" onClick={() => void alternarAtivo(ciclo)}>
              {ciclo.ativo ? "Encerrar ciclo" : "Reativar ciclo"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void excluir(ciclo)}>
              <Trash2 className="size-4" /> Excluir
            </Button>
          </div>

          <div className="space-y-2">
            {ETAPAS.map((e) => {
              const linha = etapas[ciclo.id]?.[e.valor];
              return (
                <div
                  key={e.valor}
                  className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[minmax(0,1fr)_160px_160px] sm:items-center"
                >
                  <p className="text-sm">{e.rotulo}</p>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Início</Label>
                    <Input
                      type="date"
                      value={linha?.data_inicio ?? ""}
                      onChange={(ev) => void salvarEtapa(ciclo.id, e.valor, "data_inicio", ev.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Fim</Label>
                    <Input
                      type="date"
                      value={linha?.data_fim ?? ""}
                      onChange={(ev) => void salvarEtapa(ciclo.id, e.valor, "data_fim", ev.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Bloco>
      ))}
    </div>
  );
}

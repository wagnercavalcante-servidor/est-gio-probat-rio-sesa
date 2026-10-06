import { useCallback, useEffect, useState } from "react";
import { Loader2, Stamp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bloco, CampoArea, CampoTexto } from "@/components/Campos";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";
import { TIPOS } from "@/lib/formularios";
import { AssinaturaEletronica } from "@/components/AssinaturaEletronica";
import { useAssinaturas } from "@/hooks/useAssinaturas";
import { AlternarTestes } from "@/components/AlternarTestes";
import { COLUNAS_FORMULARIO, ROTULO_STATUS, validarAcao, type RegistroFormulario } from "@/lib/fluxo";

const homologacaoInicial = {
  discorda: "nao",
  fundamentacao: "",
  nota: "",
  percentual: "",
  portaria: "",
  portariaData: "",
  local: "",
  data: "",
  presidente: "",
  presidenteCargo: "",
  membro1: "",
  membro1Cargo: "",
  membro2: "",
  membro2Cargo: "",
};

export function PainelComissao() {
  const [registros, setRegistros] = useState<RegistroFormulario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ativo, setAtivo] = useState<RegistroFormulario | null>(null);
  const [h, setH] = useState({ ...homologacaoInicial });
  const [recurso, setRecurso] = useState<RegistroFormulario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [incluirTestes, setIncluirTestes] = useState(false);
  const { assinaturas, recarregar } = useAssinaturas(ativo?.id);

  const carregar = useCallback(async () => {
    setCarregando(true);
    await supabase.rpc("expirar_prazos_avaliacao" as never);
    let consulta = supabase
      .from("formularios")
      .select(COLUNAS_FORMULARIO)
      .in("status", ["aguardando_homologacao", "recurso_apresentado"])
      .order("created_at", { ascending: false });
    if (!incluirTestes) consulta = consulta.eq("teste", false);
    const { data, error } = await consulta;
    setCarregando(false);
    if (error) {
      toast.error("Erro ao carregar homologações: " + error.message);
      return;
    }
    setRegistros((data ?? []) as unknown as RegistroFormulario[]);
  }, [incluirTestes]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const abrir = async (r: RegistroFormulario) => {
    setAtivo(r);
    const efetivo = r.dados_revisao ?? r.dados;
    setH({
      ...homologacaoInicial,
      nota: String(r.pontuacao ?? ""),
      local: efetivo?.avaliador?.local ?? "",
    });
    setRecurso(null);
    if (r.raep_formulario_id) {
      const { data } = await supabase
        .from("formularios")
        .select(COLUNAS_FORMULARIO)
        .eq("id", r.raep_formulario_id)
        .maybeSingle();
      if (data) setRecurso(data as unknown as RegistroFormulario);
    }
  };

  const atualizar = (campo: keyof typeof homologacaoInicial, valor: string) =>
    setH((a) => ({ ...a, [campo]: valor }));

  const homologar = async () => {
    if (!ativo) return;
    const v = validarAcao(ativo, "homologar");
    if (!v.ok) {
      toast.error(v.erro);
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("formularios")
      .update({
        homologacao: h,
        homologado_em: new Date().toISOString(),
        homologado_por: (await supabase.auth.getUser()).data.user?.id ?? null,
        status: v.proximo,
      })
      .eq("id", ativo.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível homologar: " + error.message);
      return;
    }
    toast.success("Avaliação homologada pela Comissão Setorial.");
    setAtivo(null);
    void carregar();
  };

  if (ativo) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <p className="mr-auto text-sm">
              Homologação da avaliação de <strong>{ativo.servidor_nome}</strong>.
            </p>
            <Button variant="outline" size="sm" onClick={() => setAtivo(null)}>
              Voltar
            </Button>
            <Button size="sm" onClick={homologar} disabled={salvando}>
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Stamp className="size-4" />} Homologar
            </Button>
          </div>

          {recurso && (
            <Bloco titulo="Recurso apresentado pelo servidor (RAEP)">
              <p className="whitespace-pre-wrap text-justify text-xs text-muted-foreground">
                {recurso.dados?.razoes || "—"}
              </p>
            </Bloco>
          )}

          <Bloco titulo="Comissão Setorial de Avaliação Especial">
            <div className="grid gap-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  A Comissão discorda de alguma nota parcial?
                </Label>
                <div className="mt-2 flex gap-4 text-sm">
                  {["nao", "sim"].map((opcao) => (
                    <label key={opcao} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="discorda"
                        checked={h.discorda === opcao}
                        onChange={() => atualizar("discorda", opcao)}
                      />
                      {opcao === "nao" ? "Não" : "Sim"}
                    </label>
                  ))}
                </div>
              </div>
              <CampoArea
                rotulo="Fundamentação e novas notas (§ 2º do art. 25)"
                valor={h.fundamentacao}
                aoMudar={(v) => atualizar("fundamentacao", v)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoTexto rotulo="Nota atribuída pela Comissão (pontos)" valor={h.nota} aoMudar={(v) => atualizar("nota", v)} />
                <CampoTexto rotulo="Percentual (%)" valor={h.percentual} aoMudar={(v) => atualizar("percentual", v)} />
                <CampoTexto rotulo="Portaria nº" valor={h.portaria} aoMudar={(v) => atualizar("portaria", v)} />
                <CampoTexto rotulo="Data da portaria" valor={h.portariaData} aoMudar={(v) => atualizar("portariaData", v)} />
                <CampoTexto rotulo="Local" valor={h.local} aoMudar={(v) => atualizar("local", v)} />
                <CampoTexto rotulo="Data" valor={h.data} aoMudar={(v) => atualizar("data", v)} />
                <CampoTexto rotulo="Presidente da Comissão" valor={h.presidente} aoMudar={(v) => atualizar("presidente", v)} />
                <CampoTexto rotulo="Cargo/função do presidente" valor={h.presidenteCargo} aoMudar={(v) => atualizar("presidenteCargo", v)} />
                <CampoTexto rotulo="Membro 1" valor={h.membro1} aoMudar={(v) => atualizar("membro1", v)} />
                <CampoTexto rotulo="Cargo/função do membro 1" valor={h.membro1Cargo} aoMudar={(v) => atualizar("membro1Cargo", v)} />
                <CampoTexto rotulo="Membro 2" valor={h.membro2} aoMudar={(v) => atualizar("membro2", v)} />
                <CampoTexto rotulo="Cargo/função do membro 2" valor={h.membro2Cargo} aoMudar={(v) => atualizar("membro2Cargo", v)} />
              </div>
            </div>
          </Bloco>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <AssinaturaEletronica
            formularioId={ativo.id}
            tipoAssinatura="comissao"
            assinaturas={assinaturas}
            aoAssinar={recarregar}
          />
          <div className="overflow-auto rounded-lg border border-border bg-muted p-4">
            <div className="mx-auto w-fit shadow-panel">
              <DocumentoFormulario
                tipo={ativo.tipo}
                dados={ativo.dados}
                revisao={ativo.dados_revisao ?? undefined}
                homologacao={h}
                registro={{ id: ativo.id, created_at: ativo.created_at }}
                assinaturas={assinaturas}
                teste={ativo.teste}
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
          Nenhuma avaliação aguardando homologação.
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
                  {r.numero_avaliacao ? ` · ${r.numero_avaliacao}ª avaliação` : ""} · {ROTULO_STATUS[r.status]}
                  {r.resposta_servidor === "concorda_tacito" ? " · concordância tácita (prazo vencido)" : ""}
                </p>
              </div>
              <Button size="sm" onClick={() => abrir(r)}>
                {r.status === "recurso_apresentado" ? "Analisar recurso" : "Homologar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

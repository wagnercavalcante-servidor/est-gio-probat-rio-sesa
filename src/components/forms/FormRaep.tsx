import { useState } from "react";
import { toast } from "sonner";
import { Bloco, CampoArea, CampoTexto } from "@/components/Campos";
import { ServidorSelect, type Servidor } from "@/components/ServidorSelect";
import { AcoesFormulario } from "@/components/AcoesFormulario";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { validarAcao } from "@/lib/fluxo";

const estadoInicial = {
  comissaoDestino: "Setorial",
  nome: "",
  matricula: "",
  cargo: "",
  lotacao: "",
  orgao: "",
  avaliacaoObjeto: "",
  razoes: "",
  local: "",
  data: "",
};

export type VinculoRecurso = {
  formularioId: string;
  nome: string;
  matricula: string;
  orgao: string;
  descricao: string;
};

export function FormRaep({ vinculo, aoConcluir }: { vinculo?: VinculoRecurso; aoConcluir?: () => void }) {
  const [d, setD] = useState({
    ...estadoInicial,
    ...(vinculo
      ? {
          nome: vinculo.nome,
          matricula: vinculo.matricula,
          orgao: vinculo.orgao,
          avaliacaoObjeto: vinculo.descricao,
        }
      : {}),
  });
  const atualizar = (campo: keyof typeof estadoInicial, valor: string) =>
    setD((a) => ({ ...a, [campo]: valor }));

  const selecionarServidor = (s: Servidor) =>
    setD((a) => ({ ...a, nome: s.nome, matricula: s.matricula, cargo: s.cargo ?? "", orgao: s.orgao }));

  const vincularAoFormulario = async (idRecurso: string) => {
    if (!vinculo) return;
    const { data: atual } = await supabase
      .from("formularios")
      .select("status, prazo_resposta, resposta_em")
      .eq("id", vinculo.formularioId)
      .single();
    const v = atual ? validarAcao(atual as Parameters<typeof validarAcao>[0], "protocolar_recurso") : null;
    if (!v || !v.ok) {
      toast.error(v && !v.ok ? v.erro : "Avaliação vinculada não encontrada.");
      return;
    }
    const { error } = await supabase
      .from("formularios")
      .update({ status: v.proximo, raep_formulario_id: idRecurso })
      .eq("id", vinculo.formularioId);
    if (error) {
      toast.error("Recurso salvo, mas não foi possível vinculá-lo à avaliação: " + error.message);
      return;
    }
    toast.success("Recurso enviado à Comissão Setorial.");
    aoConcluir?.();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Bloco titulo="Identificação do servidor recorrente">
          {!vinculo && <ServidorSelect aoSelecionar={selecionarServidor} />}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CampoTexto rotulo="Nome completo" valor={d.nome} aoMudar={(v) => atualizar("nome", v)} />
            <CampoTexto rotulo="Matrícula" valor={d.matricula} aoMudar={(v) => atualizar("matricula", v)} />
            <CampoTexto rotulo="Cargo efetivo" valor={d.cargo} aoMudar={(v) => atualizar("cargo", v)} />
            <CampoTexto rotulo="Lotação" valor={d.lotacao} aoMudar={(v) => atualizar("lotacao", v)} />
            <CampoTexto rotulo="Órgão/Entidade" valor={d.orgao} aoMudar={(v) => atualizar("orgao", v)} />
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comissão destinatária
              </Label>
              <div className="mt-2 flex gap-4 text-sm">
                {["Setorial", "Central"].map((opcao) => (
                  <label key={opcao} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="comissaoDestino"
                      checked={d.comissaoDestino === opcao}
                      onChange={() => atualizar("comissaoDestino", opcao)}
                    />
                    {opcao}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Bloco>

        <Bloco titulo="Recurso">
          <div className="grid gap-3">
            <CampoTexto
              rotulo="Avaliação objeto do recurso"
              valor={d.avaliacaoObjeto}
              aoMudar={(v) => atualizar("avaliacaoObjeto", v)}
              placeholder="Ex.: 2ª avaliação parcial — período 01/2026 a 06/2026"
            />
            <CampoArea
              rotulo="Razões do recurso (argumentos e provas)"
              valor={d.razoes}
              aoMudar={(v) => atualizar("razoes", v)}
              linhas={12}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoTexto rotulo="Local" valor={d.local} aoMudar={(v) => atualizar("local", v)} />
              <CampoTexto rotulo="Data" valor={d.data} aoMudar={(v) => atualizar("data", v)} placeholder="dd/mm/aaaa" />
            </div>
          </div>
        </Bloco>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <AcoesFormulario
          tipo="RAEP"
          dados={d}
          servidorNome={d.nome}
          servidorMatricula={d.matricula}
          orgao={d.orgao}
          {...(vinculo ? { aoSalvar: vincularAoFormulario } : {})}
          {...(vinculo
            ? { mensagemPosSalvar: "Recurso registrado e encaminhado à Comissão Setorial." }
            : {})}
        />
      </div>
    </div>
  );
}

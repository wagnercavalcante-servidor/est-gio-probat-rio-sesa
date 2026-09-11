import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bloco, CampoTexto } from "@/components/Campos";
import { ServidorSelect, type Servidor } from "@/components/ServidorSelect";
import { AcoesFormulario } from "@/components/AcoesFormulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Atividade = {
  regime: string;
  descricao: string;
  meta: string;
  dataInicio: string;
  dataFim: string;
  situacao: string;
  resultados: string;
  feedback: string;
  observacao: string;
};

const atividadeVazia: Atividade = {
  regime: "Presencial",
  descricao: "",
  meta: "",
  dataInicio: "",
  dataFim: "",
  situacao: "Em andamento",
  resultados: "",
  feedback: "",
  observacao: "",
};

export function FormFada() {
  const [identificacao, setIdentificacao] = useState({
    nome: "",
    matricula: "",
    cargo: "",
    unidade: "",
    orgao: "",
    chefia: "",
    chefiaCargo: "",
  });
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [atividades, setAtividades] = useState<Atividade[]>([{ ...atividadeVazia }]);

  const atualizarId = (campo: keyof typeof identificacao, valor: string) =>
    setIdentificacao((a) => ({ ...a, [campo]: valor }));

  const atualizarAtividade = (indice: number, campo: keyof Atividade, valor: string) =>
    setAtividades((lista) => lista.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));

  const dados = { identificacao, local, data, atividades };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Bloco titulo="Identificação servidor / chefia imediata">
          <ServidorSelect
            aoSelecionar={(s: Servidor) =>
              setIdentificacao((a) => ({ ...a, nome: s.nome, matricula: s.matricula, cargo: s.cargo ?? "", orgao: s.orgao }))
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CampoTexto rotulo="Nome do servidor" valor={identificacao.nome} aoMudar={(v) => atualizarId("nome", v)} />
            <CampoTexto rotulo="Matrícula" valor={identificacao.matricula} aoMudar={(v) => atualizarId("matricula", v)} />
            <CampoTexto rotulo="Cargo" valor={identificacao.cargo} aoMudar={(v) => atualizarId("cargo", v)} />
            <CampoTexto rotulo="Unidade de exercício" valor={identificacao.unidade} aoMudar={(v) => atualizarId("unidade", v)} />
            <CampoTexto rotulo="Órgão/Entidade" valor={identificacao.orgao} aoMudar={(v) => atualizarId("orgao", v)} />
            <CampoTexto rotulo="Chefia imediata" valor={identificacao.chefia} aoMudar={(v) => atualizarId("chefia", v)} />
            <CampoTexto rotulo="Cargo da chefia" valor={identificacao.chefiaCargo} aoMudar={(v) => atualizarId("chefiaCargo", v)} />
            <CampoTexto rotulo="Local" valor={local} aoMudar={setLocal} />
            <CampoTexto rotulo="Data" valor={data} aoMudar={setData} placeholder="dd/mm/aaaa" />
          </div>
        </Bloco>

        <Bloco titulo="Atividades pactuadas e realizadas">
          <div className="space-y-4">
            {atividades.map((a, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Atividade {i + 1}</span>
                  {atividades.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAtividades((lista) => lista.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Regime de trabalho</Label>
                    <select
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={a.regime}
                      onChange={(e) => atualizarAtividade(i, "regime", e.target.value)}
                    >
                      {["Presencial", "Teletrabalho", "Híbrido"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Situação</Label>
                    <select
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={a.situacao}
                      onChange={(e) => atualizarAtividade(i, "situacao", e.target.value)}
                    >
                      {["Em andamento", "Concluída", "Não iniciada", "Suspensa"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <CampoTexto rotulo="Início" valor={a.dataInicio} aoMudar={(v) => atualizarAtividade(i, "dataInicio", v)} placeholder="dd/mm/aaaa" />
                  <CampoTexto rotulo="Fim" valor={a.dataFim} aoMudar={(v) => atualizarAtividade(i, "dataFim", v)} placeholder="dd/mm/aaaa" />
                </div>
                <div className="mt-3 grid gap-3">
                  {(
                    [
                      ["descricao", "Descrição da atividade"],
                      ["meta", "Meta pactuada"],
                      ["resultados", "Metas/resultados atingidos"],
                      ["feedback", "Acompanhamento / feedback da chefia"],
                      ["observacao", "Observação"],
                    ] as [keyof Atividade, string][]
                  ).map(([campo, rotulo]) => (
                    <div key={campo}>
                      <Label className="text-xs uppercase text-muted-foreground">{rotulo}</Label>
                      <Textarea
                        rows={2}
                        className="mt-1"
                        value={a[campo]}
                        onChange={(e) => atualizarAtividade(i, campo, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setAtividades((l) => [...l, { ...atividadeVazia }])}>
              <Plus className="size-4" /> Adicionar atividade
            </Button>
          </div>
        </Bloco>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <AcoesFormulario
          tipo="FADA"
          dados={dados}
          servidorNome={identificacao.nome}
          servidorMatricula={identificacao.matricula}
          orgao={identificacao.orgao}
        />
      </div>
    </div>
  );
}

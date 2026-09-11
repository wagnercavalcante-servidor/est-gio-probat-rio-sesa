import { useMemo, useState } from "react";
import { Bloco, CampoArea, CampoTexto } from "@/components/Campos";
import { ServidorSelect, type Servidor } from "@/components/ServidorSelect";
import { AcoesFormulario } from "@/components/AcoesFormulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUISITOS, PONTUACAO_MAXIMA, formatarData, somaNotas } from "@/lib/formularios";

const estadoInicial = {
  identificacao: { matricula: "", nome: "", ato: "", dataInicio: "", cargo: "", orgao: "", setor: "" },
  numeroAvaliacao: "",
  periodoInicio: "",
  periodoFim: "",
  parNumero: "",
  notas: {} as Record<string, string>,
  justificativas: {} as Record<string, string>,
  observacoes: "",
  sugestoes: "",
  avaliador: { nome: "", cargo: "", local: "", data: "" },
  comissao: {
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
  },
};

export function FormFapep({ tipo }: { tipo: "FAPEP1" | "FAPEP2" }) {
  const [d, setD] = useState(structuredClone(estadoInicial));

  const atualizar = (caminho: string, valor: string) => {
    setD((anterior) => {
      const copia = structuredClone(anterior) as Record<string, any>;
      const partes = caminho.split(".");
      let alvo = copia;
      for (const parte of partes.slice(0, -1)) alvo = alvo[parte];
      alvo[partes[partes.length - 1]!] = valor;
      return copia as typeof anterior;
    });
  };

  const selecionarServidor = (s: Servidor) => {
    setD((a) => ({
      ...a,
      identificacao: {
        ...a.identificacao,
        nome: s.nome,
        matricula: s.matricula,
        cargo: s.cargo ?? "",
        orgao: s.orgao,
        dataInicio: formatarData(s.data_inicio_exercicio),
      },
    }));
  };

  const total = useMemo(() => somaNotas(d.notas), [d.notas]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Bloco titulo="Identificação do servidor avaliado">
          <ServidorSelect aoSelecionar={selecionarServidor} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CampoTexto rotulo="Nome" valor={d.identificacao.nome} aoMudar={(v) => atualizar("identificacao.nome", v)} />
            <CampoTexto
              rotulo="Matrícula"
              valor={d.identificacao.matricula}
              aoMudar={(v) => atualizar("identificacao.matricula", v)}
            />
            <CampoTexto rotulo="Ato de nomeação" valor={d.identificacao.ato} aoMudar={(v) => atualizar("identificacao.ato", v)} />
            <CampoTexto
              rotulo="Data do início do exercício"
              valor={d.identificacao.dataInicio}
              aoMudar={(v) => atualizar("identificacao.dataInicio", v)}
              placeholder="dd/mm/aaaa"
            />
            <CampoTexto rotulo="Cargo" valor={d.identificacao.cargo} aoMudar={(v) => atualizar("identificacao.cargo", v)} />
            <CampoTexto rotulo="Órgão/Entidade" valor={d.identificacao.orgao} aoMudar={(v) => atualizar("identificacao.orgao", v)} />
            <CampoTexto rotulo="Setor" valor={d.identificacao.setor} aoMudar={(v) => atualizar("identificacao.setor", v)} className="sm:col-span-2" />
          </div>
        </Bloco>

        <Bloco titulo={tipo === "FAPEP1" ? "Dados da avaliação (chefe imediato)" : "Dados da avaliação (par)"}>
          <div className="grid gap-3 sm:grid-cols-3">
            <CampoTexto rotulo="Número da avaliação" valor={d.numeroAvaliacao} aoMudar={(v) => atualizar("numeroAvaliacao", v)} placeholder="1 a 6" />
            <CampoTexto rotulo="Período de" valor={d.periodoInicio} aoMudar={(v) => atualizar("periodoInicio", v)} placeholder="dd/mm/aaaa" />
            <CampoTexto rotulo="Período até" valor={d.periodoFim} aoMudar={(v) => atualizar("periodoFim", v)} placeholder="dd/mm/aaaa" />
            {tipo === "FAPEP2" && (
              <CampoTexto rotulo="Par nº" valor={d.parNumero} aoMudar={(v) => atualizar("parNumero", v)} placeholder="1, 2 ou 3" />
            )}
          </div>
        </Bloco>

        <Bloco titulo={`Requisitos e critérios — máximo ${PONTUACAO_MAXIMA} pontos`}>
          <div className="space-y-5">
            {REQUISITOS.map((req) => (
              <div key={req.id}>
                <p className="text-xs font-bold uppercase text-foreground">{req.titulo}</p>
                <p className="mb-2 text-justify text-xs text-muted-foreground">{req.descricao}</p>
                <div className="space-y-3">
                  {req.criterios.map((crit) => (
                    <div key={crit.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">
                          {crit.id} — {crit.nome}
                        </p>
                        <div className="w-20 shrink-0">
                          <Label className="text-[10px] uppercase text-muted-foreground">Nota 0-10</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={d.notas[crit.id] ?? ""}
                            onChange={(e) => atualizar(`notas.${crit.id}`, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Descrição
                          </Label>
                          <p className="mt-1 rounded-md bg-muted/50 p-2 text-justify text-xs text-muted-foreground">
                            {crit.descricao}
                          </p>
                        </div>
                        <CampoArea
                          rotulo="Considerações / justificativa / feedback"
                          linhas={4}
                          valor={d.justificativas[crit.id] ?? ""}
                          aoMudar={(v) => atualizar(`justificativas.${crit.id}`, v)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
            Resultado da avaliação parcial: {total} de {PONTUACAO_MAXIMA} pontos (
            {Math.round((total / PONTUACAO_MAXIMA) * 100)}%)
          </p>
        </Bloco>

        <Bloco titulo="Observações e assinatura do avaliador">
          <div className="grid gap-3">
            <CampoArea rotulo="Observações e informações complementares" valor={d.observacoes} aoMudar={(v) => atualizar("observacoes", v)} />
            <CampoArea rotulo="Sugestões para melhoria do desempenho" valor={d.sugestoes} aoMudar={(v) => atualizar("sugestoes", v)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoTexto
                rotulo={tipo === "FAPEP1" ? "Nome do chefe imediato" : "Nome do par avaliador"}
                valor={d.avaliador.nome}
                aoMudar={(v) => atualizar("avaliador.nome", v)}
              />
              <CampoTexto rotulo="Cargo/função" valor={d.avaliador.cargo} aoMudar={(v) => atualizar("avaliador.cargo", v)} />
              <CampoTexto rotulo="Local" valor={d.avaliador.local} aoMudar={(v) => atualizar("avaliador.local", v)} />
              <CampoTexto rotulo="Data" valor={d.avaliador.data} aoMudar={(v) => atualizar("avaliador.data", v)} placeholder="dd/mm/aaaa" />
            </div>
          </div>
        </Bloco>

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
                      checked={d.comissao.discorda === opcao}
                      onChange={() => atualizar("comissao.discorda", opcao)}
                    />
                    {opcao === "nao" ? "Não" : "Sim"}
                  </label>
                ))}
              </div>
            </div>
            <CampoArea
              rotulo="Fundamentação e novas notas (§ 2º do art. 25)"
              valor={d.comissao.fundamentacao}
              aoMudar={(v) => atualizar("comissao.fundamentacao", v)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoTexto rotulo="Nota atribuída pela Comissão (pontos)" valor={d.comissao.nota} aoMudar={(v) => atualizar("comissao.nota", v)} />
              <CampoTexto rotulo="Percentual (%)" valor={d.comissao.percentual} aoMudar={(v) => atualizar("comissao.percentual", v)} />
              <CampoTexto rotulo="Portaria nº" valor={d.comissao.portaria} aoMudar={(v) => atualizar("comissao.portaria", v)} />
              <CampoTexto rotulo="Data da portaria" valor={d.comissao.portariaData} aoMudar={(v) => atualizar("comissao.portariaData", v)} />
              <CampoTexto rotulo="Local" valor={d.comissao.local} aoMudar={(v) => atualizar("comissao.local", v)} />
              <CampoTexto rotulo="Data" valor={d.comissao.data} aoMudar={(v) => atualizar("comissao.data", v)} />
              <CampoTexto rotulo="Presidente da Comissão" valor={d.comissao.presidente} aoMudar={(v) => atualizar("comissao.presidente", v)} />
              <CampoTexto rotulo="Cargo/função do presidente" valor={d.comissao.presidenteCargo} aoMudar={(v) => atualizar("comissao.presidenteCargo", v)} />
              <CampoTexto rotulo="Membro 1" valor={d.comissao.membro1} aoMudar={(v) => atualizar("comissao.membro1", v)} />
              <CampoTexto rotulo="Cargo/função do membro 1" valor={d.comissao.membro1Cargo} aoMudar={(v) => atualizar("comissao.membro1Cargo", v)} />
              <CampoTexto rotulo="Membro 2" valor={d.comissao.membro2} aoMudar={(v) => atualizar("comissao.membro2", v)} />
              <CampoTexto rotulo="Cargo/função do membro 2" valor={d.comissao.membro2Cargo} aoMudar={(v) => atualizar("comissao.membro2Cargo", v)} />
            </div>
          </div>
        </Bloco>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <AcoesFormulario
          tipo={tipo}
          dados={d}
          servidorNome={d.identificacao.nome}
          servidorMatricula={d.identificacao.matricula}
          orgao={d.identificacao.orgao}
          numeroAvaliacao={d.numeroAvaliacao ? Number(d.numeroAvaliacao) : null}
          pontuacao={total}
        />
      </div>
    </div>
  );
}

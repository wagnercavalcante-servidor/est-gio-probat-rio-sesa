import { useMemo, useState } from "react";
import { Bloco, CampoArea, CampoTexto } from "@/components/Campos";
import { ServidorSelect, type Servidor } from "@/components/ServidorSelect";
import { AcoesFormulario } from "@/components/AcoesFormulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUISITOS, PONTUACAO_MAXIMA, formatarData, somaNotas } from "@/lib/formularios";
import { useEtapaVigente } from "@/hooks/useEtapaVigente";
import { dentroDaJanela, formatarDataBr } from "@/lib/calendario";

const estadoInicial = {
  identificacao: { matricula: "", nome: "", dataInicio: "", cargo: "", orgao: "", setor: "" },
  numeroAvaliacao: "",
  periodoInicio: "",
  periodoFim: "",
  parNumero: "",
  notas: {} as Record<string, string>,
  justificativas: {} as Record<string, string>,
  observacoes: "",
  sugestoes: "",
  avaliador: { nome: "", cargo: "", local: "", data: "" },
};

export function FormFapep({ tipo }: { tipo: "FAPEP1" | "FAPEP2" }) {
  const [d, setD] = useState(structuredClone(estadoInicial));

  const atualizar = (caminho: string, valor: string) => {
    setD((anterior) => {
      const copia = structuredClone(anterior) as Record<string, any>;
      const separador = caminho.indexOf(".");
      if (separador === -1) {
        copia[caminho] = valor;
        return copia as typeof anterior;
      }
      const grupo = caminho.slice(0, separador);
      const chave = caminho.slice(separador + 1);
      if (typeof copia[grupo] !== "object" || copia[grupo] === null) copia[grupo] = {};
      copia[grupo][chave] = valor;
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

  const { ciclo, etapa: janela } = useEtapaVigente(
    tipo === "FAPEP1" ? "avaliacao_chefia" : "avaliacao_pares",
    d.identificacao.orgao || null,
    d.numeroAvaliacao ? Number(d.numeroAvaliacao) : null,
  );
  const aberto = dentroDaJanela(janela);

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

        <p className="rounded-lg border border-dashed border-border p-4 text-xs leading-relaxed text-muted-foreground">
          O preenchimento vai até a assinatura do avaliador. Depois de salvar, o servidor avaliado é notificado e tem
          3 dias úteis para concordar ou pedir reconsideração. A parte da Comissão Setorial de Avaliação Especial é
          preenchida pela própria comissão, na etapa de homologação.
        </p>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start space-y-4">
        {ciclo && janela && (
          <p
            className={
              aberto
                ? "rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground"
                : "rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive"
            }
          >
            <strong>{ciclo.nome}</strong> — período desta avaliação: {formatarDataBr(janela.data_inicio)} a{" "}
            {formatarDataBr(janela.data_fim)}.{" "}
            {aberto ? "Prazo em aberto." : "Fora do prazo definido pela administração; o registro está bloqueado."}
          </p>
        )}
        {!aberto ? null : (
        <AcoesFormulario
          tipo={tipo}
          dados={d}
          servidorNome={d.identificacao.nome}
          servidorMatricula={d.identificacao.matricula}
          orgao={d.identificacao.orgao}
          numeroAvaliacao={d.numeroAvaliacao ? Number(d.numeroAvaliacao) : null}
          pontuacao={total}
          ocultarPrevia
          mensagemPosSalvar="Avaliação registrada. O servidor avaliado foi notificado e tem 3 dias úteis para se manifestar."
        />
        )}
      </div>
    </div>
  );
}

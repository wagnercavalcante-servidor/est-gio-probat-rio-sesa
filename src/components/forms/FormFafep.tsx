import { useState } from "react";
import { Bloco, CampoArea, CampoTexto } from "@/components/Campos";
import { ServidorSelect, type Servidor } from "@/components/ServidorSelect";
import { AcoesFormulario } from "@/components/AcoesFormulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LINHAS = [
  { rotulo: "Par nº 1", chave: "par1" },
  { rotulo: "Par nº 2", chave: "par2" },
  { rotulo: "Par nº 3", chave: "par3" },
  { rotulo: "Chefia imediata", chave: "chefia" },
  { rotulo: "Média das avaliações parciais", chave: "media" },
];

const estadoInicial = {
  identificacao: { nome: "", matricula: "", ato: "", cargo: "", orgao: "", setor: "" },
  notas: {} as Record<string, string>,
  comissao: {
    avaliacao: "",
    pontuacao: "",
    conclusao: "Aprovado",
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

export function FormFafep() {
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

  const selecionarServidor = (s: Servidor) =>
    setD((a) => ({
      ...a,
      identificacao: { ...a.identificacao, nome: s.nome, matricula: s.matricula, cargo: s.cargo ?? "", orgao: s.orgao },
    }));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Bloco titulo="Identificação do servidor avaliado">
          <ServidorSelect aoSelecionar={selecionarServidor} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CampoTexto rotulo="Nome" valor={d.identificacao.nome} aoMudar={(v) => atualizar("identificacao.nome", v)} />
            <CampoTexto rotulo="Matrícula" valor={d.identificacao.matricula} aoMudar={(v) => atualizar("identificacao.matricula", v)} />
            <CampoTexto rotulo="Ato de nomeação" valor={d.identificacao.ato} aoMudar={(v) => atualizar("identificacao.ato", v)} />
            <CampoTexto rotulo="Cargo" valor={d.identificacao.cargo} aoMudar={(v) => atualizar("identificacao.cargo", v)} />
            <CampoTexto rotulo="Órgão/Entidade" valor={d.identificacao.orgao} aoMudar={(v) => atualizar("identificacao.orgao", v)} />
            <CampoTexto rotulo="Setor" valor={d.identificacao.setor} aoMudar={(v) => atualizar("identificacao.setor", v)} />
          </div>
        </Bloco>

        <Bloco titulo="Notas das avaliações parciais">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground">
                  <th className="p-1 text-left">Avaliador</th>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <th key={n} className="p-1">
                      {n}ª
                    </th>
                  ))}
                  <th className="p-1">Média</th>
                </tr>
              </thead>
              <tbody>
                {LINHAS.map((l) => (
                  <tr key={l.chave}>
                    <td className="p-1 text-xs font-medium">{l.rotulo}</td>
                    {[1, 2, 3, 4, 5, 6, "media"].map((n) => (
                      <td key={String(n)} className="p-1">
                        <Input
                          type="number"
                          step={0.01}
                          className="h-8 w-16 px-1 text-center"
                          value={d.notas[`${l.chave}_${n}`] ?? ""}
                          onChange={(e) => atualizar(`notas.${l.chave}_${n}`, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>

        <Bloco titulo="Avaliação da Comissão Setorial">
          <div className="grid gap-3">
            <CampoArea rotulo="Avaliação da Comissão Setorial" valor={d.comissao.avaliacao} aoMudar={(v) => atualizar("comissao.avaliacao", v)} linhas={5} />
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoTexto rotulo="Pontuação obtida" valor={d.comissao.pontuacao} aoMudar={(v) => atualizar("comissao.pontuacao", v)} />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conclusão</Label>
                <div className="mt-2 flex gap-4 text-sm">
                  {["Aprovado", "Reprovado"].map((opcao) => (
                    <label key={opcao} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="conclusao"
                        checked={d.comissao.conclusao === opcao}
                        onChange={() => atualizar("comissao.conclusao", opcao)}
                      />
                      {opcao}
                    </label>
                  ))}
                </div>
              </div>
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
          tipo="FAFEP"
          dados={d}
          servidorNome={d.identificacao.nome}
          servidorMatricula={d.identificacao.matricula}
          orgao={d.identificacao.orgao}
          pontuacao={d.comissao.pontuacao ? Number(d.comissao.pontuacao) : null}
        />
      </div>
    </div>
  );
}

import { forwardRef } from "react";
import { REQUISITOS, TIPOS, PONTUACAO_MAXIMA, somaNotas, type TipoFormulario } from "@/lib/formularios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dados = any;

const linha = "border border-[#10231c]/45";

function Campo({ rotulo, valor, className = "" }: { rotulo: string; valor?: string; className?: string }) {
  return (
    <div className={`${linha} px-1.5 py-[3px] ${className}`}>
      <span className="font-semibold uppercase">{rotulo}: </span>
      <span>{valor || "—"}</span>
    </div>
  );
}

function Titulo({ tipo }: { tipo: TipoFormulario }) {
  const t = TIPOS[tipo];
  return (
    <div className="mb-2 text-center">
      <p className="text-[8px] font-semibold uppercase tracking-wide">{t.anexo}</p>
      <p className="text-[10px] font-bold uppercase leading-tight">{t.titulo}</p>
    </div>
  );
}

function Secao({ children }: { children: string }) {
  return (
    <div className={`${linha} bg-[#e8efe9] px-1.5 py-[3px] text-center text-[9px] font-bold uppercase`}>
      {children}
    </div>
  );
}

function Assinatura({ nome, rotulo, extra }: { nome?: string; rotulo: string; extra?: string }) {
  return (
    <div className="mt-4 text-center text-[8px]">
      <div className="mx-auto w-[80%] border-b border-[#10231c] pb-[2px] font-semibold">{nome || "\u00A0"}</div>
      <div className="uppercase">{rotulo}</div>
      {extra ? <div>{extra}</div> : null}
    </div>
  );
}

function BlocoComissao({ d }: { d: Dados }) {
  const c = d.comissao ?? {};
  return (
    <>
      <div className="mt-2">
        <Secao>Comissão Setorial de Avaliação Especial de Desempenho em Estágio Probatório</Secao>
      </div>
      <div className={`${linha} border-t-0 px-1.5 py-1 text-[8px]`}>
        <p>
          A Comissão Setorial de Avaliação de Desempenho discorda de alguma(s) das notas parciais?{" "}
          <strong>{c.discorda === "sim" ? "SIM" : "NÃO"}</strong>
        </p>
        <p className="mt-[2px] min-h-[22px] whitespace-pre-wrap">{c.fundamentacao || ""}</p>
        <p className="mt-[2px]">
          NOTA DA AVALIAÇÃO PARCIAL ATRIBUÍDA PELA COMISSÃO: <strong>{c.nota || "____"}</strong> pontos (
          <strong>{c.percentual || "____"}</strong>%).
        </p>
        <p className="mt-[2px]">
          Esse foi o resultado da avaliação parcial atribuído pela Comissão Setorial de Avaliação Especial de
          Desempenho em Estágio Probatório do(a) {d.identificacao?.orgao || "________"}, constituída pela Portaria{" "}
          {c.portaria || "__________"} de {c.portariaData || "____________"}.
        </p>
        <p className="mt-[2px]">LOCAL E DATA: {c.local || "____________"}, {c.data || "____________"}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Assinatura nome={c.presidente} rotulo="Presidente da Comissão" extra={c.presidenteCargo} />
        <Assinatura nome={c.membro1} rotulo="Membro da Comissão" extra={c.membro1Cargo} />
        <Assinatura nome={c.membro2} rotulo="Membro da Comissão" extra={c.membro2Cargo} />
      </div>
    </>
  );
}

function TabelaCriterios({ d }: { d: Dados }) {
  const notas = d.notas ?? {};
  const justificativas = d.justificativas ?? {};
  return (
    <table className={`${linha} w-full border-collapse text-[7.5px]`}>
      <thead>
        <tr className="bg-[#e8efe9] text-center font-bold uppercase">
          <th className={`${linha} w-[22%] p-[3px]`}>Requisitos</th>
          <th className={`${linha} w-[16%] p-[3px]`}>Critérios</th>
          <th className={`${linha} p-[3px]`}>Considerações / Justificativa / Feedback</th>
          <th className={`${linha} w-[7%] p-[3px]`}>Nota (0 a 10)</th>
          <th className={`${linha} w-[9%] p-[3px]`}>Total / %</th>
        </tr>
      </thead>
      <tbody>
        {REQUISITOS.map((req) => {
          const total = req.criterios.reduce((s, c) => s + (Number(notas[c.id]) || 0), 0);
          const percentual = Math.round((total / req.pontuacaoMaxima) * 100);
          return req.criterios.map((crit, indice) => (
            <tr key={crit.id} className="align-top">
              {indice === 0 && (
                <td className={`${linha} p-[3px]`} rowSpan={req.criterios.length}>
                  <strong>{req.titulo}:</strong> {req.descricao}
                </td>
              )}
              <td className={`${linha} p-[3px]`}>
                {crit.id} - {crit.nome}
              </td>
              <td className={`${linha} p-[3px] whitespace-pre-wrap`}>
                <em className="text-[6.8px] text-[#10231c]/70">{crit.descricao}</em>
                {justificativas[crit.id] ? <div className="mt-[2px]">{justificativas[crit.id]}</div> : null}
              </td>
              <td className={`${linha} p-[3px] text-center font-semibold`}>{notas[crit.id] ?? ""}</td>
              {indice === 0 && (
                <td className={`${linha} p-[3px] text-center font-semibold`} rowSpan={req.criterios.length}>
                  {total} / {req.pontuacaoMaxima}
                  <br />
                  {Number.isFinite(percentual) ? percentual : 0}%
                </td>
              )}
            </tr>
          ));
        })}
      </tbody>
    </table>
  );
}

function Fapep({ d, tipo }: { d: Dados; tipo: TipoFormulario }) {
  const id = d.identificacao ?? {};
  const total = somaNotas(d.notas ?? {});
  return (
    <>
      <Titulo tipo={tipo} />
      <Secao>Identificação do Servidor Avaliado</Secao>
      <div className="grid grid-cols-3">
        <Campo rotulo="Matrícula" valor={id.matricula} />
        <Campo rotulo="Nome" valor={id.nome} className="col-span-2 border-l-0" />
        <Campo rotulo="Ato de nomeação" valor={id.ato} className="border-t-0" />
        <Campo rotulo="Início do exercício" valor={id.dataInicio} className="border-l-0 border-t-0" />
        <Campo rotulo="Cargo" valor={id.cargo} className="border-l-0 border-t-0" />
        <Campo rotulo="Órgão/Entidade" valor={id.orgao} className="col-span-2 border-t-0" />
        <Campo rotulo="Setor" valor={id.setor} className="border-l-0 border-t-0" />
      </div>
      <div className="mt-2">
        <Secao>
          {tipo === "FAPEP1"
            ? "Avaliação realizada pelo Chefe Imediato"
            : `Avaliação realizada pelo Par nº ${d.parNumero || "___"}`}
        </Secao>
      </div>
      <div className="grid grid-cols-2">
        <Campo rotulo="Número da avaliação" valor={d.numeroAvaliacao} className="border-t-0" />
        <Campo
          rotulo="Período avaliado"
          valor={d.periodoInicio || d.periodoFim ? `${d.periodoInicio || "__"} a ${d.periodoFim || "__"}` : ""}
          className="border-l-0 border-t-0"
        />
      </div>
      <div className="mt-2">
        <TabelaCriterios d={d} />
      </div>
      <div className={`${linha} border-t-0 flex justify-between px-1.5 py-[3px] text-[8px] font-bold uppercase`}>
        <span>Pontuação máxima da avaliação parcial (AP): {PONTUACAO_MAXIMA} — 100%</span>
        <span>
          Resultado da avaliação parcial: {total} pontos ({Math.round((total / PONTUACAO_MAXIMA) * 100)}%)
        </span>
      </div>
      <div className="mt-2">
        <Secao>Observações complementares e sugestões para melhoria do desempenho</Secao>
      </div>
      <div className={`${linha} border-t-0 min-h-[34px] px-1.5 py-1 text-[8px] whitespace-pre-wrap`}>
        {d.observacoes || ""}
        {d.sugestoes ? `\n${d.sugestoes}` : ""}
      </div>
      <Assinatura
        nome={d.avaliador?.nome}
        rotulo={tipo === "FAPEP1" ? "Assinatura do Chefe Imediato" : `Assinatura do Par nº ${d.parNumero || "___"}`}
        extra={[d.avaliador?.cargo, d.avaliador?.local, d.avaliador?.data].filter(Boolean).join(" — ")}
      />
      <BlocoComissao d={d} />
    </>
  );
}

function Fafep({ d }: { d: Dados }) {
  const id = d.identificacao ?? {};
  const linhas: { rotulo: string; chave: string }[] = [
    { rotulo: "PAR Nº 1", chave: "par1" },
    { rotulo: "PAR Nº 2", chave: "par2" },
    { rotulo: "PAR Nº 3", chave: "par3" },
    { rotulo: "Chefia Imediata", chave: "chefia" },
    { rotulo: "Média das avaliações parciais", chave: "media" },
  ];
  const c = d.comissao ?? {};
  return (
    <>
      <Titulo tipo="FAFEP" />
      <Secao>Identificação do Servidor Avaliado</Secao>
      <div className="grid grid-cols-2">
        <Campo rotulo="Nome" valor={id.nome} />
        <Campo rotulo="Ato de nomeação" valor={id.ato} className="border-l-0" />
        <Campo rotulo="Cargo" valor={id.cargo} className="border-t-0" />
        <Campo rotulo="Órgão/Entidade" valor={id.orgao} className="border-l-0 border-t-0" />
        <Campo rotulo="Setor" valor={id.setor} className="col-span-2 border-t-0" />
      </div>
      <div className="mt-2">
        <Secao>Nota da avaliação dos pares e pela chefia imediata</Secao>
      </div>
      <table className={`${linha} w-full border-collapse text-[8px]`}>
        <thead>
          <tr className="bg-[#e8efe9] text-center font-bold uppercase">
            <th className={`${linha} p-[3px] text-left`}>Avaliador</th>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <th key={n} className={`${linha} p-[3px]`}>
                {n}ª Avaliação
              </th>
            ))}
            <th className={`${linha} p-[3px]`}>Média final</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave}>
              <td className={`${linha} p-[3px] font-semibold`}>{l.rotulo}</td>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <td key={n} className={`${linha} p-[3px] text-center`}>
                  {d.notas?.[`${l.chave}_${n}`] ?? ""}
                </td>
              ))}
              <td className={`${linha} p-[3px] text-center font-semibold`}>
                {d.notas?.[`${l.chave}_media`] ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2">
        <Secao>Avaliação da Comissão Setorial de Desempenho em Estágio Probatório</Secao>
      </div>
      <div className={`${linha} border-t-0 min-h-[40px] px-1.5 py-1 text-[8px] whitespace-pre-wrap`}>
        {c.avaliacao || ""}
      </div>
      <div className={`${linha} border-t-0 px-1.5 py-1 text-[8px]`}>
        <p>
          PONTUAÇÃO OBTIDA: <strong>{c.pontuacao || "__________"}</strong>
        </p>
        <p className="mt-[2px]">
          CONCLUSÃO: ( {c.conclusao === "Aprovado" ? "X" : "\u00A0"} ) Aprovado &nbsp;&nbsp; ({" "}
          {c.conclusao === "Reprovado" ? "X" : "\u00A0"} ) Reprovado
        </p>
        <p className="mt-[2px]">
          Esse é o resultado final apurado pela Comissão Setorial de Avaliação Especial de Desempenho em Estágio
          Probatório do(a) {id.orgao || "________"}, constituída pela Portaria {c.portaria || "__________"} de{" "}
          {c.portariaData || "____________"}.
        </p>
        <p className="mt-[2px]">
          LOCAL E DATA: {c.local || "____________"}, {c.data || "____________"}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Assinatura nome={c.presidente} rotulo="Presidente da Comissão" extra={c.presidenteCargo} />
        <Assinatura nome={c.membro1} rotulo="Membro da Comissão" extra={c.membro1Cargo} />
        <Assinatura nome={c.membro2} rotulo="Membro da Comissão" extra={c.membro2Cargo} />
      </div>
    </>
  );
}

function Raep({ d }: { d: Dados }) {
  return (
    <>
      <Titulo tipo="RAEP" />
      <div className="mt-3 space-y-2 text-[9px] leading-relaxed">
        <p>
          À Comissão <strong>{d.comissaoDestino || "________"}</strong> de Avaliação Especial de Desempenho em
          Estágio Probatório.
        </p>
        <p className="text-justify">
          <strong>{d.nome || "(NOME COMPLETO DO SERVIDOR AVALIADO)"}</strong>, matrícula{" "}
          <strong>{d.matricula || "____________"}</strong>, nomeado para o cargo efetivo de{" "}
          <strong>{d.cargo || "____________________"}</strong>, lotado na(o){" "}
          <strong>{d.lotacao || "____________________"}</strong>, vem, respeitosamente, apresentar RECURSO contra o
          resultado da <strong>{d.avaliacaoObjeto || "____________________"}</strong>, pelas razões de fato e de
          direito a seguir expostas:
        </p>
        <div className="min-h-[300px] whitespace-pre-wrap border border-[#10231c]/45 p-2 text-justify">
          {d.razoes || ""}
        </div>
        <p className="mt-2">Nestes termos, pede deferimento.</p>
        <p>
          {d.local || "____________"}, {d.data || "____ de ____________ de ______"}.
        </p>
      </div>
      <Assinatura nome={d.nome} rotulo="Assinatura do servidor em estágio probatório" />
    </>
  );
}

function Fada({ d }: { d: Dados }) {
  const id = d.identificacao ?? {};
  const atividades: Dados[] = d.atividades ?? [];
  return (
    <>
      <Titulo tipo="FADA" />
      <Secao>Identificação Servidor / Chefia Imediata</Secao>
      <div className="grid grid-cols-2">
        <Campo rotulo="Nome do servidor" valor={id.nome} />
        <Campo rotulo="Matrícula" valor={id.matricula} className="border-l-0" />
        <Campo rotulo="Cargo" valor={id.cargo} className="border-t-0" />
        <Campo rotulo="Unidade de exercício" valor={id.unidade} className="border-l-0 border-t-0" />
        <Campo rotulo="Órgão/Entidade" valor={id.orgao} className="col-span-2 border-t-0" />
        <Campo rotulo="Chefia imediata" valor={id.chefia} className="border-t-0" />
        <Campo rotulo="Cargo da chefia" valor={id.chefiaCargo} className="border-l-0 border-t-0" />
      </div>
      <div className="mt-2">
        <Secao>Descrição, planejamento, acompanhamento e avaliação das atividades pactuadas/realizadas</Secao>
      </div>
      <table className={`${linha} w-full border-collapse text-[7px]`}>
        <thead>
          <tr className="bg-[#e8efe9] text-center font-bold uppercase">
            <th className={`${linha} p-[2px]`} colSpan={4}>
              Pactuação
            </th>
            <th className={`${linha} p-[2px]`} colSpan={3}>
              Acompanhamento
            </th>
            <th className={`${linha} p-[2px]`} colSpan={3}>
              Resultados
            </th>
          </tr>
          <tr className="bg-[#e8efe9] text-center font-bold uppercase">
            <th className={`${linha} w-[3%] p-[2px]`}>Nº</th>
            <th className={`${linha} p-[2px]`}>Regime de trabalho</th>
            <th className={`${linha} p-[2px]`}>Descrição da atividade</th>
            <th className={`${linha} p-[2px]`}>Meta</th>
            <th className={`${linha} p-[2px]`}>Início</th>
            <th className={`${linha} p-[2px]`}>Fim</th>
            <th className={`${linha} p-[2px]`}>Situação</th>
            <th className={`${linha} p-[2px]`}>Metas/resultados atingidos</th>
            <th className={`${linha} p-[2px]`}>Acompanhamento / feedback</th>
            <th className={`${linha} p-[2px]`}>Observação</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((a, i) => (
            <tr key={i} className="align-top">
              <td className={`${linha} p-[2px] text-center`}>{i + 1}</td>
              <td className={`${linha} p-[2px]`}>{a.regime}</td>
              <td className={`${linha} p-[2px]`}>{a.descricao}</td>
              <td className={`${linha} p-[2px]`}>{a.meta}</td>
              <td className={`${linha} p-[2px] text-center`}>{a.dataInicio}</td>
              <td className={`${linha} p-[2px] text-center`}>{a.dataFim}</td>
              <td className={`${linha} p-[2px] text-center`}>{a.situacao}</td>
              <td className={`${linha} p-[2px]`}>{a.resultados}</td>
              <td className={`${linha} p-[2px]`}>{a.feedback}</td>
              <td className={`${linha} p-[2px]`}>{a.observacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-6">
        <Assinatura nome={id.nome} rotulo="Assinatura do servidor" extra={d.local && d.data ? `${d.local}, ${d.data}` : ""} />
        <Assinatura nome={id.chefia} rotulo="Assinatura da chefia imediata" extra={id.chefiaCargo} />
      </div>
    </>
  );
}

export const DocumentoFormulario = forwardRef<
  HTMLDivElement,
  { tipo: TipoFormulario; dados: Dados; registro?: { id: string; created_at: string } | undefined }
>(function DocumentoFormulario({ tipo, dados, registro }, ref) {
  return (
    <div ref={ref} className="folha-a4">
      {tipo === "FAPEP1" || tipo === "FAPEP2" ? <Fapep d={dados} tipo={tipo} /> : null}
      {tipo === "FAFEP" ? <Fafep d={dados} /> : null}
      {tipo === "RAEP" ? <Raep d={dados} /> : null}
      {tipo === "FADA" ? <Fada d={dados} /> : null}
      {registro ? (
        <p className="mt-3 text-center text-[6.5px] text-[#10231c]/60">
          Documento registrado eletronicamente em {new Date(registro.created_at).toLocaleString("pt-BR")} — código{" "}
          {registro.id}
        </p>
      ) : null}
    </div>
  );
});

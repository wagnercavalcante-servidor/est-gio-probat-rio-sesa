export type Criterio = { id: string; nome: string; descricao: string };
export type Requisito = {
  id: string;
  titulo: string;
  descricao: string;
  pontuacaoMaxima: number;
  criterios: Criterio[];
};

export const REQUISITOS: Requisito[] = [
  {
    id: "I",
    titulo: "I - IDONEIDADE MORAL E ÉTICA",
    descricao:
      "Atributos do padrão de conduta do servidor: a atuação deve pautar-se pela observância aos princípios éticos aplicáveis aos Servidores Civis do Estado do Ceará.",
    pontuacaoMaxima: 40,
    criterios: [
      {
        id: "I.1",
        nome: "Postura profissional",
        descricao:
          "Conduta do servidor em consonância com os valores morais e éticos, preservando a imagem e a reputação do serviço público;",
      },
      {
        id: "I.2",
        nome: "Relacionamento interpessoal",
        descricao:
          "Habilidade no trato com as pessoas, demonstrando respeito, independentemente do nível hierárquico, profissional ou social e tratando com cortesia, urbanidade e atenção os demais servidores e os usuários do serviço público;",
      },
      {
        id: "I.3",
        nome: "Probidade",
        descricao:
          "Atuação com honestidade e integridade no trato dos interesses do Estado, exercendo suas funções sem usufruir dos poderes ou facilidades delas decorrentes em proveito próprio ou em favorecimento a terceiros;",
      },
      {
        id: "I.4",
        nome: "Equilíbrio emocional",
        descricao:
          "Critério que visa verificar o equilíbrio emocional do servidor em estágio probatório de acordo com as normatizações médicas vigentes.",
      },
    ],
  },
  {
    id: "II",
    titulo: "II - DISCIPLINA",
    descricao:
      "Relaciona-se ao cumprimento de regras, normas legais, regulamentares e procedimentais estabelecidas para o bom andamento do serviço.",
    pontuacaoMaxima: 30,
    criterios: [
      {
        id: "II.1",
        nome: "Observância às Normas e Regulamentos",
        descricao:
          "Refere-se ao conhecimento e ao cumprimento das normas legais e regimentais e ao respeito à hierarquia;",
      },
      { id: "II.2", nome: "Assiduidade", descricao: "Comparecimento regular ao trabalho;" },
      {
        id: "II.3",
        nome: "Pontualidade",
        descricao:
          "Cumprimento da carga horária estabelecida; observância ao horário de início da jornada de trabalho e dos compromissos relacionados ao desempenho da função;",
      },
    ],
  },
  {
    id: "III",
    titulo: "III - DEDICAÇÃO AO SERVIÇO",
    descricao:
      "Caracteriza-se pelo comprometimento do servidor no desempenho de suas atribuições, no cumprimento das obrigações nos prazos estabelecidos, bem como interesse e disposição na execução de suas atividades.",
    pontuacaoMaxima: 30,
    criterios: [
      {
        id: "III.1",
        nome: "Responsabilidade",
        descricao:
          "Compromisso e dedicação ao cumprimento das funções, evidenciado pelo zelo e empenho na realização do trabalho, transmitindo confiança em relação à consecução do resultado almejado;",
      },
      {
        id: "III.2",
        nome: "Cooperação",
        descricao:
          "Disponibilidade e prontidão para ajudar e trabalhar por iniciativa própria ou quando demandado para atuar em situações específicas e capacidade de desenvolver trabalho em equipe;",
      },
      {
        id: "III.3",
        nome: "Iniciativa e Participação na Área de Trabalho",
        descricao:
          "Capacidade de iniciar e direcionar esforços para o desempenho das suas atribuições e contribuir para o desenvolvimento de sua área de trabalho;",
      },
    ],
  },
  {
    id: "IV",
    titulo: "IV - EFICIÊNCIA",
    descricao:
      "Capacidade de desenvolver o trabalho com presteza, qualidade e economicidade na utilização dos recursos (materiais, equipamentos, tempo, etc.) disponíveis.",
    pontuacaoMaxima: 30,
    criterios: [
      {
        id: "IV.1",
        nome: "Produtividade e resultado",
        descricao:
          "Volume de trabalho produzido, levando-se em conta a complexidade, padrões de desempenho desejáveis e as condições de realização do trabalho, bem como atendimento às metas institucionais fixadas no período;",
      },
      {
        id: "IV.2",
        nome: "Qualidade do Trabalho",
        descricao:
          "Execução das atribuições do cargo de acordo com os padrões técnicos pertinentes, com exatidão, correção, clareza e nos prazos determinados;",
      },
      {
        id: "IV.3",
        nome: "Conhecimento técnico",
        descricao:
          "Avalia em que medida o servidor possui e buscou aprimorar os conhecimentos necessários para desempenhar as atribuições do cargo.",
      },
    ],
  },
];

export const PONTUACAO_MAXIMA = 130;

export const TODOS_CRITERIOS = REQUISITOS.flatMap((r) => r.criterios.map((c) => c.id));

export type TipoFormulario = "FAPEP1" | "FAPEP2" | "FAFEP" | "RAEP" | "FADA";

export const TIPOS: Record<TipoFormulario, { sigla: string; anexo: string; titulo: string }> = {
  FAPEP1: {
    sigla: "FAPEP 1",
    anexo: "ANEXO I A QUE SE REFERE O DECRETO Nº 36.773, DE 06 DE AGOSTO DE 2025",
    titulo:
      "FORMULÁRIO DE AVALIAÇÃO PARCIAL DE ESTÁGIO PROBATÓRIO REALIZADA PELO CHEFE IMEDIATO – FAPEP 1",
  },
  FAPEP2: {
    sigla: "FAPEP 2",
    anexo: "ANEXO II A QUE SE REFERE O DECRETO Nº 36.773, DE 06 DE AGOSTO DE 2025",
    titulo:
      "FORMULÁRIO DE AVALIAÇÃO PARCIAL DE ESTÁGIO PROBATÓRIO REALIZADA PELOS SEUS PARES – FAPEP 2",
  },
  FAFEP: {
    sigla: "FAFEP",
    anexo: "ANEXO III A QUE SE REFERE O DECRETO Nº 36.773, DE 06 DE AGOSTO DE 2025",
    titulo: "FORMULÁRIO DE AVALIAÇÃO FINAL DE ESTÁGIO PROBATÓRIO - FAFEP",
  },
  RAEP: {
    sigla: "RAEP",
    anexo: "ANEXO IV A QUE SE REFERE O DECRETO Nº 36.773, DE 06 DE AGOSTO DE 2025",
    titulo: "RECURSO DE AVALIAÇÃO DE ESTÁGIO PROBATÓRIO - RAEP",
  },
  FADA: {
    sigla: "FADA",
    anexo: "ANEXO V A QUE SE REFERE O DECRETO Nº 36.773, DE 06 DE AGOSTO DE 2025",
    titulo: "FORMULÁRIO DE ACOMPANHAMENTO DE DESEMPENHO DE ATIVIDADES - FADA",
  },
};

export function somaNotas(notas: Record<string, string | number | undefined>): number {
  return TODOS_CRITERIOS.reduce((total, id) => {
    const valor = Number(notas?.[id] ?? 0);
    return total + (Number.isFinite(valor) ? valor : 0);
  }, 0);
}

/**
 * Verifica se um FAPEP 1/2 está completo. A única parte opcional é
 * "Considerações / justificativa / feedback".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pendenciasFapep(d: any, tipo: "FAPEP1" | "FAPEP2"): string[] {
  const faltando: string[] = [];
  const id = d?.identificacao ?? {};
  const obrigatoriosId: [string, string][] = [
    ["nome", "Nome do servidor"],
    ["matricula", "Matrícula"],
    ["ato", "Ato de nomeação"],
    ["dataInicio", "Data do início do exercício"],
    ["cargo", "Cargo"],
    ["orgao", "Órgão/Entidade"],
    ["setor", "Setor"],
  ];
  for (const [chave, rotulo] of obrigatoriosId) {
    if (!String(id[chave] ?? "").trim()) faltando.push(rotulo);
  }
  if (!String(d?.numeroAvaliacao ?? "").trim()) faltando.push("Número da avaliação");
  if (!String(d?.periodoInicio ?? "").trim()) faltando.push("Período de");
  if (!String(d?.periodoFim ?? "").trim()) faltando.push("Período até");
  if (tipo === "FAPEP2" && !String(d?.parNumero ?? "").trim()) faltando.push("Par nº");

  const semNota = TODOS_CRITERIOS.filter((c) => String(d?.notas?.[c] ?? "").trim() === "");
  if (semNota.length) faltando.push(`Notas dos critérios: ${semNota.join(", ")}`);

  const av = d?.avaliador ?? {};
  const obrigatoriosAv: [string, string][] = [
    ["nome", tipo === "FAPEP1" ? "Nome do chefe imediato" : "Nome do par avaliador"],
    ["cargo", "Cargo/função do avaliador"],
    ["local", "Local"],
    ["data", "Data"],
  ];
  for (const [chave, rotulo] of obrigatoriosAv) {
    if (!String(av[chave] ?? "").trim()) faltando.push(rotulo);
  }
  return faltando;
}

export function formatarData(valor?: string | null): string {
  if (!valor) return "";
  const [ano, mes, dia] = valor.split("-");
  if (!ano || !mes || !dia) return valor;
  return `${dia}/${mes}/${ano}`;
}

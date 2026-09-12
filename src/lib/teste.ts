import { REQUISITOS, somaNotas } from "@/lib/formularios";

export const SUFIXO_TESTE = "(TESTE)";

function hojeBr(): string {
  return new Date().toLocaleDateString("pt-BR");
}

/** Monta um FAPEP fictício já preenchido, para exercitar o fluxo completo. */
export function dadosFapepTeste(tipo: "FAPEP1" | "FAPEP2", avaliadorNome: string) {
  const notas: Record<string, string> = {};
  const justificativas: Record<string, string> = {};
  REQUISITOS.forEach((req) =>
    req.criterios.forEach((crit) => {
      notas[crit.id] = "8";
      justificativas[crit.id] = `Registro de teste para o critério ${crit.id} — ${crit.nome}.`;
    }),
  );

  const dados = {
    identificacao: {
      matricula: "000000-0",
      nome: `Servidor de Teste ${SUFIXO_TESTE}`,
      ato: "Ato fictício nº 000/2026",
      dataInicio: hojeBr(),
      cargo: "Cargo de teste",
      orgao: "Ambiente de teste",
      setor: "Setor de teste",
    },
    numeroAvaliacao: "1",
    periodoInicio: hojeBr(),
    periodoFim: hojeBr(),
    parNumero: tipo === "FAPEP2" ? "1" : "",
    notas,
    justificativas,
    observacoes: "Registro criado no ambiente de teste. Não possui validade administrativa.",
    sugestoes: "Simulação de sugestões para melhoria do desempenho.",
    avaliador: {
      nome: avaliadorNome || "Avaliador de teste",
      cargo: tipo === "FAPEP1" ? "Chefe imediato (teste)" : "Par avaliador (teste)",
      local: "Fortaleza",
      data: hojeBr(),
    },
    _teste: true,
  };

  return { dados, pontuacao: somaNotas(notas) };
}

export const ROTEIRO_TESTE = [
  {
    titulo: "1. Criar a avaliação de teste",
    texto:
      "Use o botão acima para gerar um FAPEP 1 ou FAPEP 2 fictício. Você entra como servidor avaliado desse registro, o que permite percorrer todas as etapas sozinho.",
  },
  {
    titulo: "2. Ciência do servidor",
    texto:
      "Abra a aba Minhas avaliações, marque 'incluir registros de teste' e escolha Concordo ou Peço reconsideração. Confira também a assinatura eletrônica com a sua senha.",
  },
  {
    titulo: "3. Revisão da chefia",
    texto:
      "Se pediu reconsideração, vá em Revisões pendentes, altere notas e conclua. Verifique se os pontos alterados aparecem destacados no documento.",
  },
  {
    titulo: "4. Recurso (RAEP)",
    texto:
      "Ao discordar da revisão, redija o recurso em Minhas avaliações e confirme que ele chega à comissão junto com a avaliação.",
  },
  {
    titulo: "5. Homologação",
    texto:
      "Na aba Homologações, preencha a parte da Comissão Setorial, assine e homologue. Depois confira o PDF e o código na página Conferir documento.",
  },
  {
    titulo: "6. Prazo vencido",
    texto:
      "Use 'Encerrar prazo agora' para simular a falta de manifestação e conferir se a concordância tácita é registrada automaticamente.",
  },
];

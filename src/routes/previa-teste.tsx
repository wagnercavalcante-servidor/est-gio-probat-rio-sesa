import { createFileRoute } from "@tanstack/react-router";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";

export const Route = createFileRoute("/previa-teste")({ ssr: false, component: Previa });

function Previa() {
  const dados = {
    identificacao: { nome: "Maria da Silva", matricula: "123456", cargo: "Analista", orgao: "SEPLAG", setor: "Coordenadoria" },
    numeroAvaliacao: "1",
    periodoInicio: "01/01/2026",
    periodoFim: "30/06/2026",
    notas: { "1.1": "10", "1.2": "9" },
    justificativas: { "1.1": "Excelente conduta" },
    observacoes: "Sem observações.",
    avaliador: { nome: "João Souza", cargo: "Coordenador", local: "Fortaleza", data: "01/07/2026" },
    comissao: { discorda: "nao" },
  };
  return (
    <div className="bg-muted p-6">
      <DocumentoFormulario tipo="FAPEP1" dados={dados} />
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLANILHA = "1yc2M7t6LICbWPZ3St5oC_e31fDAte_jQmu1stca0cDE";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const ABAS_GERAIS = ["Números gerais", "Admitidos pós 11-03-2025"];

function cabecalhos() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const sheets = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovable || !sheets) throw new Error("Conexão com a planilha não configurada.");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": sheets };
}

async function chamar(caminho: string) {
  const r = await fetch(`${GATEWAY}/spreadsheets/${PLANILHA}${caminho}`, { headers: cabecalhos() });
  if (!r.ok) throw new Error(`Falha ao ler a planilha [${r.status}]: ${await r.text()}`);
  return r.json();
}

export const listarOrgaosPlanilha = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const dados = (await chamar("?fields=sheets.properties.title")) as {
      sheets: { properties: { title: string } }[];
    };
    return dados.sheets.map((s) => s.properties.title).filter((t) => !ABAS_GERAIS.includes(t));
  });

export const detalharOrgao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orgao: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const intervalo = `'${data.orgao.replace(/'/g, "''")}'!A1:Z5000`;
    const res = (await chamar(`/values/${encodeURI(intervalo)}`)) as { values?: string[][] };
    const linhas = res.values ?? [];
    const [cab = [], ...resto] = linhas;
    const registros = resto.filter((l) => l.some((c) => c && c.trim()));
    return { colunas: cab, linhas: registros };
  });

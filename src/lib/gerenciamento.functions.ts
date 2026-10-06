import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLANILHA = "1O935qh6XktbiAiIvLhFGA2vCgUo3ZTqFo3cqSf1E9iM";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

/** Abas que não são turmas de admissão por data. */
const ABAS_IGNORADAS = new Set(["Página1"]);

function cabecalhos() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const sheets = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovable || !sheets) throw new Error("Conexão com a planilha não configurada.");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": sheets };
}

async function chamar(caminho: string, query = "") {
  const r = await fetch(`${GATEWAY}/spreadsheets/${PLANILHA}${caminho}${query}`, { headers: cabecalhos() });
  if (!r.ok) throw new Error(`Falha ao ler a planilha [${r.status}]: ${await r.text()}`);
  return r.json();
}

export type LinhaServidor = {
  orgao: string;
  nome: string;
  matricula: string;
  cargo: string;
  anoAdmissao: string;
  mesAdmissao: string;
  dataExercicio: string;
  avaliacoes: string[];
};

export const dadosGerenciamento = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const meta = (await chamar("?fields=sheets.properties.title")) as {
      sheets: { properties: { title: string } }[];
    };
    const abas = meta.sheets.map((s) => s.properties.title).filter((t) => !ABAS_IGNORADAS.has(t));

    const ranges = abas.map((t) => `'${t.replace(/'/g, "''")}'!A2:M5000`);
    const qs = ranges.map((r) => `ranges=${r}`).join("&");
    const res = (await chamar("/values:batchGet", `?${qs}`)) as {
      valueRanges?: { range: string; values?: string[][] }[];
    };

    const linhas: LinhaServidor[] = [];
    for (const vr of res.valueRanges ?? []) {
      for (const row of vr.values ?? []) {
        if (!row.some((c) => c && String(c).trim())) continue;
        linhas.push({
          orgao: String(row[0] ?? "").trim(),
          nome: String(row[1] ?? "").trim(),
          matricula: String(row[2] ?? "").trim(),
          cargo: String(row[3] ?? "").trim(),
          anoAdmissao: String(row[4] ?? "").trim(),
          mesAdmissao: String(row[5] ?? "").trim(),
          dataExercicio: String(row[6] ?? "").trim(),
          avaliacoes: row.slice(7, 13).map((c) => String(c ?? "").trim()),
        });
      }
    }

    return { linhas };
  });

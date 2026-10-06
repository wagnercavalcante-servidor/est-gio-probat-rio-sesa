import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLANILHA = "1O935qh6XktbiAiIvLhFGA2vCgUo3ZTqFo3cqSf1E9iM";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function paraIso(v: unknown): string | null {
  const m = String(v ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${(m[2] ?? "").padStart(2, "0")}-${(m[1] ?? "").padStart(2, "0")}`;
}

/** Copia todos os servidores da planilha para a base usada na busca dos formulários. */
export const sincronizarServidores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const lovable = process.env["LOVABLE_API_KEY"];
    const sheets = process.env["GOOGLE_SHEETS_API_KEY"];
    if (!lovable || !sheets) throw new Error("Conexão com a planilha não configurada.");
    const headers = { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": sheets };

    const metaR = await fetch(`${GATEWAY}/spreadsheets/${PLANILHA}?fields=sheets.properties.title`, { headers });
    if (!metaR.ok) throw new Error(`Falha ao ler a planilha [${metaR.status}]: ${await metaR.text()}`);
    const meta = (await metaR.json()) as { sheets: { properties: { title: string } }[] };
    const qs = meta.sheets
      .map((s) => `ranges='${s.properties.title.replace(/'/g, "''")}'!A2:M10000`)
      .join("&");
    const r = await fetch(`${GATEWAY}/spreadsheets/${PLANILHA}/values:batchGet?${qs}`, { headers });
    if (!r.ok) throw new Error(`Falha ao ler a planilha [${r.status}]: ${await r.text()}`);
    const res = (await r.json()) as { valueRanges?: { values?: string[][] }[] };

    const mapa = new Map<string, Record<string, unknown>>();
    for (const vr of res.valueRanges ?? []) {
      for (const row of vr.values ?? []) {
        const orgao = String(row[0] ?? "").trim();
        const nome = String(row[1] ?? "").trim();
        const matricula = String(row[2] ?? "").trim();
        if (!orgao || !nome || !matricula) continue;
        const ano = parseInt(String(row[4] ?? "").trim(), 10);
        mapa.set(`${orgao}|${matricula}`, {
          orgao,
          nome,
          matricula,
          cargo: String(row[3] ?? "").trim() || null,
          ano_admissao: Number.isFinite(ano) ? ano : null,
          mes_admissao: String(row[5] ?? "").trim() || null,
          data_inicio_exercicio: paraIso(row[6]),
          datas_avaliacoes: row.slice(7, 13).map(paraIso),
        });
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const lista = [...mapa.values()];
    for (let i = 0; i < lista.length; i += 500) {
      const { error } = await supabaseAdmin
        .from("servidores")
        .upsert(lista.slice(i, i + 500) as never, { onConflict: "orgao,matricula" });
      if (error) throw new Error(error.message);
    }
    return { total: lista.length };
  });

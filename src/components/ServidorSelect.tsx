import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarData } from "@/lib/formularios";
import { useSessao } from "@/hooks/useSessao";
import { useServerFn } from "@tanstack/react-start";
import { sincronizarServidores } from "@/lib/servidores-sync.functions";

/** Período da N-ª avaliação: da data anterior (ou início do exercício) até a data do ciclo N. */
export function periodoDaAvaliacao(s: Servidor | null, numero: number): { inicio: string; fim: string } | null {
  if (!s?.datas_avaliacoes || numero < 1 || numero > 6) return null;
  const fim = s.datas_avaliacoes[numero - 1];
  const inicio = numero === 1 ? s.data_inicio_exercicio : s.datas_avaliacoes[numero - 2];
  if (!fim || !inicio) return null;
  return { inicio: formatarData(inicio), fim: formatarData(fim) };
}

export type Servidor = {
  id: string;
  nome: string;
  matricula: string;
  orgao: string;
  cargo: string | null;
  data_inicio_exercicio: string | null;
  datas_avaliacoes: (string | null)[] | null;
};

let sincronizacao: Promise<unknown> | null = null;

export function ServidorSelect({ aoSelecionar }: { aoSelecionar: (s: Servidor) => void }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Servidor[]>([]);
  const [aberto, setAberto] = useState(false);
  const { orgao } = useSessao();
  const sincronizar = useServerFn(sincronizarServidores);

  useEffect(() => {
    // Atualiza a base de servidores a partir da planilha uma vez por sessão.
    if (!sincronizacao) sincronizacao = sincronizar().catch((e) => console.error(e));
  }, [sincronizar]);

  useEffect(() => {
    if (termo.trim().length < 3) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (sincronizacao) await sincronizacao;
      let consulta = supabase
        .from("servidores")
        .select("id, nome, matricula, orgao, cargo, data_inicio_exercicio, datas_avaliacoes")
        .or(`nome.ilike.%${termo.trim()}%,matricula.ilike.%${termo.trim()}%`);
      if (orgao) consulta = consulta.eq("orgao", orgao);
      const { data } = await consulta.order("nome").limit(12);
      setResultados((data ?? []) as Servidor[]);
      setAberto(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [termo, orgao]);

  return (
    <div className="relative">
      <Label htmlFor="busca-servidor">
        Buscar servidor na base (nome ou matrícula){orgao ? ` — ${orgao}` : ""}
      </Label>
      <div className="relative mt-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="busca-servidor"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Digite ao menos 3 letras…"
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {aberto && resultados.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover shadow-panel">
          {resultados.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                onClick={() => {
                  aoSelecionar(s);
                  setTermo("");
                  setResultados([]);
                  setAberto(false);
                }}
              >
                <span className="font-medium">{s.nome}</span>
                <span className="block text-xs text-muted-foreground">
                  Matrícula {s.matricula} · {s.orgao} · {s.cargo ?? "—"} · início em{" "}
                  {formatarData(s.data_inicio_exercicio) || "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

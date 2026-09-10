import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarData } from "@/lib/formularios";

export type Servidor = {
  id: string;
  nome: string;
  matricula: string;
  orgao: string;
  cargo: string | null;
  data_inicio_exercicio: string | null;
};

export function ServidorSelect({ aoSelecionar }: { aoSelecionar: (s: Servidor) => void }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Servidor[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (termo.trim().length < 3) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome, matricula, orgao, cargo, data_inicio_exercicio")
        .or(`nome.ilike.%${termo.trim()}%,matricula.ilike.%${termo.trim()}%`)
        .order("nome")
        .limit(12);
      setResultados((data ?? []) as Servidor[]);
      setAberto(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [termo]);

  return (
    <div className="relative">
      <Label htmlFor="busca-servidor">Buscar servidor na base (nome ou matrícula)</Label>
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

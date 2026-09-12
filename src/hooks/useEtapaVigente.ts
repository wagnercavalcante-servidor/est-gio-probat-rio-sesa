import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Ciclo, CicloEtapa, Etapa } from "@/lib/calendario";

type Resultado = { ciclo: Ciclo | null; etapa: CicloEtapa | null; carregando: boolean };

/** Busca a janela de datas aplicável a uma etapa, no ciclo ativo mais específico. */
export function useEtapaVigente(etapa: Etapa, orgao?: string | null, numeroAvaliacao?: number | null): Resultado {
  const [ciclo, setCiclo] = useState<Ciclo | null>(null);
  const [linha, setLinha] = useState<CicloEtapa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      setCarregando(true);
      const { data: ciclos } = await supabase
        .from("ciclos_avaliacao")
        .select("id, nome, numero_avaliacao, orgao, ativo, created_at")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      const candidatos = ((ciclos ?? []) as Ciclo[]).filter(
        (c) =>
          (c.orgao === null || !orgao || c.orgao === orgao) &&
          (c.numero_avaliacao === null || !numeroAvaliacao || c.numero_avaliacao === numeroAvaliacao),
      );
      candidatos.sort(
        (a, b) =>
          Number(b.orgao !== null) - Number(a.orgao !== null) ||
          Number(b.numero_avaliacao !== null) - Number(a.numero_avaliacao !== null),
      );

      const escolhido = candidatos[0] ?? null;
      if (!escolhido) {
        if (ativo) {
          setCiclo(null);
          setLinha(null);
          setCarregando(false);
        }
        return;
      }

      const { data } = await supabase
        .from("ciclo_etapas")
        .select("id, ciclo_id, etapa, data_inicio, data_fim")
        .eq("ciclo_id", escolhido.id)
        .eq("etapa", etapa)
        .maybeSingle();

      if (!ativo) return;
      setCiclo(escolhido);
      setLinha((data as CicloEtapa | null) ?? null);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [etapa, orgao, numeroAvaliacao]);

  return { ciclo, etapa: linha, carregando };
}

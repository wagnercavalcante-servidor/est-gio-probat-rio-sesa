import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Assinatura } from "@/lib/assinaturas";

export function useAssinaturas(formularioId?: string | null) {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!formularioId) {
      setAssinaturas([]);
      return;
    }
    setCarregando(true);
    const { data } = await supabase
      .from("assinaturas")
      .select("id, formulario_id, tipo_assinatura, nome, matricula, perfil, assinado_em")
      .eq("formulario_id", formularioId)
      .order("assinado_em", { ascending: true });
    setCarregando(false);
    setAssinaturas((data ?? []) as unknown as Assinatura[]);
  }, [formularioId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { assinaturas, carregando, recarregar: carregar };
}

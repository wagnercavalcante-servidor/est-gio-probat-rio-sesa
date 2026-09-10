import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "gestao_pessoas" | "comissao" | "avaliador";

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarPapeis = async (userId: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (!ativo) return;
      setPapeis((data ?? []).map((r) => r.role as Papel));
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
      if (data.session) void carregarPapeis(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      if (novaSessao) void carregarPapeis(novaSessao.user.id);
      else setPapeis([]);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    sessao,
    papeis,
    carregando,
    podeVerTodos: papeis.some((p) => p === "admin" || p === "gestao_pessoas" || p === "comissao"),
  };
}

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Papel =
  | "admin"
  | "gestao_pessoas"
  | "comissao"
  | "avaliador"
  | "chefia_imediata"
  | "chefia_mediata"
  | "par";

export const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Administrador",
  chefia_imediata: "Avaliador (Chefia Imediata)",
  chefia_mediata: "Avaliador (Chefia Mediata)",
  par: "Avaliador (Par)",
  gestao_pessoas: "Gestão de Pessoas",
  comissao: "Comissão Setorial",
  avaliador: "Avaliador",
};

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [orgao, setOrgao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarPerfil = async (userId: string) => {
      const [{ data: papeisData }, { data: perfil }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("orgao").eq("id", userId).maybeSingle(),
      ]);
      if (!ativo) return;
      setPapeis((papeisData ?? []).map((r) => r.role as Papel));
      setOrgao(((perfil as { orgao?: string | null } | null)?.orgao ?? null) || null);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
      if (data.session) void carregarPerfil(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      if (novaSessao) void carregarPerfil(novaSessao.user.id);
      else {
        setPapeis([]);
        setOrgao(null);
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    sessao,
    papeis,
    orgao,
    carregando,
    podeVerTodos: papeis.some((p) => p === "admin" || p === "gestao_pessoas" || p === "comissao"),
  };
}

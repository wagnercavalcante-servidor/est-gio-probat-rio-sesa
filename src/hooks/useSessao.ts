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
  | "par"
  | "servidor";

export const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Administrador",
  chefia_imediata: "Avaliador (Chefia Imediata)",
  chefia_mediata: "Avaliador (Chefia Mediata)",
  par: "Avaliador (Par)",
  gestao_pessoas: "Gestão de Pessoas",
  comissao: "Comissão Setorial",
  avaliador: "Avaliador",
  servidor: "Servidor avaliado",
};

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [orgao, setOrgao] = useState<string | null>(null);
  const [matricula, setMatricula] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarPerfil = async (userId: string) => {
      const [{ data: papeisData }, { data: perfil }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("orgao, matricula").eq("id", userId).maybeSingle(),
      ]);
      if (!ativo) return;
      setPapeis((papeisData ?? []).map((r) => r.role as Papel));
      const p = perfil as { orgao?: string | null; matricula?: string | null } | null;
      setOrgao((p?.orgao ?? null) || null);
      setMatricula((p?.matricula ?? null) || null);
      void supabase.rpc("expirar_prazos_avaliacao" as never);
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
        setMatricula(null);
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const tem = (...lista: Papel[]) => papeis.some((p) => lista.includes(p));

  return {
    sessao,
    papeis,
    orgao,
    matricula,
    carregando,
    ehAdmin: tem("admin"),
    ehServidor: tem("servidor"),
    ehComissao: tem("comissao"),
    ehGestaoPessoas: tem("gestao_pessoas"),
    ehAvaliador: tem("chefia_imediata", "chefia_mediata", "par", "avaliador"),
    podeVerTodos: tem("admin", "gestao_pessoas", "comissao"),
  };
}

import { useState } from "react";
import { Loader2, PenLine, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ROTULO_ASSINATURA,
  codigoDocumento,
  formatarDataHora,
  type Assinatura,
  type TipoAssinatura,
} from "@/lib/assinaturas";

type Props = {
  formularioId: string;
  tipoAssinatura: TipoAssinatura;
  assinaturas: Assinatura[];
  aoAssinar?: () => void | Promise<void>;
  somenteLeitura?: boolean;
};

export function AssinaturaEletronica({
  formularioId,
  tipoAssinatura,
  assinaturas,
  aoAssinar,
  somenteLeitura = false,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const assinar = async () => {
    if (!senha) {
      toast.error("Digite a sua senha de acesso para assinar.");
      return;
    }
    setEnviando(true);
    const { data: sessao } = await supabase.auth.getUser();
    const email = sessao.user?.email;
    if (!sessao.user || !email) {
      setEnviando(false);
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }

    const { error: erroSenha } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (erroSenha) {
      setEnviando(false);
      toast.error("Senha incorreta. A assinatura não foi registrada.");
      return;
    }

    const [{ data: perfil }, { data: papeis }] = await Promise.all([
      supabase.from("profiles").select("nome_completo, matricula").eq("id", sessao.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", sessao.user.id),
    ]);

    const { error } = await supabase.from("assinaturas").insert({
      formulario_id: formularioId,
      user_id: sessao.user.id,
      tipo_assinatura: tipoAssinatura,
      nome: (perfil as { nome_completo?: string | null } | null)?.nome_completo || email,
      matricula: (perfil as { matricula?: string | null } | null)?.matricula ?? null,
      perfil: (papeis ?? []).map((p) => (p as { role: string }).role).join(", ") || null,
      email,
    });
    setEnviando(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Você já assinou este documento."
          : "Não foi possível registrar a assinatura: " + error.message,
      );
      return;
    }
    setSenha("");
    setAberto(false);
    toast.success("Assinatura eletrônica registrada.");
    await aoAssinar?.();
  };

  const jaAssinou = assinaturas.some((a) => a.tipo_assinatura === tipoAssinatura);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ShieldCheck className="size-5 text-primary" />
        <div className="mr-auto">
          <p className="text-sm font-semibold">Assinatura eletrônica</p>
          <p className="text-xs text-muted-foreground">
            Código de verificação do documento: <strong>{codigoDocumento(formularioId)}</strong>
          </p>
        </div>
        {!somenteLeitura && (
          <Button size="sm" onClick={() => setAberto(true)} disabled={jaAssinou}>
            <PenLine className="size-4" /> {jaAssinou ? "Já assinado por você" : "Assinar eletronicamente"}
          </Button>
        )}
      </div>

      {assinaturas.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {assinaturas.map((a) => (
            <li key={a.id}>
              <strong className="text-foreground">{a.nome}</strong>
              {a.matricula ? ` · matrícula ${a.matricula}` : ""} —{" "}
              {ROTULO_ASSINATURA[a.tipo_assinatura] ?? a.tipo_assinatura} · assinado em{" "}
              {formatarDataHora(a.assinado_em)}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar eletronicamente</DialogTitle>
            <DialogDescription>
              Confirme a sua identidade digitando a mesma senha que você usa para entrar no sistema. A senha não é
              armazenada no documento; ficam registrados apenas o seu nome, perfil, data e hora.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="senha-assinatura">Senha de acesso</Label>
            <Input
              id="senha-assinatura"
              type="password"
              value={senha}
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !enviando && assinar()}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={assinar} disabled={enviando}>
              {enviando ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />} Confirmar
              assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TelaLogin() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCarregando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) toast.error("Não foi possível entrar: " + error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: { nome_completo: nome },
        },
      });
      setCarregando(false);
      if (error) {
        toast.error("Não foi possível criar a conta: " + error.message);
        return;
      }
      if (!data.session) {
        toast.success("Conta criada. Confirme o cadastro pelo link enviado ao seu e-mail.");
        setModo("entrar");
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-panel">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-lg leading-tight text-foreground">Avaliação de Estágio Probatório</h1>
            <p className="text-xs text-muted-foreground">Decreto nº 36.773, de 06 de agosto de 2025</p>
          </div>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          {modo === "criar" && (
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="mt-1" />
            </div>
          )}
          <div>
            <Label htmlFor="email">E-mail funcional</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando && <Loader2 className="size-4 animate-spin" />}
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Ainda não tem acesso? Criar conta" : "Já tem acesso? Entrar"}
        </button>
      </div>
    </main>
  );
}

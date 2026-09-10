import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BaseProps = {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: string;
  placeholder?: string;
  className?: string;
};

export function CampoTexto({ rotulo, valor, aoMudar, tipo = "text", placeholder, className }: BaseProps) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</Label>
      <Input
        type={tipo}
        value={valor}
        placeholder={placeholder ?? ""}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}

export function CampoArea({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  className,
  linhas = 4,
}: Omit<BaseProps, "tipo"> & { linhas?: number }) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</Label>
      <Textarea
        value={valor}
        rows={linhas}
        placeholder={placeholder ?? ""}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}

export function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-panel">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">{titulo}</h3>
      {children}
    </section>
  );
}

import { useRef, useState } from "react";
import { Download, FileCheck2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DocumentoFormulario } from "@/components/DocumentoFormulario";
import { baixarPdfPaginaUnica } from "@/lib/pdf";
import { AssinaturaEletronica } from "@/components/AssinaturaEletronica";
import { useAssinaturas } from "@/hooks/useAssinaturas";
import type { TipoAssinatura } from "@/lib/assinaturas";
import { pendenciasFapep, type TipoFormulario } from "@/lib/formularios";

const ASSINATURA_POR_TIPO: Record<TipoFormulario, TipoAssinatura> = {
  FAPEP1: "chefia_imediata",
  FAPEP2: "par",
  FAFEP: "comissao",
  RAEP: "servidor",
  FADA: "chefia_imediata",
};

type Props = {
  tipo: TipoFormulario;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: any;
  servidorNome: string;
  servidorMatricula?: string;
  orgao?: string;
  numeroAvaliacao?: number | null;
  pontuacao?: number | null;
  aoSalvar?: (id: string) => void | Promise<void>;
  mensagemPosSalvar?: string;
};

export function AcoesFormulario({
  tipo,
  dados,
  servidorNome,
  servidorMatricula,
  orgao,
  numeroAvaliacao,
  pontuacao,
  aoSalvar,
  mensagemPosSalvar,
}: Props) {
  const referencia = useRef<HTMLDivElement>(null);
  const [salvando, setSalvando] = useState(false);
  const [registro, setRegistro] = useState<{ id: string; created_at: string } | null>(null);
  const { assinaturas, recarregar } = useAssinaturas(registro?.id);

  const salvar = async () => {
    if (!servidorNome?.trim()) {
      toast.error("Informe o nome do servidor avaliado antes de salvar.");
      return;
    }
    setSalvando(true);
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) {
      setSalvando(false);
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }
    const { data, error } = await supabase
      .from("formularios")
      .insert({
        tipo,
        servidor_nome: servidorNome,
        servidor_matricula: servidorMatricula ?? null,
        orgao: orgao ?? null,
        numero_avaliacao: numeroAvaliacao ?? null,
        pontuacao: pontuacao ?? null,
        dados,
        created_by: sessao.user.id,
      })
      .select("id, created_at")
      .single();
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    setRegistro(data);
    await aoSalvar?.(data.id);
    toast.success(mensagemPosSalvar ?? "Formulário salvo. Ele não pode mais ser alterado.");
  };

  const baixar = async () => {
    if (!referencia.current) return;
    toast.info("Gerando PDF…");
    await baixarPdfPaginaUnica(
      referencia.current,
      `${tipo}-${servidorNome.replace(/\s+/g, "_") || "formulario"}.pdf`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        {registro ? (
          <>
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Lock className="size-4" /> Salvo em {new Date(registro.created_at).toLocaleString("pt-BR")}
            </span>
            <Button onClick={baixar} className="ml-auto">
              <Download className="size-4" /> Baixar PDF (página única)
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Confira a pré-visualização abaixo. Após salvar, o formulário fica registrado e não poderá ser alterado.
            </p>
            <Button onClick={salvar} disabled={salvando} className="ml-auto">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
              Salvar definitivamente
            </Button>
          </>
        )}
      </div>

      {registro && (
        <AssinaturaEletronica
          formularioId={registro.id}
          tipoAssinatura={ASSINATURA_POR_TIPO[tipo]}
          assinaturas={assinaturas}
          aoAssinar={recarregar}
        />
      )}

      <div className="overflow-auto rounded-lg border border-border bg-muted p-4">
        <div className="mx-auto w-fit origin-top shadow-panel">
          <DocumentoFormulario
            ref={referencia}
            tipo={tipo}
            dados={dados}
            registro={registro ?? undefined}
            assinaturas={assinaturas}
          />
        </div>
      </div>
    </div>
  );
}

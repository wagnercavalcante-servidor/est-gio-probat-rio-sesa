export type TipoAssinatura =
  | "chefia_imediata"
  | "par"
  | "chefia_mediata"
  | "servidor"
  | "comissao"
  | "gestao_pessoas";

export const ROTULO_ASSINATURA: Record<string, string> = {
  chefia_imediata: "Chefe imediato",
  par: "Par avaliador",
  chefia_mediata: "Chefia mediata",
  servidor: "Servidor avaliado",
  comissao: "Comissão Setorial de Avaliação Especial",
  gestao_pessoas: "Gestão de Pessoas",
};

export type Assinatura = {
  id: string;
  formulario_id: string;
  tipo_assinatura: string;
  nome: string;
  matricula: string | null;
  perfil: string | null;
  assinado_em: string;
};

/** Código de verificação do documento, no mesmo formato gravado no banco. */
export function codigoDocumento(formularioId: string): string {
  const limpo = formularioId.replace(/-/g, "").toUpperCase();
  return `${limpo.slice(0, 4)}-${limpo.slice(4, 8)}-${limpo.slice(8, 12)}`;
}

export function formatarDataHora(valor: string): string {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

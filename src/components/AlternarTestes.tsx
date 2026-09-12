/** Caixa de seleção para incluir registros do ambiente de teste nas listagens. */
export function AlternarTestes({ valor, aoMudar }: { valor: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input type="checkbox" checked={valor} onChange={(e) => aoMudar(e.target.checked)} className="size-3.5" />
      Incluir registros de teste
    </label>
  );
}

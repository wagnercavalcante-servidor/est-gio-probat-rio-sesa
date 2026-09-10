import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Gera um PDF A4 retrato com o conteúdo do elemento sempre ajustado
 * em UMA ÚNICA página (a imagem é reduzida proporcionalmente se necessário).
 */
export async function baixarPdfPaginaUnica(elemento: HTMLElement, nomeArquivo: string) {
  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();
  const margem = 6;
  const larguraUtil = larguraPagina - margem * 2;
  const alturaUtil = alturaPagina - margem * 2;

  const proporcao = canvas.height / canvas.width;
  let largura = larguraUtil;
  let altura = largura * proporcao;

  if (altura > alturaUtil) {
    altura = alturaUtil;
    largura = altura / proporcao;
  }

  const x = (larguraPagina - largura) / 2;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", x, margem, largura, altura);
  pdf.save(nomeArquivo);
}

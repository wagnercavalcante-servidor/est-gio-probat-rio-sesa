import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Gera um PDF A4 retrato idêntico à pré-visualização exibida na tela.
 * A folha na tela já tem a proporção A4, então a imagem preenche a página
 * inteira (sem margens extras). Se o conteúdo passar da altura da folha,
 * ele é reduzido proporcionalmente para caber em UMA ÚNICA página.
 */
export async function baixarPdfPaginaUnica(elemento: HTMLElement, nomeArquivo: string) {
  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    windowWidth: elemento.scrollWidth,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();

  const proporcao = canvas.height / canvas.width;
  let largura = larguraPagina;
  let altura = largura * proporcao;

  if (altura > alturaPagina) {
    altura = alturaPagina;
    largura = altura / proporcao;
  }

  const x = (larguraPagina - largura) / 2;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", x, 0, largura, altura);
  pdf.save(nomeArquivo);
}

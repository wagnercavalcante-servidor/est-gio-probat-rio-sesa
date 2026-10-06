import { ErroDominio } from "../shared/base";

/** Objeto de valor: nota de um critério, sempre dentro da escala legal. */
export class Nota {
  private constructor(public readonly valor: number, public readonly maximo: number) {}

  public static criar(valor: number, maximo: number): Nota {
    if (!Number.isFinite(valor) || valor < 0 || valor > maximo) {
      throw new ErroDominio(`A nota deve estar entre 0 e ${maximo}, conforme a escala do decreto.`);
    }
    return new Nota(valor, maximo);
  }

  public igual(outra: Nota): boolean {
    return this.valor === outra.valor && this.maximo === outra.maximo;
  }
}

/** Objeto de valor: soma das notas e percentual de aproveitamento. */
export class PontuacaoTotal {
  private constructor(public readonly obtida: number, public readonly maxima: number) {}

  public static de(notas: Nota[]): PontuacaoTotal {
    return new PontuacaoTotal(
      notas.reduce((s, n) => s + n.valor, 0),
      notas.reduce((s, n) => s + n.maximo, 0),
    );
  }

  public get percentual(): number {
    return this.maxima === 0 ? 0 : Math.round((this.obtida / this.maxima) * 10000) / 100;
  }
}

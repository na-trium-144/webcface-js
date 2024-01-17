import * as math from "mathjs";

export function multiply(...matrices: number[][][]): number[][] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return math.multiply(...matrices);
}

export function inv(matrix: number[][]): number[][] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return math.inv(matrix);
}

export const imageColorMode = {
  gray: 0,
  bgr: 1,
  bgra: 2,
  rgb: 3,
  rgba: 4,
} as const;
export const imageCompressMode = {
  raw: 0,
  jpeg: 1,
  webp: 2,
  png: 3,
} as const;

export class ImageFrame {
  width: number;
  height: number;
  data: ArrayBuffer;
  colorMode: number;
  compressMode: number;
  constructor(
    width = 0,
    height = 0,
    data = new ArrayBuffer(0),
    colorMode = 0,
    compressMode = 0
  ) {
    this.width = width;
    this.height = height;
    this.data = data;
    this.colorMode = colorMode;
    this.compressMode = compressMode;
  }
  toBase64() {
    // todo: もっと速い方法がないか?
    let binary = "";
    const bytes = new Uint8Array(this.data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export interface ImageReq {
  width?: number;
  height?: number;
  colorMode?: number;
  compressMode?: number;
  quality?: number;
  frameRate?: number;
}

import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

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
}

/**
 * Imageを指すクラス
 *
 */
export class Image extends EventTarget<Image> {
  /**
   * このコンストラクタは直接使わず、
   * Member.image(), Member.images(), Member.onImageEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.imageChange(this);
  }
  /**
   * Memberを返す
   */
  get member() {
    return new Member(this);
  }
  /**
   * field名を返す
   */
  get name() {
    return this.field_;
  }
  /**
   * 子フィールドを返す
   * @return 「(thisのフィールド名).(子フィールド名)」をフィールド名とするValue
   */
  child(field: string): Image {
    return new Image(this, this.field_ + "." + field);
  }
  /**
   * 値をリクエストする。
   */
  request(reqOption?: ImageReq) {
    if (reqOption !== undefined) {
      this.dataCheck().imageStore.clearRecv(this.member_, this.field_);
    }
    const reqId = this.dataCheck().imageStore.addReq(
      this.member_,
      this.field_,
      reqOption
    );
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.imageReq,
          M: this.member_,
          f: this.field_,
          i: reqId,
          w: reqOption?.width || null,
          h: reqOption?.height || null,
          l: reqOption?.colorMode || null,
          p: reqOption?.compressMode || imageCompressMode.raw,
          q: reqOption?.quality || 0,
        },
      ]);
    }
  }
  /**
   *  画像を返す
   *
   * リクエストもする
   */
  tryGet() {
    this.request();
    return this.dataCheck().imageStore.getRecv(this.member_, this.field_);
  }
  /**
   *  画像を返す
   */
  get() {
    const v = this.tryGet();
    if (v === null) {
      return new ImageFrame();
    } else {
      return v;
    }
  }
  /**
   * 値をセットする
   */
  set(data: ImageFrame) {
    this.setCheck().imageStore.setSend(this.field_, data);
    this.triggerEvent(this);
  }
  /**
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

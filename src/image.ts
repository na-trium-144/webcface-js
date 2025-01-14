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
  frameRate?: number;
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
    this.eventType_ = eventType.imageChange(this.base_);
  }
  /**
   * Memberを返す
   */
  get member() {
    return new Member(this.base_);
  }
  /**
   * field名を返す
   */
  get name() {
    return this.base_.field_;
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするImage
   */
  child(field: string): Image {
    return new Image(this.base_.child(field));
  }
  /**
   * 値をリクエストする。
   */
  request(reqOption?: ImageReq) {
    const reqId = this.base_
      .dataCheck()
      .imageStore.addReq(this.base_.member_, this.base_.field_, reqOption);
    if (reqId > 0) {
      this.base_
        .dataCheck()
        .imageStore.clearRecv(this.base_.member_, this.base_.field_);
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.imageReq,
          M: this.base_.member_,
          f: this.base_.field_,
          i: reqId,
          w: reqOption?.width || null,
          h: reqOption?.height || null,
          l: reqOption?.colorMode || null,
          p: reqOption?.compressMode || imageCompressMode.raw,
          q: reqOption?.quality || 0,
          r: reqOption?.frameRate || null,
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
    return this.base_
      .dataCheck()
      .imageStore.getRecv(this.base_.member_, this.base_.field_);
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
   * このフィールドにデータが存在すればtrueを返す
   * @since ver1.8
   *
   * tryGet() とは違って、実際のデータを受信しない。
   * (リクエストも送信しない)
   */
  exists() {
    return this.base_
      .dataCheck()
      .imageStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
  }
  /**
   * 値をセットする
   */
  set(data: ImageFrame) {
    this.base_.setCheck().imageStore.setSend(this.base_.field_, data);
    this.triggerEvent(this);
  }
  /**
   * Memberのsyncの時刻を返す
   *
   * @deprecated ver1.6〜 Member.syncTime() に移行
   */
  time() {
    return (
      this.base_.dataCheck().syncTimeStore.getRecv(this.base_.member_) ||
      new Date(0)
    );
  }
}

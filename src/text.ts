import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

/**
 * Textを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_11__text.html Textのドキュメント}
 * を参照
 */
export class Text extends EventTarget<Text> {
  base_: Field
  /**
   * このコンストラクタは直接使わず、
   * Member.text(), Member.texts(), Member.onTextEntry などを使うこと
   */
  constructor(base: Field | null, field = "") {
    super("", base?.data || null);
    this.base_ = new Field(base?.data || null, base?.member_ || "", field || base?.field_);
    this.eventType_ = eventType.textChange(this.base_);
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
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするText
   */
  child(field: string): Text {
    return new Text(this.base_.child(field));
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.base_
      .dataCheck()
      .textStore.addReq(this.base_.member_, this.base_.field_);
    if (reqId > 0) {
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.textReq,
          M: this.base_.member_,
          f: this.base_.field_,
          i: reqId,
        },
      ]);
    }
  }
  /**
   * 文字列を返す
   */
  tryGet() {
    this.request();
    const v = this.base_
      .dataCheck()
      .textStore.getRecv(this.base_.member_, this.base_.field_);
    if (v === null) {
      return null;
    } else {
      return String(v);
    }
  }
  /**
   * 文字列ではないかもしれないデータをそのまま返す
   */
  tryGetAny() {
    this.request();
    return this.base_
      .dataCheck()
      .textStore.getRecv(this.base_.member_, this.base_.field_);
  }
  /**
   * 文字列を返す
   */
  get() {
    return this.tryGet() || "";
  }
  /**
   * 文字列ではないかもしれないデータをそのまま返す
   */
  getAny() {
    const v = this.tryGetAny();
    if (v === null) {
      return "";
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
      .textStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
  }
  /**
   * 文字列をセットする
   */
  set(data: string | number | boolean | object) {
    if (typeof data === "object" && data != null) {
      for (const [k, v] of Object.entries(data)) {
        this.child(k).set(v as string | object);
      }
    } else {
      this.base_.setCheck().textStore.setSend(this.base_.field_, String(data));
      this.triggerEvent(this);
    }
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

export class InputRef {
  state: Text;
  constructor() {
    this.state = new Text(null);
  }
  get() {
    if (this.state.base_.isValid()) {
      return this.state.getAny();
    } else {
      return "";
    }
  }
}

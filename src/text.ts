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
  /**
   * このコンストラクタは直接使わず、
   * Member.text(), Member.texts(), Member.onTextEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.textChange(this);
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
   * @return 「(thisのフィールド名).(子フィールド名)」をフィールド名とするText
   */
  child(field: string): Text {
    return new Text(this, this.field_ + "." + field);
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.dataCheck().textStore.addReq(this.member_, this.field_);
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.textReq,
          M: this.member_,
          f: this.field_,
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
    return String(
      this.dataCheck().textStore.getRecv(this.member_, this.field_)
    );
  }
  /**
   * 文字列ではないかもしれないデータをそのまま返す
   */
  tryGetRaw() {
    this.request();
    return this.dataCheck().textStore.getRecv(this.member_, this.field_);
  }
  /**
   * 文字列を返す
   */
  get() {
    const v = this.tryGet();
    if (v === null) {
      return "";
    } else {
      return v;
    }
  }
  /**
   * 文字列ではないかもしれないデータをそのまま返す
   */
  getRaw() {
    const v = this.tryGetRaw();
    if (v === null) {
      return "";
    } else {
      return v;
    }
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
      this.setCheck().textStore.setSend(this.field_, String(data));
      this.triggerEvent(this);
    }
  }
  /**
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

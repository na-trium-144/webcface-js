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
  constructor(base: Field | null, field = "") {
    super(
      "",
      base?.data || null,
      base?.member_ || "",
      field || base?.field_ || ""
    );
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
    const v = this.dataCheck().textStore.getRecv(this.member_, this.field_);
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
    return this.dataCheck().textStore.getRecv(this.member_, this.field_);
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
   *
   * @deprecated ver1.6〜 Member.syncTime() に移行
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

export class InputRef {
  state: Text;
  constructor() {
    this.state = new Text();
  }
  get() {
    if (this.state.isValid()) {
      return this.state.getAny();
    } else {
      return null;
    }
  }
}

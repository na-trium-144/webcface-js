import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

/**
 * Valueを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_10__value.html Valueのドキュメント}
 * を参照
 */
export class Value extends EventTarget<Value> {
  /**
   * このコンストラクタは直接使わず、
   * Member.value(), Member.values(), Member.onValueEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.valueChange(this);
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
  child(field: string): Value {
    return new Value(this, this.field_ + "." + field);
  }
  // todo
  // tryGetRecurse(){
  //   return this.data.valueStore.getRecvRecurse(this.member_, this.field_);
  // }

  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.dataCheck().valueStore.addReq(this.member_, this.field_);
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.valueReq,
          M: this.member_,
          f: this.field_,
          i: reqId,
        },
      ]);
    }
  }
  /**
   *  値をarrayで返す
   *
   * リクエストもする
   */
  tryGetVec() {
    this.request();
    return this.dataCheck().valueStore.getRecv(this.member_, this.field_);
  }
  /**
   *  値を返す
   */
  tryGet() {
    const v = this.tryGetVec();
    return v !== null && v.length >= 1 ? v[0] : null;
  }
  /**
   *  値をarrayで返す
   */
  getVec() {
    const v = this.tryGetVec();
    if (v === null) {
      return [];
    } else {
      return v;
    }
  }
  /**
   *  値を返す
   */
  get() {
    const v = this.tryGet();
    if (v === null) {
      return 0;
    } else {
      return v;
    }
  }
  /**
   * 値をセットする
   */
  set(data: number | number[] | object) {
    if (typeof data === "number") {
      this.setCheck().valueStore.setSend(this.field_, [data]);
      this.triggerEvent(this);
    } else if (
      Array.isArray(data) &&
      data.find((v) => typeof v !== "number") === undefined
    ) {
      this.setCheck().valueStore.setSend(this.field_, data);
      this.triggerEvent(this);
    } else if (typeof data === "object" && data != null) {
      for (const [k, v] of Object.entries(data)) {
        this.child(k).set(v as number | number[] | object);
      }
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

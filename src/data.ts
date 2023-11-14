import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import { LogLine } from "./logger.js";

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
   *  値をarrayで返す
   */
  tryGetVec() {
    return this.data.valueStore.getRecv(this.member_, this.field_);
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
    if (this.data.valueStore.isSelf(this.member_)) {
      if (typeof data === "number") {
        this.data.valueStore.setSend(this.field_, [data]);
        this.triggerEvent(this);
      } else if (
        Array.isArray(data) &&
        data.find((v) => typeof v !== "number") === undefined
      ) {
        this.data.valueStore.setSend(this.field_, data);
        this.triggerEvent(this);
      } else if (typeof data === "object" && data != null) {
        for (const [k, v] of Object.entries(data)) {
          this.child(k).set(v as number | number[] | object);
        }
      }
    } else {
      throw new Error("Cannot set data to member other than self");
    }
  }
  /**
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.data.syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}
export class Text extends EventTarget<Text> {
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.textChange(this);
  }
  get member() {
    return new Member(this);
  }
  get name() {
    return this.field_;
  }
  child(field: string): Text {
    return new Text(this, this.field_ + "." + field);
  }
  tryGet() {
    return this.data.textStore.getRecv(this.member_, this.field_);
  }
  get() {
    const v = this.tryGet();
    if (v === null) {
      return "";
    } else {
      return v;
    }
  }
  set(data: string | object) {
    if (this.data.textStore.isSelf(this.member_)) {
      if (typeof data === "object" && data != null) {
        for (const [k, v] of Object.entries(data)) {
          this.child(k).set(v as string | object);
        }
      } else {
        this.data.textStore.setSend(this.field_, String(data));
        this.triggerEvent(this);
      }
    } else {
      throw new Error("Cannot set data to member other than self");
    }
  }
  time() {
    return this.data.syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

export class Log extends EventTarget<Log> {
  constructor(base: Field) {
    super("", base.data, base.member_, "");
    this.eventType_ = eventType.logAppend(this);
  }
  get member() {
    return new Member(this);
  }
  tryGet() {
    return this.data.logStore.getRecv(this.member_);
  }
  get() {
    const v = this.tryGet();
    if (v === null) {
      return [];
    } else {
      return v;
    }
  }
}

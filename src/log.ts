import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";

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
  clear() {
    this.data.logStore.setRecv(this.member_, []);
    return this;
  }
}

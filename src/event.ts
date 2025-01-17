import { ClientData } from "./clientData.js";
import { FieldBase } from "./fieldBase.js";

export const eventType = {
  onWsOpen: () => "wsOpen",
  memberEntry: () => "memberEntry",
  sync: (b: FieldBase) => JSON.stringify(["sync", b.member_]),
  ping: (b: FieldBase) => JSON.stringify(["ping", b.member_]),
  valueEntry: (b: FieldBase) => JSON.stringify(["valueEntry", b.member_]),
  textEntry: (b: FieldBase) => JSON.stringify(["textEntry", b.member_]),
  funcEntry: (b: FieldBase) => JSON.stringify(["funcEntry", b.member_]),
  viewEntry: (b: FieldBase) => JSON.stringify(["viewEntry", b.member_]),
  imageEntry: (b: FieldBase) => JSON.stringify(["imageEntry", b.member_]),
  canvas3DEntry: (b: FieldBase) => JSON.stringify(["canvas3DEntry", b.member_]),
  canvas2DEntry: (b: FieldBase) => JSON.stringify(["canvas2DEntry", b.member_]),
  logEntry: (b: FieldBase) => JSON.stringify(["logEntry", b.member_]),
  robotModelEntry: (b: FieldBase) =>
    JSON.stringify(["robotModelEntry", b.member_]),
  valueChange: (b: FieldBase) =>
    JSON.stringify(["valueChange", b.member_, b.field_]),
  textChange: (b: FieldBase) =>
    JSON.stringify(["textChange", b.member_, b.field_]),
  viewChange: (b: FieldBase) =>
    JSON.stringify(["viewChange", b.member_, b.field_]),
  imageChange: (b: FieldBase) =>
    JSON.stringify(["imageChange", b.member_, b.field_]),
  robotModelChange: (b: FieldBase) =>
    JSON.stringify(["robotModelChange", b.member_, b.field_]),
  canvas3DChange: (b: FieldBase) =>
    JSON.stringify(["canvas3DChange", b.member_, b.field_]),
  canvas2DChange: (b: FieldBase) =>
    JSON.stringify(["canvas2DChange", b.member_, b.field_]),
  logAppend: (b: FieldBase) =>
    JSON.stringify(["logAppend", b.member_, b.field_]),
};

type EventListener<TargetType> = (target: TargetType) => void;

export class EventTarget<TargetType> {
  data: ClientData | null;
  eventType_: string;
  // onAppend: () => void;
  constructor(eventType: string, data: ClientData | null) {
    this.data = data;
    this.eventType_ = eventType;
    // this.onAppend = onAppend;
  }
  triggerEvent(arg: TargetType) {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    this.data.eventEmitter.emit(this.eventType_, arg);
  }
  addListener(listener: EventListener<TargetType>) {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    this.data.eventEmitter.addListener(this.eventType_, listener);
    // this.onAppend();
  }
  on(listener: EventListener<TargetType>) {
    this.addListener(listener);
  }
  once(listener: EventListener<TargetType>) {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    this.data.eventEmitter.once(this.eventType_, listener);
    // this.onAppend();
  }
  removeListener(listener: EventListener<TargetType>) {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    this.data.eventEmitter.removeListener(this.eventType_, listener);
  }
  off(listener: EventListener<TargetType>) {
    this.removeListener(listener);
  }
  removeAllListeners() {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    this.data.eventEmitter.removeAllListeners(this.eventType_);
  }
}

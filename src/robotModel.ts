import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

export class Transform {
  private _pos: number[];
  private _rot: number[];
}
export class RobotGeometry{
  type: number;
  origin: Transform;
  properties: number[];
}
export interface RobotJoint {
  name: string;
  parentName: string;
  type: number;
  origin: Transform;
  angle: number;
}
export class RobotLink {
  name: string;
  joint: RobotJoint;
  geometry: RobotGeometry;
  color: number;
  static fromMessage(msg: Message.RobotLink, linkNames: string[]){

  }
  toMessage(linkNames: string[]){

  }
}
/**
 * RobotModelを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_16__robot_model.html RobotModelのドキュメント}
 * を参照
 */
export class RobotModel extends EventTarget<RobotModel> {
  /**
   * このコンストラクタは直接使わず、
   * Member.robotModel(), Member.robotModels(), Member.onRobotModelEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.robotModelChange(this);
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
   * 値をリクエストする。
   */
  request() {
    const reqId = this.dataCheck().robotModelStore.addReq(this.member_, this.field_);
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.robotModelReq,
          M: this.member_,
          f: this.field_,
          i: reqId,
        },
      ]);
    }
  }
  /**
   * modelを返す
   */
  tryGet() {
    this.request();
    const msgLinks = this.dataCheck().robotModelStore.getRecv(this.member_, this.field_);
    const retLinks: RobotLink[] = [];
    const linkNames: string[] = [];
    for(const ln of msgLinks){
      retLinks.push(RobotLink.fromMessage(ln, linkNames));
      linkNames.push(ln.n);
    }
    return retLinks;
  }
  /**
   * modelを返す
   */
  get() {
    const v = this.tryGet();
    if (v === null) {
      return [];
    } else {
      return v;
    }
  }
  // /**
  //  * 文字列をセットする
  //  */
  // set(data: ) {
  //   if (typeof data === "object" && data != null) {
  //     for (const [k, v] of Object.entries(data)) {
  //       this.child(k).set(v as string | object);
  //     }
  //   } else {
  //     this.setCheck().textStore.setSend(this.field_, String(data));
  //     this.triggerEvent(this);
  //   }
  // }
  /**
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

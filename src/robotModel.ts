import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

export interface Transform {
  pos: number[];
  rot: number[];
}
export interface RobotGeometry {
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
  constructor(
    name: string,
    joint: RobotJoint,
    geometry: RobotGeometry,
    color: number
  ) {
    this.name = name;
    this.joint = joint;
    this.geometry = geometry;
    this.color = color;
  }
  static fromMessage(msg: Message.RobotLink, linkNames: string[]) {
    return new RobotLink(
      msg.n,
      {
        name: msg.jn,
        parentName: linkNames[msg.jp] || "",
        type: msg.jt,
        origin: { pos: msg.js, rot: msg.jr },
        angle: msg.ja,
      },
      {
        type: msg.gt,
        origin: { pos: msg.gs, rot: msg.gr },
        properties: msg.gp,
      },
      msg.c
    );
  }
  toMessage(linkNames: string[]): Message.RobotLink {
    return {
      n: this.name,
      jn: this.joint.name,
      jp: linkNames.indexOf(this.joint.parentName),
      jt: this.joint.type,
      js: this.joint.origin.pos,
      jr: this.joint.origin.rot,
      ja: this.joint.angle,
      gt: this.geometry.type,
      gs: this.geometry.origin.pos,
      gr: this.geometry.origin.rot,
      gp: this.geometry.properties,
      c: this.color,
    };
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
    const reqId = this.dataCheck().robotModelStore.addReq(
      this.member_,
      this.field_
    );
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
    const msgLinks = this.dataCheck().robotModelStore.getRecv(
      this.member_,
      this.field_
    );
    if (msgLinks === null) {
      return null;
    } else {
      const retLinks: RobotLink[] = [];
      const linkNames: string[] = [];
      for (const ln of msgLinks) {
        retLinks.push(RobotLink.fromMessage(ln, linkNames));
        linkNames.push(ln.n);
      }
      return retLinks;
    }
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

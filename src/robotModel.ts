import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";
import { multiply } from "./math.js";
import { Transform } from "./transform.js";
import { Geometry } from "./canvas3d.js";

export const robotJointType = {
  fixedAbsolute: 0,
  fixed: 1,
  rotational: 2,
  prismatic: 3,
} as const;
export interface RobotJoint {
  name: string;
  /**
   * 親linkの名前
   */
  parentName: string;
  type: number;
  /**
   * 親linkの座標系でこのjointの位置(=このlinkの座標系の原点)
   */
  origin: Transform;
  angle: number;
}
export class RobotLink {
  name: string;
  joint: RobotJoint;
  geometry: Geometry;
  color: number;
  private model?: RobotLink[];
  constructor(
    name: string,
    joint: RobotJoint,
    geometry: Geometry,
    color: number,
    model?: RobotLink[]
  ) {
    this.name = name;
    this.joint = joint;
    this.geometry = geometry;
    this.color = color;
    this.model = model;
  }
  get isBase() {
    return this.model === undefined || this.model[0] === this;
  }
  /**
   * ベースリンク座標系でのこのlinkの位置
   */
  get originFromBase(): Transform {
    return this.getOriginFromBase();
  }
  /**
   * ベースリンク座標系でのこのlinkの位置を計算する
   *
   * @param angles それぞれのjointの角度を指定 (省略した場合それぞれ0)
   *
   */
  getOriginFromBase(angles?: Map<string, number>): Transform {
    let jointTf = new Transform();
    const a = angles?.get(this.joint.name) || 0;
    switch (this.joint.type) {
      case robotJointType.rotational:
        jointTf = new Transform([0, 0, 0], [a - this.joint.angle, 0, 0]);
        break;
      case robotJointType.prismatic:
        jointTf = new Transform([0, 0, a - this.joint.angle], [0, 0, 0]);
        break;
    }

    const parentLink = this.model?.find(
      (ln) => ln.name === this.joint.parentName
    );
    if (parentLink === undefined) {
      return new Transform(
        multiply(this.joint.origin.tfMatrix, jointTf.tfMatrix)
      );
    } else {
      return new Transform(
        multiply(
          parentLink.getOriginFromBase(angles).tfMatrix,
          this.joint.origin.tfMatrix,
          jointTf.tfMatrix
        )
      );
    }
  }
  static fromMessage(msg: Message.RobotLink, model: RobotLink[]) {
    return new RobotLink(
      msg.n,
      {
        name: msg.jn,
        parentName: model[msg.jp]?.name || "",
        type: msg.jt,
        origin: new Transform(msg.js, msg.jr),
        angle: msg.ja,
      },
      new Geometry(msg.gt, msg.gp),
      msg.c,
      model
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
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Member.robotModel(), Member.robotModels(), Member.onRobotModelEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data);
    this.base_ = new Field(base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.robotModelChange(this.base_);
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
   * 値をリクエストする。
   */
  request() {
    const reqId = this.base_
      .dataCheck()
      .robotModelStore.addReq(this.base_.member_, this.base_.field_);
    if (reqId > 0) {
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.robotModelReq,
          M: this.base_.member_,
          f: this.base_.field_,
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
    const msgLinks = this.base_
      .dataCheck()
      .robotModelStore.getRecv(this.base_.member_, this.base_.field_);
    if (msgLinks === null) {
      return null;
    } else {
      const retLinks: RobotLink[] = [];
      for (const ln of msgLinks) {
        retLinks.push(RobotLink.fromMessage(ln, retLinks));
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
      .robotModelStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
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

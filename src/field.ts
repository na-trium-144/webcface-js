import { ClientData } from "./clientData.js";
import { Member } from "./member.js";
import { Value } from "./value.js";
import { Text } from "./text.js";
import { Log } from "./log.js";
import { Func } from "./func.js";
import { View } from "./view.js";
import { Image } from "./image.js";
import { RobotModel } from "./robotModel.js";
import { Canvas3D } from "./canvas3d.js";
import { Canvas2D } from "./canvas2d.js";

export class FieldBase {
  member_: string;
  field_: string;
  constructor(member: string, field = "") {
    this.member_ = member;
    this.field_ = field;
  }
}
export class Field extends FieldBase {
  data: ClientData | null;
  constructor(data: ClientData | null, member: string, field = "") {
    super(member, field);
    this.data = data;
  }
  dataCheck() {
    if (this.data == null) {
      throw new Error("ClientData is null");
    }
    return this.data;
  }
  setCheck() {
    if (this.data == null || this.data.selfMemberName !== this.member_) {
      throw new Error("Cannot set data to member other than self");
    }
    return this.data;
  }
  isValid() {
    return this.data != null;
  }

  /**
   * Memberを返す
   * @since ver1.10
   */
  get member() {
    return new Member(this);
  }
  /**
   * field名を返す
   * @since ver1.10
   */
  get name() {
    return this.field_;
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするField
   * @since ver1.10
   */
  child(field: string): Field {
    if (this.field_ === "") {
      return new Field(this.data, this.member_, field);
    }
    if (field === "") {
      return new Field(this.data, this.member_, this.field_);
    }
    return new Field(this.data, this.member_, this.field_ + "." + field);
  }

    /**
   * Valueオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  value(name: string) {
    return new Value(this.child(name));
  }
  /**
   * Textオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  text(name: string) {
    return new Text(this.child(name));
  }
  /**
   * RobotModelオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  robotModel(name: string) {
    return new RobotModel(this.child(name));
  }
  /**
   * Viewオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  view(name: string) {
    return new View(this.child(name));
  }
  /**
   * Canvas3Dオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  canvas3D(name: string) {
    return new Canvas3D(this.child(name));
  }
  /**
   * Canvas2Dオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  canvas2D(name: string) {
    return new Canvas2D(this.child(name));
  }
  /**
   * Imageオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  image(name: string) {
    return new Image(this.child(name));
  }
  /**
   * Funcオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   */
  func(name: string): Func{
    return new Func(this, name);
  }
  /**
   * Logオブジェクトを生成
   * @since ver1.10 (以前はMemberクラスのメソッド)
   *
   * ver1.9〜: nameを指定可能 (デフォルトは "default")
   */
  log(name: string = "default") {
    return new Log(this.child(name));
  }

}

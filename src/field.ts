import { ClientData, SyncDataStore2 } from "./clientData.js";
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
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするValueオブジェクトを生成
   * @since ver1.10
   */
  value(name: string) {
    return new Value(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするTextオブジェクトを生成
   * @since ver1.10
   */
  text(name: string) {
    return new Text(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするRobotModelオブジェクトを生成
   * @since ver1.10
   */
  robotModel(name: string) {
    return new RobotModel(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするViewオブジェクトを生成
   * @since ver1.10
   */
  view(name: string) {
    return new View(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするCanvas3Dオブジェクトを生成
   * @since ver1.10
   */
  canvas3D(name: string) {
    return new Canvas3D(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするCanvas2Dオブジェクトを生成
   * @since ver1.10
   */
  canvas2D(name: string) {
    return new Canvas2D(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするImageオブジェクトを生成
   * @since ver1.10
   */
  image(name: string) {
    return new Image(this.child(name));
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするFuncオブジェクトを生成
   * @since ver1.10
   */
  func(name: string): Func {
    return new Func(this, name);
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするLogオブジェクトを生成
   * @since ver1.10
   *
   * ver1.9〜: nameを指定可能 (デフォルトは "default")
   */
  log(name: string = "default") {
    return new Log(this.child(name));
  }

  private entries<T, U>(
    ret: string[],
    store: SyncDataStore2<T, U>,
    recurse: boolean
  ) {
    const keys = store.getEntry(this.member_);
    const prefix_with_sep = this.field_ ? this.field_ + "." : "";
    for (let f of keys) {
      if (!this.field_ || f.startsWith(prefix_with_sep)) {
        if (!recurse) {
          f = f.substring(0, f.indexOf(".", prefix_with_sep.length));
        }
        if (!ret.includes(f)) {
          ret.push(f);
        }
      }
    }
  }
  private hasEntries<T, U>(store: SyncDataStore2<T, U>) {
    const keys = store.getEntry(this.member_);
    const prefix_with_sep = this.field_ ? this.field_ + "." : "";
    for (const f of keys) {
      if (!this.field_ || f.startsWith(prefix_with_sep)) {
        return true;
      }
    }
    return false;
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているデータのリスト
   * @since ver1.10
   *
   * * データ型を問わずすべてのデータを列挙する。
   * * childrenRecurse() と異なり、
   * 名前にさらにピリオドが含まれる場合はその前までの名前を返す。
   * * 同名で複数のデータが存在する場合も1回のみカウントする。
   */
  children(): Field[] {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.valueStore, false);
    this.entries(ret, data.textStore, false);
    this.entries(ret, data.robotModelStore, false);
    this.entries(ret, data.funcStore, false);
    this.entries(ret, data.viewStore, false);
    this.entries(ret, data.canvas2DStore, false);
    this.entries(ret, data.canvas3DStore, false);
    this.entries(ret, data.imageStore, false);
    this.entries(ret, data.logStore, false);
    return ret.map((f) => new Field(data, this.member_, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているデータのリスト(再帰)
   * @since ver1.10
   *
   * * データ型を問わずすべてのデータを列挙する。
   * * 同名で複数のデータが存在する場合も1回のみカウントする。
   */
  childrenRecurse(): Field[] {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.valueStore, true);
    this.entries(ret, data.textStore, true);
    this.entries(ret, data.robotModelStore, true);
    this.entries(ret, data.funcStore, true);
    this.entries(ret, data.viewStore, true);
    this.entries(ret, data.canvas2DStore, true);
    this.entries(ret, data.canvas3DStore, true);
    this.entries(ret, data.imageStore, true);
    this.entries(ret, data.logStore, true);
    return ret.map((f) => new Field(data, this.member_, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているデータが存在するかどうかを返す
   * @since ver1.10
   */
  hasChildren(): boolean {
    const data = this.dataCheck();
    return (
      this.hasEntries(data.valueStore) ||
      this.hasEntries(data.textStore) ||
      this.hasEntries(data.robotModelStore) ||
      this.hasEntries(data.funcStore) ||
      this.hasEntries(data.viewStore) ||
      this.hasEntries(data.canvas2DStore) ||
      this.hasEntries(data.canvas3DStore) ||
      this.hasEntries(data.imageStore) ||
      this.hasEntries(data.logStore)
    );
  }

  /**
   * 「(thisの名前).(追加の名前)」で公開されているvalueのリストを返す。
   * @since ver1.10
   */
  valueEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.valueStore, true);
    return ret.map((f) => new Value(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているtextのリストを返す。
   * @since ver1.10
   */
  textEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.textStore, true);
    return ret.map((f) => new Text(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているrobotmodelのリストを返す。
   * @since ver1.10
   */
  robotModelEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.robotModelStore, true);
    return ret.map((f) => new RobotModel(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているviewのリストを返す。
   * @since ver1.10
   */
  viewEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.viewStore, true);
    return ret.map((f) => new View(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているcanvas2dのリストを返す。
   * @since ver1.10
   */
  canvas2DEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.canvas2DStore, true);
    return ret.map((f) => new Canvas2D(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているcanvas3dのリストを返す。
   * @since ver1.10
   */
  canvas3DEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.canvas3DStore, true);
    return ret.map((f) => new Canvas3D(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているfuncのリストを返す。
   * @since ver1.10
   */
  funcEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.funcStore, true);
    return ret.map((f) => new Func(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているlogのリストを返す。
   * @since ver1.10
   */
  logEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.logStore, true);
    return ret.map((f) => new Log(this, f));
  }
  /**
   * 「(thisの名前).(追加の名前)」で公開されているimageのリストを返す。
   * @since ver1.10
   */
  imageEntries() {
    const ret: string[] = [];
    const data = this.dataCheck();
    this.entries(ret, data.imageStore, true);
    return ret.map((f) => new Image(this, f));
  }
}

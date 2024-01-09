import { Transform, Point } from "./transform.js";
import { FieldBase, Field } from "./field.js";
import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import { RobotModel } from "./robotModel.js";

export const geometryType = {
  none: 0,
  line: 1,
  plane: 2,
  box: 3,
  circle: 4,
  cylinder: 5,
  sphere: 6,
} as const;

export class Geometry {
  type: number;
  properties: number[];
  constructor(type: number, properties: number[]) {
    this.type = type;
    this.properties = properties;
  }
  get asLine(): Geometry & { begin: Point; end: Point } {
    if (this.properties.length === 6) {
      return {
        ...this,
        begin: new Point(this.properties.slice(0, 3)),
        end: new Point(this.properties.slice(3, 6)),
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
  get asPlane(): Geometry & {
    origin: Transform;
    width: number;
    height: number;
  } {
    if (this.properties.length === 8) {
      return {
        ...this,
        origin: new Transform(
          this.properties.slice(0, 3),
          this.properties.slice(3, 6)
        ),
        width: this.properties[6],
        height: this.properties[7],
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
  get asBox(): Geometry & { vertex1: Point; vertex2: Point } {
    if (this.properties.length === 6) {
      return {
        ...this,
        vertex1: new Point(this.properties.slice(0, 3)),
        vertex2: new Point(this.properties.slice(3, 6)),
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
  get asCircle(): Geometry & {
    origin: Transform;
    radius: number;
  } {
    if (this.properties.length === 7) {
      return {
        ...this,
        origin: new Transform(
          this.properties.slice(0, 3),
          this.properties.slice(3, 6)
        ),
        radius: this.properties[6],
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
  get asCylinder(): Geometry & {
    origin: Transform;
    radius: number;
    length: number;
  } {
    if (this.properties.length === 8) {
      return {
        ...this,
        origin: new Transform(
          this.properties.slice(0, 3),
          this.properties.slice(3, 6)
        ),
        radius: this.properties[6],
        length: this.properties[7],
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
  get asSphere(): Geometry & {
    origin: Point;
    radius: number;
  } {
    if (this.properties.length === 4) {
      return {
        ...this,
        origin: new Point(this.properties.slice(0, 3)),
        radius: this.properties[3],
      };
    } else {
      throw new Error("number of properties does not match");
    }
  }
}

export const geometries = {
  line: (begin: Point, end: Point) =>
    new Geometry(geometryType.line, [
      begin.pos[0],
      begin.pos[1],
      begin.pos[2],
      end.pos[0],
      end.pos[1],
      end.pos[2],
    ]),
  plane: (origin: Transform, width: number, height: number) =>
    new Geometry(geometryType.plane, [
      origin.pos[0],
      origin.pos[1],
      origin.pos[2],
      origin.rot[0],
      origin.rot[1],
      origin.rot[2],
      width,
      height,
    ]),
  box: (vertex1: Point, vertex2: Point) =>
    new Geometry(geometryType.box, [
      vertex1.pos[0],
      vertex1.pos[1],
      vertex1.pos[2],
      vertex2.pos[0],
      vertex2.pos[1],
      vertex2.pos[2],
    ]),
  circle: (origin: Transform, radius: number) =>
    new Geometry(geometryType.circle, [
      origin.pos[0],
      origin.pos[1],
      origin.pos[2],
      origin.rot[0],
      origin.rot[1],
      origin.rot[2],
      radius,
    ]),
  cylinder: (origin: Transform, radius: number, length: number) =>
    new Geometry(geometryType.cylinder, [
      origin.pos[0],
      origin.pos[1],
      origin.pos[2],
      origin.rot[0],
      origin.rot[1],
      origin.rot[2],
      radius,
      length,
    ]),
  sphere: (origin: Point, radius: number) =>
    new Geometry(geometryType.sphere, [
      origin.pos[0],
      origin.pos[1],
      origin.pos[2],
      radius,
    ]),
};

export class Canvas3DComponent {
  private _type: number;
  private _origin: Transform;
  private _color: number;
  private _geometry: Geometry | null;
  private _fieldBase: FieldBase | null;
  private _angles: Map<number, number>;
  private data: ClientData | null;
  constructor(
    data: ClientData | null,
    type: number,
    origin: Transform,
    color: number,
    geometry: Geometry | null,
    fieldBase: FieldBase | null,
    angles: Map<number, number>
  ) {
    this.data = data;
    this._type = type;
    this._origin = origin;
    this._color = color;
    this._geometry = geometry;
    this._fieldBase = fieldBase;
    this._angles = angles;
  }
  get type() {
    return this._type;
  }
  get origin() {
    return this._origin;
  }
  get color() {
    return this._color;
  }
  get geometry(): Geometry {
    return this._geometry || new Geometry(0, []);
  }
  get robotModel() {
    if (this._fieldBase != null) {
      return new RobotModel(
        new Field(this.data, this._fieldBase.member_, this._fieldBase.field_)
      );
    } else {
      throw new Error("robotModel is null");
    }
  }
  get angles() {
    const anglesWithName = new Map<string, number>();
    const model = this.robotModel.get();
    for (const [li, v] of this._angles.entries()) {
      if (li >= 0 && li < model.length) {
        anglesWithName.set(model[li].joint.name, v);
      }
    }
    return anglesWithName;
  }
  static fromMessage(data: ClientData | null, msg: Message.Canvas3DComponent) {
    const a = new Map<number, number>();
    for (const [k, v] of Object.entries(msg.a)) {
      a.set(parseInt(k), v);
    }
    return new Canvas3DComponent(
      data,
      msg.t,
      new Transform(msg.op, msg.or),
      msg.c,
      msg.gt == null ? null : new Geometry(msg.gt, msg.gp),
      msg.fm == null || msg.ff == null ? null : new FieldBase(msg.fm, msg.ff),
      a
    );
  }
  toMessage(): Message.Canvas3DComponent {
    return {
      t: this._type,
      op: this._origin.pos,
      or: this._origin.rot,
      c: this._color,
      gt: this._geometry == null ? null : this._geometry.type,
      gp: this._geometry?.properties || [],
      fm: this._fieldBase == null ? null : this._fieldBase.member_,
      ff: this._fieldBase == null ? null : this._fieldBase.field_,
      a: Array.from(this._angles.entries()).reduce((obj, [k, v]) => {
        obj[k.toString()] = v;
        return obj;
      }, {} as { [key in string]: number }),
    };
  }
}

export type Canvas3DComponentProps =
  | [Geometry, Transform, number]
  | [RobotModel, Transform, { [key in string]: number }];

export const canvas3DComponentType = {
  geometry: 0,
  robotModel: 1,
} as const;

/**
 * Canvas3Dを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_17__canvas3d.html Canvas3Dのドキュメント}
 * を参照
 */
export class Canvas3D extends EventTarget<Canvas3D> {
  /**
   * このコンストラクタは直接使わず、
   * Member.canvas3D(), Member.canvas3DEntries(), Member.onCanvas3DEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.canvas3DChange(this);
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
   * @return 「(thisのフィールド名).(子フィールド名)」をフィールド名とするView
   */
  child(field: string): Canvas3D {
    return new Canvas3D(this, this.field_ + "." + field);
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.dataCheck().canvas3DStore.addReq(
      this.member_,
      this.field_
    );
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.canvas3DReq,
          M: this.member_,
          f: this.field_,
          i: reqId,
        },
      ]);
    }
  }

  /**
   * canvasのデータを返す
   */
  tryGet() {
    this.request();
    return (
      this.dataCheck()
        .canvas3DStore.getRecv(this.member_, this.field_)
        ?.map((v) => Canvas3DComponent.fromMessage(this.data, v)) || null
    );
  }
  /**
   * canvasのデータを返す
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
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
  /**
   * Canvas3DComponentのリストをセットする
   */
  set(data: (Canvas3DComponent | Canvas3DComponentProps)[]) {
    const data2: Message.Canvas3DComponent[] = [];
    for (let ci = 0; ci < data.length; ci++) {
      const c = data[ci];
      if (c instanceof Canvas3DComponent) {
        data2.push(c.toMessage());
      } else if (
        c[0] instanceof Geometry &&
        c[1] instanceof Transform &&
        typeof c[2] == "number"
      ) {
        data2.push(
          new Canvas3DComponent(
            this.data,
            canvas3DComponentType.geometry,
            c[1],
            c[2],
            c[0],
            null,
            new Map()
          ).toMessage()
        );
      } else if (
        c[0] instanceof RobotModel &&
        c[1] instanceof Transform &&
        typeof c[2] == "object"
      ) {
        const a = new Map<number, number>();
        const model = c[0].get();
        for (let ji = 0; ji < model.length; ji++) {
          const j = model[ji].joint;
          if (typeof c[2][j.name] === "number") {
            a.set(ji, c[2][j.name]);
          }
        }
        data2.push(
          new Canvas3DComponent(
            this.data,
            canvas3DComponentType.robotModel,
            c[1],
            0,
            null,
            c[0],
            a
          ).toMessage()
        );
      } else {
        throw new Error(`Type error in Canvas3D.set() at index=${ci}`);
      }
    }
    this.setCheck().canvas3DStore.setSend(this.field_, data2);
    this.triggerEvent(this);
  }
}

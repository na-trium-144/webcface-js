import { Transform, Point } from "./transform.js";
import { FieldBase, Field } from "./field.js";
import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import { RobotModel } from "./robotModel.js";
import {
  Canvas2DComponent,
  Canvas2DComponentOption,
  canvas2DComponentType,
} from "./canvas2d.js";

export const geometryType = {
  none: 0,
  line: 1,
  plane: 2,
  box: 3,
  circle: 4,
  cylinder: 5,
  sphere: 6,
  polygon: 7,
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
  get asRect() {
    return this.asPlane;
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
  get asPolygon(): Geometry & { points: Point[] } {
    if (this.properties.length > 0 && this.properties.length % 3 == 0) {
      const points: Point[] = [];
      for (let i = 0; i < this.properties.length; i += 3) {
        points.push(new Point(this.properties.slice(i, i + 3)));
      }
      return { ...this, points };
    } else {
      throw new Error("number of properties does not match");
    }
  }
}

export const geometries = {
  line: (
    begin: Point,
    end: Point,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.line,
      [
        begin.pos[0],
        begin.pos[1],
        begin.pos[2],
        end.pos[0],
        end.pos[1],
        end.pos[2],
      ],
      options
    ),
  plane: (
    origin: Transform,
    width: number,
    height: number,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.plane,
      [
        origin.pos[0],
        origin.pos[1],
        origin.pos[2],
        origin.rot[0],
        origin.rot[1],
        origin.rot[2],
        width,
        height,
      ],
      options
    ),
  box: (
    vertex1: Point,
    vertex2: Point,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.box,
      [
        vertex1.pos[0],
        vertex1.pos[1],
        vertex1.pos[2],
        vertex2.pos[0],
        vertex2.pos[1],
        vertex2.pos[2],
      ],
      options
    ),
  circle: (
    origin: Transform,
    radius: number,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.circle,
      [
        origin.pos[0],
        origin.pos[1],
        origin.pos[2],
        origin.rot[0],
        origin.rot[1],
        origin.rot[2],
        radius,
      ],
      options
    ),
  cylinder: (
    origin: Transform,
    radius: number,
    length: number,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.cylinder,
      [
        origin.pos[0],
        origin.pos[1],
        origin.pos[2],
        origin.rot[0],
        origin.rot[1],
        origin.rot[2],
        radius,
        length,
      ],
      options
    ),
  sphere: (
    origin: Point,
    radius: number,
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) =>
    new CanvasCommonComponent(
      geometryType.sphere,
      [origin.pos[0], origin.pos[1], origin.pos[2], radius],
      options
    ),
};

export class CanvasCommonComponent extends Geometry {
  private _options: Canvas2DComponentOption & Canvas3DComponentOption;
  constructor(
    type: number,
    properties: number[],
    options?: Canvas2DComponentOption & Canvas3DComponentOption
  ) {
    super(type, properties);
    this._options = options || {};
  }
  to2() {
    return new Canvas2DComponent(
      null,
      canvas2DComponentType.geometry,
      this,
      this._options
    );
  }
  to3() {
    return new Canvas3DComponent(
      null,
      canvas3DComponentType.geometry,
      this,
      null,
      this._options
    );
  }
}

interface Canvas3DComponentOption {
  origin?: Transform;
  color?: number;
  angles?: Map<number, number> | object;
}
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
    geometry: Geometry | null,
    fieldBase: FieldBase | null,
    options?: Canvas3DComponentOption
  ) {
    this.data = data;
    this._type = type;
    this._origin = options?.origin || new Transform();
    this._color = options?.color || 0;
    this._geometry = geometry;
    this._fieldBase = fieldBase;
    if (options?.angles instanceof Map) {
      this._angles = options.angles;
    } else if (typeof options?.angles === "object") {
      this._angles = new Map<number, number>(
        Object.entries(options.angles).map(([k, v]) => [Number(k), Number(v)])
      );
    } else {
      this._angles = new Map<number, number>();
    }
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
  to3() {
    return this;
  }
  static fromMessage(data: ClientData | null, msg: Message.Canvas3DComponent) {
    const a = new Map<number, number>();
    for (const [k, v] of Object.entries(msg.a)) {
      a.set(parseInt(k), v);
    }
    return new Canvas3DComponent(
      data,
      msg.t,
      msg.gt == null ? null : new Geometry(msg.gt, msg.gp),
      msg.fm == null || msg.ff == null ? null : new FieldBase(msg.fm, msg.ff),
      {
        origin: new Transform(msg.op, msg.or),
        color: msg.c,
        angles: a,
      }
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
  set(data: (Canvas3DComponent | CanvasCommonComponent)[]) {
    this.setCheck().canvas3DStore.setSend(
      this.field_,
      data.map((c) => c.to3().toMessage())
    );
    this.triggerEvent(this);
  }
}

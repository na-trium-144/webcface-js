import { Field } from "./field.js";
import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import { Geometry } from "./canvas3d.js";

export class Canvas2DComponent {
  private _type: number;
  private _color: number;
  private _fill: number;
  private _stroke_width: number;
  private _geometry: Geometry | null;
  private data: ClientData | null;
  constructor(
    data: ClientData | null,
    type: number,
    color: number,
    fill: number,
    strokeWidth: number,
    geometry: Geometry | null
  ) {
    this.data = data;
    this._type = type;
    this._color = color;
    this._fill = fill;
    this._stroke_width = strokeWidth;
    this._geometry = geometry;
  }
  get type() {
    return this._type;
  }
  get color() {
    return this._color;
  }
  get fill() {
    return this._fill;
  }
  get strokeWidth() {
    return this._stroke_width;
  }
  get geometry(): Geometry {
    return this._geometry || new Geometry(0, []);
  }
  static fromMessage(data: ClientData | null, msg: Message.Canvas2DComponent) {
    return new Canvas2DComponent(
      data,
      msg.t,
      msg.c,
      msg.f,
      msg.s,
      msg.gt == null ? null : new Geometry(msg.gt, msg.gp)
    );
  }
  toMessage(): Message.Canvas2DComponent {
    return {
      t: this._type,
      c: this._color,
      f: this._fill,
      s: this._stroke_width,
      gt: this._geometry == null ? null : this._geometry.type,
      gp: this._geometry?.properties || [],
    };
  }
}

export type Canvas2DComponentProps = [Geometry, number, number, number];

export const canvas2DComponentType = {
  geometry: 0,
} as const;

/**
 * Canvas2Dを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_14__canvas2d.html Canvas2Dのドキュメント}
 * を参照
 */
export class Canvas2D extends EventTarget<Canvas2D> {
  private _width: number;
  private _height: number;
  /**
   * このコンストラクタは直接使わず、
   * Member.canvas2D(), Member.canvas2DEntries(), Member.onCanvas2DEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.canvas2DChange(this);
    this._width = 0;
    this._height = 0;
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
  child(field: string): Canvas2D {
    return new Canvas2D(this, this.field_ + "." + field);
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.dataCheck().canvas2DStore.addReq(
      this.member_,
      this.field_
    );
    if (reqId > 0) {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.canvas2DReq,
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
        .canvas2DStore.getRecv(this.member_, this.field_)
        ?.components.map((v) => Canvas2DComponent.fromMessage(this.data, v)) ||
      null
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
   * Canvas2DComponentのリストをセットする
   *
   * todo
   *
   */
  set(data: (Canvas2DComponent | Canvas2DComponentProps)[]) {
    const data2: Message.Canvas2DComponent[] = [];
    for (let ci = 0; ci < data.length; ci++) {
      const c = data[ci];
      if (c instanceof Canvas2DComponent) {
        data2.push(c.toMessage());
      } else {
        throw new Error(`Type error in Canvas2D.set() at index=${ci}`);
      }
    }
    this.setCheck().canvas2DStore.setSend(this.field_, {
      width: this._width,
      height: this._height,
      components: data2,
    });
    this.triggerEvent(this);
  }
}

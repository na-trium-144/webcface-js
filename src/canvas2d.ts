import { Field } from "./field.js";
import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import { TemporalGeometry, Geometry } from "./canvas3d.js";
import { Transform } from "./transform.js";
import { Func } from "./func.js";
import { IdBase } from "./view.js";
import { FieldBase } from "./fieldBase.js";
import { FuncCallback } from "./funcBase.js";

export interface Canvas2DComponentOption {
  origin?: Transform;
  color?: number;
  fillColor?: number;
  strokeWidth?: number;
  onClick?: FieldBase | Func | FuncCallback;
}
export class Canvas2DComponent extends IdBase {
  private _type: number;
  private _origin: Transform;
  private _color: number;
  private _fill: number;
  private _stroke_width: number;
  private _geometry: Geometry | null;
  private _on_click: FieldBase | null;
  private _on_click_tmp: FuncCallback | null;
  private _text: string;
  private data: ClientData | null;
  constructor(
    data: ClientData | null,
    type: number,
    geometry: Geometry | null,
    text: string,
    options?: Canvas2DComponentOption
  ) {
    super();
    this.data = data;
    this._type = type;
    this._origin = options?.origin || new Transform();
    this._color = options?.color || 0;
    this._fill = options?.fillColor || 0;
    this._stroke_width = options?.strokeWidth || 0;
    this._geometry = geometry || null;
    this._on_click = null;
    this._on_click_tmp = null;
    this._text = text;
    if (options?.onClick !== undefined) {
      if (options.onClick instanceof FieldBase) {
        this._on_click = options.onClick;
      } else if (options.onClick instanceof Func) {
        this._on_click = options.onClick.base_;
      } else {
        this._on_click_tmp = options.onClick;
      }
    }
  }
  /**
   * AnonymousFuncをFuncオブジェクトにロックする
   */
  lockTmp(data: ClientData, canvasName: string, idxNext: Map<number, number>) {
    this.initIdx(idxNext, this.type);
    if (this._on_click_tmp) {
      const f = new Func(
        new Field(data, data.selfMemberName, `..c2${canvasName}/${this.id}`)
      );
      f.set(this._on_click_tmp);
      this._on_click = f.base_;
    }
    return this;
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
  get fill() {
    return this._fill;
  }
  get fillColor() {
    return this._fill;
  }
  get strokeWidth() {
    return this._stroke_width;
  }
  get textSize() {
    return this._stroke_width; // strokeWidthと共通
  }
  get geometry(): Geometry {
    return this._geometry || new Geometry(0, []);
  }
  get text(): string {
    return this._text;
  }
  /**
   * クリック時に実行する関数
   */
  get onClick(): Func | null {
    if (this._on_click !== null) {
      if (this.data !== null) {
        return new Func(
          new Field(this.data, this._on_click.member_, this._on_click.field_)
        );
      } else {
        throw new Error("cannot get onClick: ClientData not set");
      }
    } else {
      return null;
    }
  }
  /**
   * TemporalGeometry.to2() との互換性のため
   */
  to2() {
    return this;
  }
  static fromMessage(
    data: ClientData | null,
    msg: Message.Canvas2DComponent,
    idxNext: Map<number, number>
  ) {
    const c2 = new Canvas2DComponent(
      data,
      msg.t,
      msg.gt == null ? null : new Geometry(msg.gt, msg.gp),
      msg.x || "",
      {
        origin: new Transform(msg.op, msg.or),
        color: msg.c,
        fillColor: msg.f,
        strokeWidth: msg.s,
        onClick:
          msg.L != null && msg.l != null
            ? new FieldBase(msg.L, msg.l)
            : undefined,
      }
    );
    c2.initIdx(idxNext, msg.t);
    return c2;
  }
  toMessage(): Message.Canvas2DComponent {
    return {
      t: this._type,
      op: this._origin.pos.slice(0, 2),
      or: this._origin.rot[0],
      c: this._color,
      f: this._fill,
      s: this._stroke_width,
      gt: this._geometry == null ? null : this._geometry.type,
      gp: this._geometry?.properties || [],
      L: this._on_click === null ? null : this._on_click.member_,
      l: this._on_click === null ? null : this._on_click.field_,
      x: this._text,
    };
  }
}

export const canvas2DComponentType = {
  geometry: 0,
  text: 3,
} as const;

/**
 * Canvas2Dを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_14__canvas2d.html Canvas2Dのドキュメント}
 * を参照
 */
export class Canvas2D extends EventTarget<Canvas2D> {
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Member.canvas2D(), Member.canvas2DEntries(), Member.onCanvas2DEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data);
    this.base_ = new Field(base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.canvas2DChange(this.base_);
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
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするCanvas2D
   */
  child(field: string): Canvas2D {
    return new Canvas2D(this.base_.child(field));
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.base_
      .dataCheck()
      .canvas2DStore.addReq(this.base_.member_, this.base_.field_);
    if (reqId > 0) {
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.canvas2DReq,
          M: this.base_.member_,
          f: this.base_.field_,
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
    const idxNext = new Map<number, number>();
    return (
      this.base_
        .dataCheck()
        .canvas2DStore.getRecv(this.base_.member_, this.base_.field_)
        ?.components.map((v) =>
          Canvas2DComponent.fromMessage(this.base_.data, v, idxNext)
        ) || null
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
  get width() {
    return (
      this.base_
        .dataCheck()
        .canvas2DStore.getRecv(this.base_.member_, this.base_.field_)?.width ||
      null
    );
  }
  get height() {
    return (
      this.base_
        .dataCheck()
        .canvas2DStore.getRecv(this.base_.member_, this.base_.field_)?.height ||
      null
    );
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
      .canvas2DStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
  }
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
  /**
   * Canvas2DComponentのリストをセットする
   *
   */
  set(
    width: number,
    height: number,
    data: (Canvas2DComponent | TemporalGeometry)[]
  ) {
    const idxNext = new Map<number, number>();
    this.base_.setCheck().canvas2DStore.setSend(this.base_.field_, {
      width,
      height,
      components: data.map((c) =>
        c
          .to2()
          .lockTmp(this.base_.dataCheck(), this.base_.field_, idxNext)
          .toMessage()
      ),
    });
    this.triggerEvent(this);
  }
}

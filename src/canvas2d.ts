import { Field, FieldBase } from "./field.js";
import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import { TemporalGeometry, Geometry } from "./canvas3d.js";
import { Transform } from "./transform.js";
import { Func, AnonymousFunc, FuncCallback } from "./func.js";

export interface Canvas2DComponentOption {
  origin?: Transform;
  color?: number;
  fillColor?: number;
  strokeWidth?: number;
  onClick?: FieldBase | AnonymousFunc | FuncCallback;
}
export class Canvas2DComponent {
  private _type: number;
  private _origin: Transform;
  private _color: number;
  private _fill: number;
  private _stroke_width: number;
  private _geometry: Geometry | null;
  private _on_click: FieldBase | null;
  private _on_click_tmp: AnonymousFunc | null;
  private _text: string;
  private data: ClientData | null;
  constructor(
    data: ClientData | null,
    type: number,
    geometry: Geometry | null,
    text: string,
    options?: Canvas2DComponentOption
  ) {
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
      if (options.onClick instanceof AnonymousFunc) {
        this._on_click_tmp = options.onClick;
      } else if (options.onClick instanceof FieldBase) {
        this._on_click = options.onClick;
      } else {
        this._on_click_tmp = new AnonymousFunc(
          null,
          options.onClick,
          Message.valType.none_,
          []
        );
      }
    }
  }
  /**
   * AnonymousFuncをFuncオブジェクトにロックする
   */
  lockTmp(data: ClientData, canvasName: string, funcIdInc: () => number) {
    if (this._on_click_tmp) {
      const f = new Func(
        new Field(data, data.selfMemberName, `..c2${canvasName}.${funcIdInc()}`)
      );
      this._on_click_tmp.lockTo(f);
      this._on_click = f;
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
  static fromMessage(data: ClientData | null, msg: Message.Canvas2DComponent) {
    return new Canvas2DComponent(
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
  /**
   * このコンストラクタは直接使わず、
   * Member.canvas2D(), Member.canvas2DEntries(), Member.onCanvas2DEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.canvas2DChange(this);
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
  get width() {
    return (
      this.dataCheck().canvas2DStore.getRecv(this.member_, this.field_)
        ?.width || null
    );
  }
  get height() {
    return (
      this.dataCheck().canvas2DStore.getRecv(this.member_, this.field_)
        ?.height || null
    );
  }
  /**
   * Memberのsyncの時刻を返す
   *
   * @deprecated ver1.6〜 Member.syncTime() に移行
   */
  time() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
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
    let funcId = 0;
    this.setCheck().canvas2DStore.setSend(this.field_, {
      width,
      height,
      components: data.map((c) =>
        c
          .to2()
          .lockTmp(this.dataCheck(), this.field_, () => funcId++)
          .toMessage()
      ),
    });
    this.triggerEvent(this);
  }
}

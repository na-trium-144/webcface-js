import isEqual from "lodash.isequal";
import { Val, FuncCallback } from "./funcBase.js";
import { Func } from "./func.js";
import { Member } from "./member.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import { FieldBase } from "./fieldBase.js";
import { Text, InputRef } from "./text.js";
import * as Message from "./message.js";

export const viewComponentTypes = {
  text: 0,
  newLine: 1,
  button: 2,
  textInput: 3,
  decimalInput: 4,
  numberInput: 5,
  toggleInput: 6,
  selectInput: 7,
  sliderInput: 8,
  checkInput: 9,
} as const;
export const viewColor = {
  inherit: 0,
  black: 1,
  white: 2,
  // slate : 3,
  gray: 4,
  // zinc : 5,
  // neutral : 6,
  // stone : 7,
  red: 8,
  orange: 9,
  // amber : 10,
  yellow: 11,
  // lime : 12,
  green: 13,
  // emerald : 14,
  teal: 15,
  cyan: 16,
  // sky : 17,
  blue: 18,
  indigo: 19,
  // violet : 20,
  purple: 21,
  // fuchsia : 22,
  pink: 23,
  // rose : 24,
} as const;

export function getDiff<T>(current: T[], prev: T[]) {
  const diff: { [key in string]: T } = {};
  for (let i = 0; i < current.length; i++) {
    if (!isEqual(current[i], prev[i])) {
      diff[i] = current[i];
    }
  }
  return diff;
}
export function mergeDiff<T>(
  diff: { [key in string]: T },
  size: number,
  prev: T[]
) {
  for (let i = 0; i < size; i++) {
    if (diff[i] !== undefined) {
      if (prev.length <= i) {
        prev.push(diff[i]);
      } else {
        prev[i] = diff[i];
      }
    }
  }
  while (prev.length > size) {
    prev.pop();
  }
}

export const viewComponents = {
  /**
   * newLineコンポーネント
   */
  newLine: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.newLine, null, options),
  /**
   * textコンポーネント
   */
  text: (t: string, options?: ViewComponentOption) =>
    new ViewComponent(t, null, options),
  /**
   * buttonコンポーネント
   */
  button: (t: string, f: Func | FuncCallback, options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.button, null, {
      ...options,
      text: t,
      onClick: f,
    }),
  textInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.textInput, null, options),
  decimalInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.decimalInput, null, options),
  numberInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.numberInput, null, options),
  selectInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.selectInput, null, options),
  toggleInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.toggleInput, null, options),
  sliderInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.sliderInput, null, options),
  checkInput: (options?: ViewComponentOption) =>
    new ViewComponent(viewComponentTypes.checkInput, null, options),
} as const;

interface ViewComponentOption {
  text?: string;
  onClick?: Func | FuncCallback;
  onChange?: FuncCallback;
  bind?: InputRef;
  textColor?: number;
  bgColor?: number;
  init?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  option?: string[] | number[];
  width?: number;
  height?: number;
}

/**
 * ViewComponent, Canvas2DComponentのid管理
 */
export class IdBase {
  private idxForType: number = 0;
  initIdx(idxNext: Map<number, number>, type: number) {
    this.idxForType = idxNext.get(type) || 0;
    idxNext.set(type, this.idxForType + 1);
  }
  get type(): number {
    throw new Error("undefined type");
  }
  get id() {
    return `..${this.type}.${this.idxForType}`;
  }
}
/**
 * Viewのコンポーネントを表すクラス
 */
export class ViewComponent extends IdBase {
  type_ = 0;
  text_ = "";
  on_click_: FieldBase | null = null;
  on_click_tmp_: FuncCallback | null = null;
  on_change_tmp_: FuncCallback | null = null;
  text_ref_: FieldBase | null = null;
  text_ref_tmp_: InputRef | null = null;
  text_color_ = 0;
  bg_color_ = 0;
  init_: string | number | boolean | null = null;
  min_: number | null = null;
  max_: number | null = null;
  step_: number | null = null;
  option_: string[] | number[] = [];
  width_ = 0;
  height_ = 0;
  data: ClientData | null = null;
  /**
   * 引数に文字列を入れるとtextコンポーネントを作成できる
   *
   * それ以外の場合、viewComponents にある各コンポーネントの生成関数を使用してください
   *
   * @param arg numberのときtype, stringのときtextになる Message.ViewComponentの場合展開
   * @param data ClientDataが参照できる場合は指定
   * @param options その他のプロパティ
   */
  constructor(
    arg: number | string | Message.ViewComponent,
    data: ClientData | null = null,
    options?: ViewComponentOption,
    idxNext?: Map<number, number>
  ) {
    super();
    if (typeof arg === "number") {
      this.type_ = arg;
    } else if (typeof arg === "string") {
      this.type_ = viewComponentTypes.text;
      this.text_ = arg;
    } else {
      if (idxNext) {
        this.initIdx(idxNext, arg.t);
      }
      this.type_ = arg.t;
      this.text_ = arg.x;
      this.on_click_ =
        arg.L !== null && arg.l !== null ? new FieldBase(arg.L, arg.l) : null;
      this.text_color_ = arg.c;
      this.bg_color_ = arg.b;
      this.text_ref_ =
        arg.R != null && arg.r != null ? new FieldBase(arg.R, arg.r) : null;
      this.min_ = arg.im != null ? arg.im : null;
      this.max_ = arg.ix != null ? arg.ix : null;
      this.step_ = arg.is != null ? arg.is : null;
      this.option_ = arg.io != null ? arg.io : [];
      this.width_ = arg.w || 0;
      this.height_ = arg.h || 0;
    }
    this.data = data;
    if (options?.text !== undefined) {
      this.text_ = options?.text;
    }
    if (options?.onClick !== undefined) {
      if (options.onClick instanceof Func) {
        this.on_click_ = options.onClick.base_;
      } else {
        this.on_click_tmp_ = options.onClick;
      }
    }
    if (options?.onChange !== undefined) {
      const ref = new InputRef();
      const func = options.onChange;
      this.on_change_tmp_ = (val: Val) => {
        ref.state.set(val);
        return func(val);
      };
      this.text_ref_tmp_ = ref;
    }
    if (options?.bind !== undefined) {
      const ref = options.bind;
      this.on_change_tmp_ = (val: Val) => {
        ref.state.set(val);
      };
      this.text_ref_tmp_ = ref;
    }
    if (options?.textColor !== undefined) {
      this.text_color_ = options.textColor;
    }
    if (options?.bgColor !== undefined) {
      this.bg_color_ = options.bgColor;
    }
    if (options?.init !== undefined) {
      this.init_ = options.init;
    }
    if (options?.min !== undefined) {
      this.min_ = options.min;
    }
    if (options?.max !== undefined) {
      this.max_ = options.max;
    }
    if (options?.step !== undefined) {
      this.step_ = options.step;
    }
    if (options?.option !== undefined) {
      this.option_ = options.option;
    }
    if (options?.width !== undefined) {
      this.width_ = options.width;
    }
    if (options?.height !== undefined) {
      this.height_ = options.height;
    }
  }
  /**
   * AnonymousFuncをFuncオブジェクトにロックする
   *
   * funcIdIncは呼ぶたびに1増加
   */
  lockTmp(data: ClientData, viewName: string, idxNext: Map<number, number>) {
    this.initIdx(idxNext, this.type);
    if (this.on_click_tmp_) {
      const f = new Func(
        new Field(data, data.selfMemberName, `..v${viewName}/${this.id}`)
      );
      f.set(this.on_click_tmp_);
      this.on_click_ = f.base_;
    }
    if (this.on_change_tmp_) {
      const f = new Func(
        new Field(data, data.selfMemberName, `..v${viewName}/${this.id}`)
      );
      f.set(this.on_change_tmp_, Message.valType.none_, [{}]);
      this.on_click_ = f.base_;
    }
    if (this.text_ref_tmp_) {
      const t = new Text(
        new Field(data, data.selfMemberName, `..ir${viewName}/${this.id}`)
      );
      this.text_ref_tmp_.state = t;
      if (this.init_ != null && t.tryGet() == null) {
        t.set(this.init_);
      }
      this.text_ref_ = t.base_;
    }
    return this;
  }
  /**
   * Messageに変換
   */
  toMessage(): Message.ViewComponent {
    return {
      t: this.type,
      x: this.text,
      L: this.on_click_ === null ? null : this.on_click_.member_,
      l: this.on_click_ === null ? null : this.on_click_.field_,
      c: this.text_color_,
      b: this.bg_color_,
      R: this.text_ref_ === null ? null : this.text_ref_.member_,
      r: this.text_ref_ === null ? null : this.text_ref_.field_,
      im: this.min_,
      ix: this.max_,
      is: this.step_,
      io: this.option_,
      w: this.width_,
      h: this.height_,
    };
  }
  /**
   * コンポーネントの種類
   *
   * viewComponentTypesに定義されている定数を使う
   */
  get type() {
    return this.type_;
  }
  /**
   * 表示する文字列
   */
  get text() {
    return this.text_;
  }
  /**
   * クリック時に実行する関数
   */
  get onClick(): Func | null {
    if (this.on_click_ !== null) {
      if (this.data !== null) {
        return new Func(
          new Field(this.data, this.on_click_.member_, this.on_click_.field_)
        );
      } else {
        throw new Error("cannot get onClick: ClientData not set");
      }
    } else {
      return null;
    }
  }
  /**
   * 文字の色
   *
   * viewColorに定義されている定数を使う
   */
  get textColor() {
    return this.text_color_;
  }
  /**
   * 背景の色
   *
   * viewColorに定義されている定数を使う
   */
  get bgColor() {
    return this.bg_color_;
  }
  /**
   * バインドされたinputの値
   *
   * bind.getAny() で値を取得したり、
   * bind.on(...) で値が変化したときのコールバックを設定して使う。
   */
  get bind(): Text | null {
    if (this.text_ref_ !== null) {
      if (this.data !== null) {
        return new Text(
          new Field(this.data, this.text_ref_.member_, this.text_ref_.field_)
        );
      } else {
        throw new Error("cannot get bindValue: ClientData not set");
      }
    }
    return null;
  }
  /**
   * 値の変化時に実行する関数を取得
   *
   * 取得してそれを呼び出すには onChange?.runAsync(値) のようにする
   *
   * 内部データとしてはonClickと共通
   */
  get onChange(): Func | null {
    return this.onClick;
  }
  /**
   * inputの最小値 or 最小文字数
   */
  get min() {
    return this.min_;
  }
  /**
   * inputの最大値 or 最大文字数
   */
  get max() {
    return this.max_;
  }
  /**
   * inputの刻み幅
   */
  get step() {
    return this.step_;
  }
  /**
   * inputの選択肢
   */
  get option() {
    return this.option_;
  }
  /**
   * 要素の幅
   * @since ver1.10
   */
  get width() {
    return this.width_;
  }
  /**
   * 要素の高さ
   * @since ver1.10
   */
  get height() {
    return this.height_;
  }
}

/**
 * Viewを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_13__view.html Viewのドキュメント}
 * を参照
 */
export class View extends EventTarget<View> {
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Member.view(), Member.views(), Member.onViewEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data);
    this.base_ = new Field(base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.viewChange(this.base_);
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
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするView
   */
  child(field: string): View {
    return new View(this.base_.child(field));
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.base_
      .dataCheck()
      .viewStore.addReq(this.base_.member_, this.base_.field_);
    if (reqId > 0) {
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.viewReq,
          M: this.base_.member_,
          f: this.base_.field_,
          i: reqId,
        },
      ]);
    }
  }

  /**
   * Viewを返す
   */
  tryGet() {
    this.request();
    const idxNext = new Map<number, number>();
    return (
      this.base_
        .dataCheck()
        .viewStore.getRecv(this.base_.member_, this.base_.field_)
        ?.map(
          (v) => new ViewComponent(v, this.base_.data, undefined, idxNext)
        ) || null
    );
  }
  /**
   * Viewを返す
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
      .viewStore.getEntry(this.base_.member_)
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
   * ViewComponentのリストをセットする
   */
  set(data: (ViewComponent | string | number | boolean)[]) {
    const data2: ViewComponent[] = [];
    for (let c of data) {
      if (c instanceof ViewComponent) {
        data2.push(c);
      } else if (typeof c === "string") {
        while (c.includes("\n")) {
          const s = c.slice(0, c.indexOf("\n"));
          data2.push(viewComponents.text(s));
          data2.push(viewComponents.newLine());
          c = c.slice(c.indexOf("\n") + 1);
        }
        if (c !== "") {
          data2.push(viewComponents.text(c));
        }
      } else {
        data2.push(viewComponents.text(String(c)));
      }
    }
    const idxNext = new Map<number, number>();
    this.base_.setCheck().viewStore.setSend(
      this.base_.field_,
      data2.map((c) =>
        c
          .lockTmp(this.base_.dataCheck(), this.base_.field_, idxNext)
          .toMessage()
      )
    );
    this.triggerEvent(this);
  }
}

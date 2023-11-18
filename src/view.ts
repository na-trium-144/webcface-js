import * as Message from "./message.js";
import isEqual from "lodash.isequal";
import { Func, AnonymousFunc, FuncCallback } from "./func.js";
import { Member } from "./member.js";
import { ClientData } from "./clientData.js";
import { EventTarget, eventType } from "./event.js";
import { Field, FieldBase } from "./field.js";

export const viewComponentTypes = {
  text: 0,
  newLine: 1,
  button: 2,
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

export function getViewDiff(
  current: Message.ViewComponent[],
  prev: Message.ViewComponent[]
) {
  const diff: Message.ViewComponentsDiff = {};
  for (let i = 0; i < current.length; i++) {
    if (!isEqual(current[i], prev[i])) {
      diff[i] = current[i];
    }
  }
  return diff;
}
export function mergeViewDiff(
  diff: Message.ViewComponentsDiff,
  size: number,
  prev: Message.ViewComponent[]
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
  button: (
    t: string,
    f: Func | AnonymousFunc | FuncCallback,
    options?: ViewComponentOption
  ) => {
    const v = new ViewComponent(viewComponentTypes.button, null, {
      ...options,
      text: t,
      onClick: f,
    });
    return v;
  },
} as const;

interface ViewComponentOption {
  text?: string;
  onClick?: Func | AnonymousFunc | FuncCallback;
  textColor?: number;
  bgColor?: number;
}
/**
 * Viewのコンポーネントを表すクラス
 */
export class ViewComponent {
  type_ = 0;
  text_ = "";
  on_click_: FieldBase | null = null;
  on_click_tmp_: AnonymousFunc | null = null;
  text_color_ = 0;
  bg_color_ = 0;
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
    options?: ViewComponentOption
  ) {
    if (typeof arg === "number") {
      this.type_ = arg;
    } else if (typeof arg === "string") {
      this.type_ = viewComponentTypes.text;
      this.text_ = arg;
    } else {
      this.type_ = arg.t;
      this.text_ = arg.x;
      this.on_click_ =
        arg.L !== null && arg.l !== null ? new FieldBase(arg.L, arg.l) : null;
      this.text_color_ = arg.c;
      this.bg_color_ = arg.b;
    }
    this.data = data;
    if (options?.text !== undefined) {
      this.text_ = options?.text;
    }
    if (options?.onClick !== undefined) {
      if (options.onClick instanceof AnonymousFunc) {
        this.on_click_tmp_ = options.onClick;
      } else if (options.onClick instanceof Func) {
        this.on_click_ = options.onClick;
      } else {
        this.on_click_tmp_ = new AnonymousFunc(
          null,
          options.onClick,
          Message.valType.none_,
          []
        );
      }
    }
    if (options?.textColor !== undefined) {
      this.text_color_ = options.textColor;
    }
    if (options?.bgColor !== undefined) {
      this.bg_color_ = options.bgColor;
    }
  }
  /**
   * AnonymousFuncをFuncオブジェクトにロックする
   */
  lockTmp(data: ClientData, field: string) {
    if (this.on_click_tmp_) {
      const f = new Func(new Field(data, data.selfMemberName, field));
      this.on_click_tmp_.lockTo(f);
      f.hidden = true;
      this.on_click_ = f;
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
}

/**
 * Viewを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_13__view.html Viewのドキュメント}
 * を参照
 */
export class View extends EventTarget<View> {
  /**
   * このコンストラクタは直接使わず、
   * Member.view(), Member.views(), Member.onViewEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.viewChange(this);
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
  child(field: string): View {
    return new View(this, this.field_ + "." + field);
  }

  /**
   * Viewを返す
   */
  tryGet() {
    return (
      this.data.viewStore
        .getRecv(this.member_, this.field_)
        ?.map((v) => new ViewComponent(v, this.data)) || null
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
   * Memberのsyncの時刻を返す
   */
  time() {
    return this.data.syncTimeStore.getRecv(this.member_) || new Date(0);
  }
  /**
   * ViewComponentのリストをセットする
   */
  set(data: (ViewComponent | string | number | boolean)[]) {
    if (this.data.viewStore.isSelf(this.member_)) {
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
      this.data.viewStore.setSend(
        this.field_,
        data2.map((c, i) =>
          c.lockTmp(this.data, `${this.field_}_${i}`).toMessage()
        )
      );
      this.triggerEvent(this);
    } else {
      throw new Error("Cannot set data to member other than self");
    }
  }
}
import { Member } from "./member.js";
import { valType } from "./message.js";
import { Field, FieldBase } from "./field.js";
import * as Message from "./message.js";

export type Val = string | number | boolean;

export interface FuncInfo {
  returnType: number;
  args: Arg[];
  funcImpl?: FuncCallback;
  // call
  hidden?: boolean;
}

export interface Arg {
  name?: string;
  type?: number;
  init?: Val | null;
  min?: number | null;
  max?: number | null;
  option?: string[] | number[];
}

export class FuncNotFoundError extends Error {
  constructor(base: FieldBase) {
    super(`member("${base.member_}").func("${base.field_}") is not set`);
    this.name = "FuncNotFoundError";
  }
}

/**
 * 非同期で実行した関数の実行結果を表す。
 */
export class AsyncFuncResult extends Field {
  callerId: number;
  caller: string;
  resolveStarted: (r: boolean) => void = () => undefined;
  resolveResult: (r: Val | Promise<Val>) => void = () => undefined;
  // 例外をセットする
  rejectResult: (e: any) => void = () => undefined;
  /**
   * 関数が開始したらtrue, 存在しなければfalse
   *
   * falseの場合自動でresultにもFuncNotFoundErrorが入る
   */
  started: Promise<boolean>;
  /**
   * 実行結果または例外
   */
  result: Promise<Val>;
  constructor(callerId: number, caller: string, base: Field) {
    super(base.data, base.member_, base.field_);
    this.callerId = callerId;
    this.caller = caller;
    this.started = new Promise((res) => {
      this.resolveStarted = (r: boolean) => {
        res(r);
        if (!r) {
          this.rejectResult(new FuncNotFoundError(this));
        }
      };
    });
    this.result = new Promise((res, rej) => {
      this.resolveResult = res;
      this.rejectResult = rej;
    });
  }
  /**
   * 関数のMember
   */
  get member() {
    return new Member(this);
  }
  /**
   * 関数のfield名
   */
  get name() {
    return this.field_;
  }
}

export function runFunc(fi: FuncInfo, args: Val[]) {
  if (fi.args.length === args.length) {
    const newArgs: Val[] = args.map((a, i) => {
      switch (fi.args[i].type) {
        case valType.string_:
          return String(a);
        case valType.boolean_:
          if (typeof a === "string") {
            return a !== "";
          } else {
            return !!a;
          }
        case valType.int_:
          return parseInt(String(a));
        case valType.float_:
          return parseFloat(String(a));
        default:
          return a;
      }
    });
    if (fi.funcImpl !== undefined) {
      return fi.funcImpl(...newArgs);
    }
    return undefined;
  } else {
    throw new Error(
      `require ${fi.args.length} arguments, but got ${args.length}`
    );
  }
}

export type FuncCallback = (...args: any[]) => Val | Promise<Val> | void;

/**
 * Funcを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_30__func.html Funcのドキュメント}
 * を参照
 */
export class Func extends Field {
  /**
   * このコンストラクタは直接使わず、
   * Member.func(), Member.funcs(), Member.onFuncEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super(base.data, base.member_, field || base.field_);
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
  setInfo(data: FuncInfo) {
    this.setCheck().funcStore.setSend(this.field_, data);
  }
  /** 関数からFuncInfoを構築しセットする
   *
   * @param func 登録したい関数
   * @param return_type 関数の戻り値 (valTypeオブジェクトの定数を使う)
   * @param args 関数の引数の情報
   * @param hidden trueにすると関数を他のMemberから隠す
   */
  set(
    func: FuncCallback,
    returnType: number = valType.none_,
    args: Arg[] = [],
    hidden = false
  ) {
    this.setInfo({
      returnType: returnType,
      args: args,
      funcImpl: func,
      hidden: hidden,
    });
  }
  get returnType() {
    const funcInfo = this.dataCheck().funcStore.getRecv(
      this.member_,
      this.field_
    );
    if (funcInfo !== null) {
      return funcInfo.returnType;
    }
    return valType.none_;
  }
  get args() {
    const funcInfo = this.dataCheck().funcStore.getRecv(
      this.member_,
      this.field_
    );
    if (funcInfo !== null) {
      return funcInfo.args.map((a) => ({ ...a }));
    }
    return [];
  }
  /**
   * 関数の設定を削除
   */
  free() {
    this.dataCheck().funcStore.unsetRecv(this.member_, this.field_);
  }
  runImpl(r: AsyncFuncResult, args: Val[]) {
    const funcInfo = this.dataCheck().funcStore.getRecv(
      this.member_,
      this.field_
    );
    if (this.dataCheck().isSelf(this.member_)) {
      if (funcInfo !== null && funcInfo.funcImpl !== undefined) {
        r.resolveStarted(true);
        try {
          // funcImplがpromise返す場合もそのままresolveにぶちこめばよいはず
          let res: Val | Promise<Val> | void = runFunc(funcInfo, args);
          if (res === undefined) {
            res = "";
          }
          r.resolveResult(res);
        } catch (e: any) {
          r.rejectResult(e);
        }
      } else {
        r.resolveStarted(false);
      }
    } else {
      this.dataCheck().pushSend([
        {
          kind: Message.kind.call,
          i: r.callerId,
          c: this.dataCheck().getMemberIdFromName(r.caller),
          r: this.dataCheck().getMemberIdFromName(this.member_),
          f: this.field_,
          a: args,
        },
      ]);
    }
  }
  /**
   * 関数を実行する (非同期)
   *
   * 戻り値やエラー、例外はAsyncFuncResultから取得する
   *
   * * 例外が発生した場合そのままthrow, 関数が存在しない場合 FuncNotFoundError をthrowする
   * * リモートで実行し例外が発生した場合、例外は Error クラスになる
   */
  runAsync(...args: Val[]) {
    const r = this.dataCheck().funcResultStore.addResult("", this);
    setTimeout(() => {
      this.runImpl(r, args);
    });
    return r;
  }
}

/**
 * 名前を指定せず先に関数を登録するFunc
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_30__func.html Funcのドキュメント}
 * を参照
 */
export class AnonymousFunc {
  static fieldId = 0;
  static fieldNameTmp() {
    return `.tmp${++this.fieldId}`;
  }

  base_: Func | null;
  func_: FuncCallback;
  returnType_: number;
  args_: Arg[];
  constructor(
    base: Field | null,
    func: FuncCallback,
    returnType: number,
    args: Arg[]
  ) {
    this.func_ = func;
    this.returnType_ = returnType;
    this.args_ = args;
    if (base === null) {
      this.base_ = null;
    } else {
      this.base_ = new Func(base, AnonymousFunc.fieldNameTmp());
      this.base_.set(func, returnType, args, true);
    }
  }
  /**
   * target に関数を移動
   * @param hidden targetに設定されるhidden属性
   */
  lockTo(target: Func, hidden = false) {
    if (this.base_ === null) {
      this.base_ = new Func(target, AnonymousFunc.fieldNameTmp());
      this.base_.set(this.func_, this.returnType_, this.args_, true);
    }
    const fi = this.base_.dataCheck().funcStore.getRecv(
      this.base_.member_,
      this.base_.field_
    );
    if (fi) {
      const fi2 = { ...fi, hidden };
      target.setInfo(fi2);
      this.base_.free();
    } else {
      // コンストラクタかlockToのどちらかで必ずsetされているはずなのであり得ないが
      throw new Error("Error in AnonymousFunc.lockTo()");
    }
  }
}

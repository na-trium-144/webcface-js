import { Member } from "./member.js";
import { valType } from "./message.js";
import { Field } from "./field.js";
import * as Message from "./message.js";
import {
  Arg,
  FuncCallback,
  FuncInfo,
  FuncPromiseData,
  Val,
} from "./funcBase.js";

/**
 * 非同期で実行した関数の実行結果を表す。
 */
export class FuncPromise {
  base_: Field;
  /**
   * 関数呼び出しのメッセージが相手のクライアントに到達したら解決するPromise
   * @since ver1.8
   *
   * * 相手のクライアントが関数の実行を開始したらtrue、
   * 指定したクライアントまたは関数が存在しなかった場合falseを返す
   * * falseの場合自動でresultにもFuncNotFoundErrorが入る
   */
  reach: Promise<boolean>;
  /**
   * reach と同じ。
   * @deprecated ver1.8〜
   */
  started: Promise<boolean>;
  /**
   * 関数の実行が完了し戻り値かエラーメッセージを受け取ったら解決するPromise
   * @since ver1.8
   *
   * * 関数の戻り値をstring,number,booleanのいずれかで返す。
   * * 関数が例外を返した場合、 Error(エラーメッセージ) の値でrejectする。
   *   * ver1.7以前ではany型だったが、1.8以降任意の例外をStringに変換した上でError型のメッセージにする
   */
  finish: Promise<string | number | boolean>;
  /**
   * finish と同じ
   * @deprecated ver1.8〜
   */
  result: Promise<Val>;
  constructor(pData: FuncPromiseData) {
    this.base_ = new Field(pData.data, pData.base.member_, pData.base.field_);
    this.reach = this.started = pData.reach;
    this.finish = this.result = pData.finish;
  }
  /**
   * 関数のMember
   */
  get member() {
    return new Member(this.base_);
  }
  /**
   * 関数のfield名
   */
  get name() {
    return this.base_.field_;
  }
}
export const AsyncFuncResult = FuncPromise;
export type AsyncFuncResult = FuncPromise;

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

/**
 * Funcを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_30__func.html Funcのドキュメント}
 * を参照
 */
export class Func {
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Member.func(), Member.funcs(), Member.onFuncEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    this.base_ = new Field(base.data, base.member_, field || base.field_);
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
  setInfo(data: FuncInfo) {
    this.base_.setCheck().funcStore.setSend(this.base_.field_, data);
  }
  /** 関数からFuncInfoを構築しセットする
   *
   * @param func 登録したい関数
   * @param return_type 関数の戻り値 (valTypeオブジェクトの定数を使う)
   * @param args 関数の引数の情報
   */
  set(
    func: FuncCallback,
    returnType: number = valType.none_,
    args: Arg[] = []
  ) {
    this.setInfo({
      returnType: returnType,
      args: args,
      funcImpl: func,
    });
  }
  get returnType() {
    const funcInfo = this.base_
      .dataCheck()
      .funcStore.getRecv(this.base_.member_, this.base_.field_);
    if (funcInfo !== null) {
      return funcInfo.returnType;
    }
    return valType.none_;
  }
  get args() {
    const funcInfo = this.base_
      .dataCheck()
      .funcStore.getRecv(this.base_.member_, this.base_.field_);
    if (funcInfo !== null) {
      return funcInfo.args.map((a) => ({ ...a }));
    }
    return [];
  }
  /**
   * 関数の設定を削除
   */
  free() {
    this.base_
      .dataCheck()
      .funcStore.unsetRecv(this.base_.member_, this.base_.field_);
  }
  runImpl(r: FuncPromiseData, args: Val[]) {
    const funcInfo = this.base_
      .dataCheck()
      .funcStore.getRecv(this.base_.member_, this.base_.field_);
    if (this.base_.dataCheck().isSelf(this.base_.member_)) {
      if (funcInfo !== null && funcInfo.funcImpl !== undefined) {
        r.resolveReach(true);
        try {
          // funcImplがpromise返す場合もそのままresolveにぶちこめばよいはず
          let res: Val | Promise<Val> | void = runFunc(funcInfo, args);
          if (res === undefined) {
            res = "";
          }
          r.resolveFinish(res);
        } catch (e: any) {
          if (e instanceof Error) {
            r.rejectFinish(e);
          } else {
            r.rejectFinish(new Error(String(e)));
          }
        }
      } else {
        r.resolveReach(false);
      }
    } else {
      if (
        !this.base_.dataCheck().pushSendOnline([
          {
            kind: Message.kind.call,
            i: r.callerId,
            c: this.base_.dataCheck().getMemberIdFromName(r.caller),
            r: this.base_.dataCheck().getMemberIdFromName(this.base_.member_),
            f: this.base_.field_,
            a: args,
          },
        ])
      ) {
        // 未接続でfalseになる
        r.resolveReach(false);
      }
    }
  }
  /**
   * 関数を実行する (非同期)
   *
   * 戻り値やエラー、例外はFuncPromiseから取得する
   */
  runAsync(...args: Val[]) {
    const r = this.base_
      .dataCheck()
      .funcResultStore.addResult("", this.base_, this.base_.dataCheck());
    setTimeout(() => {
      this.runImpl(r, args);
    });
    return new FuncPromise(r);
  }
  /**
   * 関数が存在すればtrueを返す
   * @since ver1.8
   */
  exists() {
    return this.base_
      .dataCheck()
      .funcStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
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
    return `..tmp${++this.fieldId}`;
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
      this.base_.set(func, returnType, args);
    }
  }
  /**
   * target に関数を移動
   */
  lockTo(target: Func) {
    if (this.base_ === null) {
      this.base_ = new Func(target.base_, AnonymousFunc.fieldNameTmp());
      this.base_.set(this.func_, this.returnType_, this.args_);
    }
    const fi = this.base_.base_
      .dataCheck()
      .funcStore.getRecv(this.base_.base_.member_, this.base_.base_.field_);
    if (fi) {
      target.setInfo(fi);
      this.base_.free();
    } else {
      // コンストラクタかlockToのどちらかで必ずsetされているはずなのであり得ないが
      throw new Error("Error in AnonymousFunc.lockTo()");
    }
  }
}

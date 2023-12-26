import { Value } from "./value.js";
import { Text } from "./text.js";
import { Log } from "./log.js";
import { Func, FuncCallback, AnonymousFunc, Arg } from "./func.js";
import { View } from "./view.js";
import { Image } from "./image.js";
import { Field } from "./field.js";
import { EventTarget, eventType } from "./event.js";
import * as Message from "./message.js";

/**
 * Memberを指すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_02__member.html Memberのドキュメント} を参照
 */
export class Member extends Field {
  /**
   * このコンストラクタは直接使わず、
   * Client.member(), Client.members(), Client.onMemberEntry などを使うこと
   */
  constructor(base: Field, member = "") {
    super(base.data, member || base.member_, "");
  }
  /**
   * Member名
   */
  get name() {
    return this.member_;
  }
  /**
   * Valueを参照する
   */
  value(name: string) {
    return new Value(this, name);
  }
  /**
   * Textを参照する
   */
  text(name: string) {
    return new Text(this, name);
  }
  /**
   * Viewを参照する
   */
  view(name: string) {
    return new View(this, name);
  }
  /**
   * Imageを参照する
   */
  image(name: string) {
    return new Image(this, name);
  }
  /**
   * Funcを参照する
   */
  func(name: string): Func;
  /**
   * Funcの名前を決めずに一時的なFuncオブジェクト(AnonymoudFuncオブジェクト)を作成し、
   * 関数をセットする。
   *
   * 関数のセットについては Func.set() を参照。
   * @param callback セットする関数
   * @param returnType 関数の戻り値の型
   * @param arg 関数の引数の情報
   */
  func(callback: FuncCallback, returnType: number, args: Arg[]): AnonymousFunc;
  func(...args: [string] | [FuncCallback, number, Arg[]]) {
    if (typeof args[0] === "string") {
      return new Func(this, args[0]);
    } else {
      return new AnonymousFunc(this, args[0], args[1] || 0, args[2] || []);
    }
  }
  /**
   * Logを参照する
   */
  log() {
    return new Log(this);
  }
  /**
   * このMemberが公開しているValueのリストを返す
   */
  values() {
    return this.dataCheck()
      .valueStore.getEntry(this.member_)
      .map((n) => this.value(n));
  }
  /**
   * このMemberが公開しているTextのリストを返す
   */
  texts() {
    return this.dataCheck()
      .textStore.getEntry(this.member_)
      .map((n) => this.text(n));
  }
  /**
   * このMemberが公開しているViewのリストを返す
   */
  views() {
    return this.dataCheck()
      .viewStore.getEntry(this.member_)
      .map((n) => this.view(n));
  }
  /**
   * このMemberが公開しているImageのリストを返す
   */
  images() {
    return this.dataCheck()
      .imageStore.getEntry(this.member_)
      .map((n) => this.image(n));
  }
  /**
   * このMemberが公開しているFuncのリストを返す
   */
  funcs() {
    return this.dataCheck()
      .funcStore.getEntry(this.member_)
      .map((n) => this.func(n));
  }
  /**
   * Valueが追加された時のイベント
   *
   * コールバックの型は (target: Value) => void
   */
  get onValueEntry() {
    return new EventTarget<Value>(
      eventType.valueEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Textが追加された時のイベント
   *
   * コールバックの型は (target: Text) => void
   */
  get onTextEntry() {
    return new EventTarget<Text>(
      eventType.textEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Funcが追加された時のイベント
   *
   * コールバックの型は (target: Func) => void
   */
  get onFuncEntry() {
    return new EventTarget<Func>(
      eventType.funcEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Viewが追加された時のイベント
   *
   * コールバックの型は (target: View) => void
   */
  get onViewEntry() {
    return new EventTarget<View>(
      eventType.viewEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Imageが追加された時のイベント
   *
   * コールバックの型は (target: View) => void
   */
  get onImageEntry() {
    return new EventTarget<Image>(
      eventType.imageEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Memberがsyncしたときのイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onSync() {
    return new EventTarget<Member>(
      eventType.sync(this),
      this.data,
      this.member_
    );
  }
  /**
   * このMemberが使っているWebCFaceライブラリの識別情報
   *
   * c++クライアントライブラリは"cpp", javascriptクライアントは"js",
   * pythonクライアントは"python"を返す。
   */
  get libName() {
    return (
      this.dataCheck().memberLibName.get(
        this.dataCheck().getMemberIdFromName(this.member_)
      ) || ""
    );
  }
  /**
   * このMemberが使っているライブラリのバージョン
   */
  get libVersion() {
    return (
      this.dataCheck().memberLibVer.get(
        this.dataCheck().getMemberIdFromName(this.member_)
      ) || ""
    );
  }
  /**
   * このMemberのIPアドレス
   */
  get remoteAddr() {
    return (
      this.dataCheck().memberRemoteAddr.get(
        this.dataCheck().getMemberIdFromName(this.member_)
      ) || ""
    );
  }
  /**
   * 通信速度を調べる
   *
   * 初回の呼び出しで通信速度データをリクエストし、
   * sync()後通信速度が得られるようになる
   * @return 初回→ null, 2回目以降(取得できれば)→ pingの往復時間 (ms)
   */
  get pingStatus() {
    if (!this.dataCheck().pingStatusReq) {
      this.dataCheck().pingStatusReq = true;
      this.dataCheck().pushSend([
        {
          kind: Message.kind.pingStatusReq,
        },
      ]);
    }
    const ps = this.dataCheck().pingStatus.get(
      this.dataCheck().getMemberIdFromName(this.member_)
    );
    return ps !== undefined ? ps : null;
  }
  /**
   * 通信速度が更新された時のイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onPing() {
    void this.pingStatus;
    return new EventTarget<Member>(
      eventType.ping(this),
      this.data,
      this.member_
    );
  }
}

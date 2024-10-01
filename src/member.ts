import { Value } from "./value.js";
import { Text } from "./text.js";
import { Log } from "./log.js";
import { Func, FuncCallback, AnonymousFunc, Arg } from "./func.js";
import { View } from "./view.js";
import { Image } from "./image.js";
import { Field } from "./field.js";
import { RobotModel } from "./robotModel.js";
import { Canvas3D } from "./canvas3d.js";
import { Canvas2D } from "./canvas2d.js";
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
   * RobotModelを参照する
   */
  robotModel(name: string) {
    return new RobotModel(this, name);
  }
  /**
   * Viewを参照する
   */
  view(name: string) {
    return new View(this, name);
  }
  /**
   * Canvas3Dを参照する
   */
  canvas3D(name: string) {
    return new Canvas3D(this, name);
  }
  /**
   * Canvas2Dを参照する
   */
  canvas2D(name: string) {
    return new Canvas2D(this, name);
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
   *
   * ver1.9〜: nameを指定可能 (デフォルトは "default")
   */
  log(name: string = "default") {
    return new Log(this, name);
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
   * このMemberが公開しているRobotModelのリストを返す
   */
  robotModels() {
    return this.dataCheck()
      .robotModelStore.getEntry(this.member_)
      .map((n) => this.robotModel(n));
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
   * このMemberが公開しているCanvas3Dのリストを返す
   */
  canvas3DEntries() {
    return this.dataCheck()
      .canvas3DStore.getEntry(this.member_)
      .map((n) => this.canvas3D(n));
  }
  /**
   * このMemberが公開しているCanvas2Dのリストを返す
   */
  canvas2DEntries() {
    return this.dataCheck()
      .canvas2DStore.getEntry(this.member_)
      .map((n) => this.canvas2D(n));
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
   * このmemberが公開しているLogのリストを返す
   * @since ver1.9
   */
  logEntries() {
    return this.dataCheck()
      .logStore.getEntry(this.member_)
      .map((n) => this.log(n));
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
   * RobotModelが追加された時のイベント
   *
   * コールバックの型は (target: RobotModel) => void
   */
  get onRobotModelEntry() {
    return new EventTarget<RobotModel>(
      eventType.robotModelEntry(this),
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
   * Canvas3Dが追加された時のイベント
   *
   * コールバックの型は (target: Canvas3D) => void
   */
  get onCanvas3DEntry() {
    return new EventTarget<Canvas3D>(
      eventType.canvas3DEntry(this),
      this.data,
      this.member_
    );
  }
  /**
   * Canvas2Dが追加された時のイベント
   *
   * コールバックの型は (target: Canvas3D) => void
   */
  get onCanvas2DEntry() {
    return new EventTarget<Canvas2D>(
      eventType.canvas2DEntry(this),
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
   * Logが追加された時のイベント
   * @since ver1.9
   * 
   * コールバックの型は (target: Log) => void
   */
  get onLogEntry() {
    return new EventTarget<Log>(
      eventType.logEntry(this),
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
   * 通信速度データがリクエストされていなければリクエストを送る。
   * @return まだ受信していなければnull, 取得できればpingの往復時間 (ms)
   */
  get pingStatus() {
    this.requestPingStatus();
    const ps = this.dataCheck().pingStatus.get(
      this.dataCheck().getMemberIdFromName(this.member_)
    );
    return ps !== undefined ? ps : null;
  }
  /**
   * pingStatusのデータをリクエストする
   * @since ver1.8
   *
   */
  requestPingStatus() {
    if (!this.dataCheck().pingStatusReq) {
      this.dataCheck().pingStatusReq = true;
      this.dataCheck().pushSendReq([
        {
          kind: Message.kind.pingStatusReq,
        },
      ]);
    }
  }
  /**
   * 通信速度が更新された時のイベント
   *
   * 通信速度データがリクエストされていなければリクエストを送る。
   * コールバックの型は (target: Member) => void
   */
  get onPing() {
    this.requestPingStatus();
    return new EventTarget<Member>(
      eventType.ping(this),
      this.data,
      this.member_
    );
  }
  /**
   * syncの時刻を返す
   */
  syncTime() {
    return this.dataCheck().syncTimeStore.getRecv(this.member_) || new Date(0);
  }
}

import { Value } from "./value.js";
import { Text } from "./text.js";
import { Log } from "./log.js";
import { Func } from "./func.js";
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
export class Member {
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Client.member(), Client.members(), Client.onMemberEntry などを使うこと
   */
  constructor(base: Field, member = "") {
    this.base_ = new Field(base.data, member || base.member_, "");
  }
  /**
   * Member名
   */
  get name() {
    return this.base_.member_;
  }

  /**
   * Valueオブジェクトを生成
   */
  value(name: string) {
    return new Value(this.base_.child(name));
  }
  /**
   * Textオブジェクトを生成
   */
  text(name: string) {
    return new Text(this.base_.child(name));
  }
  /**
   * RobotModelオブジェクトを生成
   */
  robotModel(name: string) {
    return new RobotModel(this.base_.child(name));
  }
  /**
   * Viewオブジェクトを生成
   */
  view(name: string) {
    return new View(this.base_.child(name));
  }
  /**
   * Canvas3Dオブジェクトを生成
   */
  canvas3D(name: string) {
    return new Canvas3D(this.base_.child(name));
  }
  /**
   * Canvas2Dオブジェクトを生成
   */
  canvas2D(name: string) {
    return new Canvas2D(this.base_.child(name));
  }
  /**
   * Imageオブジェクトを生成
   */
  image(name: string) {
    return new Image(this.base_.child(name));
  }
  /**
   * Funcオブジェクトを生成
   */
  func(name: string): Func {
    return new Func(this.base_.child(name));
  }
  /**
   * Logオブジェクトを生成
   *
   * ver1.9〜: nameを指定可能 (デフォルトは "default")
   */
  log(name: string = "default") {
    return new Log(this.base_.child(name));
  }

  /**
   * このMemberが公開しているValueのリストを返す
   */
  values() {
    return this.base_
      .dataCheck()
      .valueStore.getEntry(this.base_.member_)
      .map((n) => this.base_.value(n));
  }
  /**
   * このMemberが公開しているTextのリストを返す
   */
  texts() {
    return this.base_
      .dataCheck()
      .textStore.getEntry(this.base_.member_)
      .map((n) => this.base_.text(n));
  }
  /**
   * このMemberが公開しているRobotModelのリストを返す
   */
  robotModels() {
    return this.base_
      .dataCheck()
      .robotModelStore.getEntry(this.base_.member_)
      .map((n) => this.base_.robotModel(n));
  }
  /**
   * このMemberが公開しているViewのリストを返す
   */
  views() {
    return this.base_
      .dataCheck()
      .viewStore.getEntry(this.base_.member_)
      .map((n) => this.base_.view(n));
  }
  /**
   * このMemberが公開しているCanvas3Dのリストを返す
   */
  canvas3DEntries() {
    return this.base_
      .dataCheck()
      .canvas3DStore.getEntry(this.base_.member_)
      .map((n) => this.base_.canvas3D(n));
  }
  /**
   * このMemberが公開しているCanvas2Dのリストを返す
   */
  canvas2DEntries() {
    return this.base_
      .dataCheck()
      .canvas2DStore.getEntry(this.base_.member_)
      .map((n) => this.base_.canvas2D(n));
  }
  /**
   * このMemberが公開しているImageのリストを返す
   */
  images() {
    return this.base_
      .dataCheck()
      .imageStore.getEntry(this.base_.member_)
      .map((n) => this.base_.image(n));
  }
  /**
   * このMemberが公開しているFuncのリストを返す
   */
  funcs() {
    return this.base_
      .dataCheck()
      .funcStore.getEntry(this.base_.member_)
      .map((n) => this.base_.func(n));
  }
  /**
   * このmemberが公開しているLogのリストを返す
   * @since ver1.9
   */
  logEntries() {
    return this.base_
      .dataCheck()
      .logStore.getEntry(this.base_.member_)
      .map((n) => this.base_.log(n));
  }
  /**
   * Valueが追加された時のイベント
   *
   * コールバックの型は (target: Value) => void
   */
  get onValueEntry() {
    return new EventTarget<Value>(
      eventType.valueEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Textが追加された時のイベント
   *
   * コールバックの型は (target: Text) => void
   */
  get onTextEntry() {
    return new EventTarget<Text>(
      eventType.textEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * RobotModelが追加された時のイベント
   *
   * コールバックの型は (target: RobotModel) => void
   */
  get onRobotModelEntry() {
    return new EventTarget<RobotModel>(
      eventType.robotModelEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Funcが追加された時のイベント
   *
   * コールバックの型は (target: Func) => void
   */
  get onFuncEntry() {
    return new EventTarget<Func>(
      eventType.funcEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Viewが追加された時のイベント
   *
   * コールバックの型は (target: View) => void
   */
  get onViewEntry() {
    return new EventTarget<View>(
      eventType.viewEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Canvas3Dが追加された時のイベント
   *
   * コールバックの型は (target: Canvas3D) => void
   */
  get onCanvas3DEntry() {
    return new EventTarget<Canvas3D>(
      eventType.canvas3DEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Canvas2Dが追加された時のイベント
   *
   * コールバックの型は (target: Canvas3D) => void
   */
  get onCanvas2DEntry() {
    return new EventTarget<Canvas2D>(
      eventType.canvas2DEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Imageが追加された時のイベント
   *
   * コールバックの型は (target: View) => void
   */
  get onImageEntry() {
    return new EventTarget<Image>(
      eventType.imageEntry(this.base_),
      this.base_.data,
      this.base_.member_
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
      eventType.logEntry(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * Memberがsyncしたときのイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onSync() {
    return new EventTarget<Member>(
      eventType.sync(this.base_),
      this.base_.data,
      this.base_.member_
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
      this.base_
        .dataCheck()
        .memberLibName.get(
          this.base_.dataCheck().getMemberIdFromName(this.base_.member_)
        ) || ""
    );
  }
  /**
   * このMemberが使っているライブラリのバージョン
   */
  get libVersion() {
    return (
      this.base_
        .dataCheck()
        .memberLibVer.get(
          this.base_.dataCheck().getMemberIdFromName(this.base_.member_)
        ) || ""
    );
  }
  /**
   * このMemberのIPアドレス
   */
  get remoteAddr() {
    return (
      this.base_
        .dataCheck()
        .memberRemoteAddr.get(
          this.base_.dataCheck().getMemberIdFromName(this.base_.member_)
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
    const ps = this.base_
      .dataCheck()
      .pingStatus.get(
        this.base_.dataCheck().getMemberIdFromName(this.base_.member_)
      );
    return ps !== undefined ? ps : null;
  }
  /**
   * pingStatusのデータをリクエストする
   * @since ver1.8
   *
   */
  requestPingStatus() {
    if (!this.base_.dataCheck().pingStatusReq) {
      this.base_.dataCheck().pingStatusReq = true;
      this.base_.dataCheck().pushSendReq([
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
      eventType.ping(this.base_),
      this.base_.data,
      this.base_.member_
    );
  }
  /**
   * syncの時刻を返す
   */
  syncTime() {
    return (
      this.base_.dataCheck().syncTimeStore.getRecv(this.base_.member_) ||
      new Date(0)
    );
  }
}

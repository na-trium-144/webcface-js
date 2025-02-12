import { Value } from "./value.js";
import { Text } from "./text.js";
import { Log } from "./log.js";
import { Func } from "./func.js";
import { View } from "./view.js";
import { Plot } from "./plot.js";
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
   * Plotオブジェクトを生成
   * @since ver1.12
   */
  plot(name: string) {
    return new Plot(this.base_.child(name));
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
   * 公開されているデータのリスト
   * @since ver1.10
   *
   * * データ型を問わずすべてのデータを列挙する。
   * * childrenRecurse() と異なり、
   * 名前にさらにピリオドが含まれる場合はその前までの名前を返す。
   * * 同名で複数のデータが存在する場合も1回のみカウントする。
   */
  children() {
    return this.base_.children();
  }
  /**
   * 公開されているデータのリスト(再帰)
   * @since ver1.10
   *
   * * データ型を問わずすべてのデータを列挙する。
   * * 同名で複数のデータが存在する場合も1回のみカウントする。
   */
  childrenRecurse() {
    return this.base_.childrenRecurse();
  }
  /**
   * 公開されているデータが存在するかどうかを返す
   * @since ver1.10
   */
  hasChildren() {
    return this.base_.hasChildren();
  }

  /**
   * 公開されているvalueのリストを返す。
   * @since ver1.10
   */
  valueEntries() {
    return this.base_.valueEntries();
  }
  /**
   * 公開されているtextのリストを返す。
   * @since ver1.10
   */
  textEntries() {
    return this.base_.textEntries();
  }
  /**
   * 公開されているfuncのリストを返す。
   * @since ver1.10
   */
  funcEntries() {
    return this.base_.funcEntries();
  }
  /**
   * 公開されているviewのリストを返す。
   * @since ver1.10
   */
  viewEntries() {
    return this.base_.viewEntries();
  }
  /**
   * 公開されているplotのリストを返す。
   * @since ver1.12
   */
  plotEntries() {
    return this.base_.viewEntries();
  }
  /**
   * 公開されているlogのリストを返す。
   * @since ver1.9
   */
  logEntries() {
    return this.base_.logEntries();
  }
  /**
   * 公開されているimageのリストを返す。
   * @since ver1.10
   */
  imageEntries() {
    return this.base_.imageEntries();
  }
  /**
   * 公開されているcanvas2Dのリストを返す。
   */
  canvas2DEntries() {
    return this.base_.canvas2DEntries();
  }
  /**
   * 公開されているcanvas3Dのリストを返す。
   */
  canvas3DEntries() {
    return this.base_.canvas3DEntries();
  }
  /**
   * 公開されているrobotModelのリストを返す。
   * @since ver1.10
   */
  robotModelEntries() {
    return this.base_.robotModelEntries();
  }

  /**
   * このMemberが公開しているValueのリストを返す
   *
   * @deprecated ver1.10〜 valueEntries() に移行
   */
  values() {
    return this.base_.valueEntries();
  }
  /**
   * このMemberが公開しているTextのリストを返す
   *
   * @deprecated ver1.10〜 textEntries() に移行
   */
  texts() {
    return this.base_.textEntries();
  }
  /**
   * このMemberが公開しているRobotModelのリストを返す
   *
   * @deprecated ver1.10〜 robotModelEntries() に移行
   */
  robotModels() {
    return this.base_.robotModelEntries();
  }
  /**
   * このMemberが公開しているViewのリストを返す
   *
   * @deprecated ver1.10〜 viewEntries() に移行
   */
  views() {
    return this.base_.viewEntries();
  }
  /**
   * このMemberが公開しているImageのリストを返す
   *
   * @deprecated ver1.10〜 imageEntries() に移行
   */
  images() {
    return this.base_.imageEntries();
  }
  /**
   * このMemberが公開しているFuncのリストを返す
   *
   * @deprecated ver1.10〜 funcEntries() に移行
   */
  funcs() {
    return this.base_.funcEntries();
  }

  /**
   * Valueが追加された時のイベント
   *
   * コールバックの型は (target: Value) => void
   */
  get onValueEntry() {
    return new EventTarget<Value>(
      eventType.valueEntry(this.base_),
      this.base_.data
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
      this.base_.data
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
      this.base_.data
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
      this.base_.data
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
      this.base_.data
    );
  }
  /**
   * Plotが追加された時のイベント
   * @since ver1.12
   *
   * コールバックの型は (target: Plot) => void
   */
  get onPlotEntry() {
    return new EventTarget<Plot>(
      eventType.plotEntry(this.base_),
      this.base_.data
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
      this.base_.data
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
      this.base_.data
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
      this.base_.data
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
      this.base_.data
    );
  }
  /**
   * Memberがsyncしたときのイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onSync() {
    return new EventTarget<Member>(eventType.sync(this.base_), this.base_.data);
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
    return new EventTarget<Member>(eventType.ping(this.base_), this.base_.data);
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

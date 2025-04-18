import { ClientData } from "./clientData.js";
import { Member } from "./member.js";
import { Field } from "./field.js";
import { EventTarget, eventType } from "./event.js";
import * as clientWs from "./clientWs.js";

/**
 * サーバーに接続するクライアント
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_01__client.html Clientのドキュメント} を参照
 */
export class Client extends Member {
  /**
   * @return サーバーに接続できていればtrue
   */
  get connected() {
    return this.base_.dataCheck().ws != null;
  }
  /**
   * @param name 名前
   * @param host サーバーのアドレス
   * @param port サーバーのポート
   */
  constructor(
    name = "",
    host = "127.0.0.1",
    port = 7530,
    logLevel: "trace" | "verbose" | "none" = "none"
  ) {
    super(new Field(new ClientData(name, host, port, logLevel), name), name);
    // clientWs.syncDataFirst(this.base_.dataCheck());
  }
  get logLevel() {
    return this.base_.dataCheck().logLevel;
  }
  set logLevel(logLevel: "trace" | "verbose" | "none") {
    this.base_.dataCheck().logLevel = logLevel;
  }
  /**
   * 接続を切り、今後再接続しない
   * JavaScriptにデストラクタはないので、忘れずに呼ぶ必要がある。
   */
  close() {
    this.base_.dataCheck().closing = true;
    this.base_.dataCheck().ws?.close();
  }
  /**
   * サーバーに接続を開始する。
   */
  start() {
    if (!this.base_.dataCheck().connectionStarted) {
      this.base_.dataCheck().connectionStarted = true;
      clientWs.reconnect(this, this.base_.dataCheck());
    }
  }
  /**
   * 送信用にセットしたデータをすべて送信キューにいれる。
   *
   * サーバーに接続していない場合start()を呼び出す。
   */
  sync() {
    this.start();
    if (!this.connected && this.base_.dataCheck().syncFirst === null) {
      clientWs.initSyncDataFirst(this.base_.dataCheck());
    } else {
      this.base_
        .dataCheck()
        .pushSendAlways(clientWs.syncData(this.base_.dataCheck(), false));
    }
  }

  /**
   * 他のmemberにアクセスする
   *
   * ver1.7〜: member名が空文字列ならthisを返す
   */
  member(member: string) {
    if (member === "") {
      return this as Member;
    } else {
      return new Member(this.base_, member);
    }
  }
  /**
   * サーバーに接続されている他のmemberのリストを得る。
   * 自分自身と、無名のmemberを除く。
   */
  members() {
    return [...this.base_.dataCheck().valueStore.getMembers()].map((n) =>
      this.member(n)
    );
  }
  /**
   * Memberが追加されたときのイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onMemberEntry() {
    return new EventTarget<Member>(eventType.memberEntry(), this.base_.data);
  }
  /**
   * サーバーの識別情報
   * @return 通常は"webcface"
   */
  get serverName() {
    return this.base_.dataCheck().svrName;
  }
  /**
   * サーバーのバージョン
   */
  get serverVersion() {
    return this.base_.dataCheck().svrVersion;
  }
  /**
   * サーバーのホスト名
   * @since ver1.7
   */
  get serverHostName() {
    return this.base_.dataCheck().svrHostName;
  }
}

import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { Member } from "./member.js";
import { AsyncFuncResult, runFunc, Val } from "./func.js";
import { log4jsLevelConvert, LogLine, appender } from "./logger.js";
import { getViewDiff, mergeViewDiff } from "./view.js";
import websocket from "websocket";
const w3cwebsocket = websocket.w3cwebsocket;
import { getLogger } from "@log4js-node/log4js-api";
import { Field, FieldBase } from "./field.js";
import { EventTarget, eventType } from "./event.js";
import version from "./version.js";
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
    return this.dataCheck().ws != null;
  }
  /**
   * @param name 名前
   * @param host サーバーのアドレス
   * @param port サーバーのポート
   */
  constructor(name = "", host = "127.0.0.1", port = 7530) {
    super(new Field(new ClientData(name, host, port), name), name);
    clientWs.syncDataFirst(this.dataCheck());
  }
  /**
   * 接続を切り、今後再接続しない
   * JavaScriptにデストラクタはないので、忘れずに呼ぶ必要がある。
   */
  close() {
    this.dataCheck().closing = true;
    this.dataCheck().ws?.close();
  }
  /**
   * サーバーに接続を開始する。
   */
  start() {
    if (!this.dataCheck().connectionStarted) {
      this.dataCheck().connectionStarted = true;
      clientWs.reconnect(this, this.dataCheck());
    }
  }
  /**
   * 送信用にセットしたデータをすべて送信キューにいれる。
   *
   * サーバーに接続していない場合start()を呼び出す。
   */
  sync() {
    this.start();
    clientWs.syncData(this.dataCheck(), false);
  }

  /**
   * 他のmemberにアクセスする
   */
  member(member: string) {
    return new Member(this, member);
  }
  /**
   * サーバーに接続されている他のmemberのリストを得る。
   * 自分自身と、無名のmemberを除く。
   */
  members() {
    return [...this.dataCheck().valueStore.getMembers()].map((n) => this.member(n));
  }
  /**
   * Memberが追加されたときのイベント
   *
   * コールバックの型は (target: Member) => void
   */
  get onMemberEntry() {
    return new EventTarget<Member>(eventType.memberEntry(), this.data, "", "");
  }
  /**
   * サーバーの識別情報
   * @return 通常は"webcface"
   */
  get serverName() {
    return this.dataCheck().svrName;
  }
  /**
   * サーバーのバージョン
   */
  get serverVersion() {
    return this.dataCheck().svrVersion;
  }
  /**
   * webcfaceに出力するLogAppender
   * @return log4jsのappenderに設定して使う。
   */
  get logAppender() {
    return appender(this.dataCheck());
  }
}

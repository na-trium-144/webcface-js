import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";
import * as Message from "./message.js";

export interface LogLine {
  level: number;
  time: Date;
  message: string;
}

/**
 *  ログの送受信データを表すクラス
 *
 * 詳細は {@link https://na-trium-144.github.io/webcface/md_40__log.html Logのドキュメント}
 * を参照
 */
export class Log extends EventTarget<Log> {
  constructor(base: Field) {
    super("", base.data, base.member_, "");
    this.eventType_ = eventType.logAppend(this);
  }
  /**
   * Memberを返す
   */
  get member() {
    return new Member(this);
  }

  /**
   * Clientが保持するログの行数を設定する。
   * @since ver2.1
   *
   * * この行数以上のログが送られてきたら古いログから順に削除され、get()で取得できなくなる。
   * * デフォルトは1000
   * * 負の値を設定すると無制限に保持する。
   *
   */
  static keepLines: number = 1000;

  /**
   * 値をリクエストする。
   */
  request() {
    const req = this.dataCheck().logStore.addReq(this.member_);
    if (req) {
      this.dataCheck().pushSendReq([
        {
          kind: Message.kind.logReq,
          M: this.member_,
        },
      ]);
    }
  }
  /**
   * ログを取得する
   */
  tryGet() {
    this.request();
    return this.dataCheck().logStore.getRecv(this.member_);
  }
  /**
   * ログを取得する
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
   * このメンバーがログを1行以上出力していればtrueを返す
   * @since ver1.8
   *
   * get().length などとは違って、実際のログデータを受信しない。
   * (リクエストも送信しない)
   */
  exists() {
    return this.dataCheck().logStore.getEntry(this.member_);
  }
  /**
   * 受信したログをクリアする
   *
   * リクエスト状態は解除しない
   */
  clear() {
    this.dataCheck().logStore.setRecv(this.member_, []);
    return this;
  }

  /**
   * ログを1行追加
   * @since ver1.8
   */
  append(level: number, message: string) {
    const ll = {
      level,
      time: new Date(),
      message,
    };
    this.setCheck().logStore.getRecv(this.member_)?.push(ll);
    this.triggerEvent(this);
  }
}

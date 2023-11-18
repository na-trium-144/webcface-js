import { Member } from "./member.js";
import { EventTarget, eventType } from "./event.js";
import { Field } from "./field.js";

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
   * ログを取得する
   */
  tryGet() {
    return this.data.logStore.getRecv(this.member_);
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
   * 受信したログをクリアする
   *
   * リクエスト状態は解除しない
   */
  clear() {
    this.data.logStore.setRecv(this.member_, []);
    return this;
  }
}

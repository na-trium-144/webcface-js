import { FuncInfo, AsyncFuncResult } from "./func.js";
import { EventEmitter } from "eventemitter3";
import { LogLine } from "./logger.js";
import * as Message from "./message.js";
import { Field } from "./field.js";
import websocket from "websocket";

export class ClientData {
  selfMemberName: string;
  valueStore: SyncDataStore2<number[]>;
  textStore: SyncDataStore2<string>;
  funcStore: SyncDataStore2<FuncInfo>;
  viewStore: SyncDataStore2<Message.ViewComponent[]>;
  logStore: SyncDataStore1<LogLine[]>;
  logSentLines = 0;
  syncTimeStore: SyncDataStore1<Date>;
  funcResultStore: FuncResultStore;
  memberIds: Map<string, number>;
  memberLibName: Map<number, string>;
  memberLibVer: Map<number, string>;
  memberRemoteAddr: Map<number, string>;
  eventEmitter: EventEmitter;
  svrName = "";
  svrVersion = "";
  pingStatus: Map<number, number>;
  pingStatusReq = false;
  pingStatusReqSend = false;
  host: string;
  port: number;
  closing = false;
  connectionStarted = false;
  ws: null | websocket.w3cwebsocket = null;
  messageQueue: ArrayBuffer[] = [];

  constructor(name: string, host = "", port = -1) {
    this.selfMemberName = name;
    this.host = host;
    this.port = port;
    this.valueStore = new SyncDataStore2<number[]>(name);
    this.textStore = new SyncDataStore2<string>(name);
    this.funcStore = new SyncDataStore2<FuncInfo>(name);
    this.viewStore = new SyncDataStore2<Message.ViewComponent[]>(name);
    this.logStore = new SyncDataStore1<LogLine[]>(name);
    this.logStore.setRecv(name, []);
    this.syncTimeStore = new SyncDataStore1<Date>(name);
    this.funcResultStore = new FuncResultStore();
    this.memberIds = new Map<string, number>();
    this.memberLibName = new Map<number, string>();
    this.memberLibVer = new Map<number, string>();
    this.memberRemoteAddr = new Map<number, string>();
    this.eventEmitter = new EventEmitter();
    this.pingStatus = new Map<number, number>();
  }
  isSelf(member: string) {
    return this.selfMemberName === member;
  }
  getMemberNameFromId(id: number) {
    for (const [n, i] of this.memberIds.entries()) {
      if (i === id) {
        return n;
      }
    }
    return "";
  }
  getMemberIdFromName(name: string) {
    return this.memberIds.get(name) || 0;
  }
  /**
   * messageQueueを消費
   *
   * messageQueueになにか追加するところで呼ぶこと
   */
  pushSend(msgs?: Message.AnyMessage[]) {
    if (msgs != undefined) {
      this.messageQueue.push(Message.pack(msgs));
    }
    if (this.ws != null) {
      for (const msg of this.messageQueue) {
        this.ws.send(msg);
      }
      this.messageQueue = [];
    }
  }
}

export class SyncDataStore2<T> {
  dataSend: Map<string, T>;
  dataSendPrev: Map<string, T>;
  dataRecv: Map<string, Map<string, T>>;
  entry: Map<string, string[]>;
  req: Map<string, Map<string, number>>;
  selfMemberName: string;
  constructor(name: string) {
    this.selfMemberName = name;
    this.dataSend = new Map();
    this.dataSendPrev = new Map();
    this.dataRecv = new Map();
    this.entry = new Map();
    this.req = new Map();
  }
  isSelf(member: string) {
    return this.selfMemberName === member;
  }
  //! 送信するデータをdata_sendとdata_recv[self_member_name]にセット
  setSend(field: string, data: T) {
    this.dataSend.set(field, data);
    this.setRecv(this.selfMemberName, field, data);
  }
  //! 受信したデータをdata_recvにセット
  setRecv(member: string, field: string, data: T) {
    const m = this.dataRecv.get(member);
    if (m) {
      m.set(field, data);
    } else {
      this.dataRecv.set(member, new Map([[field, data]]));
    }
  }
  getMaxReq() {
    let maxReq = 0;
    for (const [, r] of this.req.entries()) {
      for (const [, ri] of r.entries()) {
        if (ri > maxReq) {
          maxReq = ri;
        }
      }
    }
    return maxReq;
  }
  /**
   * リクエストされてなければリクエストし新しいidを返す
   *
   * すでにリクエストされてれば0
   */
  addReq(member: string, field: string) {
    if (!this.isSelf(member) && !this.req.get(member)?.get(field)) {
      const m = this.req.get(member);
      const newReq = this.getMaxReq() + 1;
      if (m) {
        m.set(field, newReq);
      } else {
        this.req.set(member, new Map([[field, newReq]]));
      }
      return newReq;
    }
    return 0;
  }
  //! data_recvからデータを返す
  getRecv(member: string, field: string) {
    const m = this.dataRecv.get(member)?.get(field);
    if (m != undefined) {
      return m;
    }
    return null;
  }
  //! data_recvからデータを削除, req,req_sendをfalseにする
  unsetRecv(member: string, field: string) {
    if (!this.isSelf(member) && !!this.req.get(member)?.get(field)) {
      this.req.get(member)?.set(field, 0);
    }
    this.dataRecv.get(member)?.delete(field);
  }
  //! member名のりすとを取得(entryから)
  getMembers() {
    return Array.from(this.entry.keys());
  }
  //! entryを取得
  getEntry(member: string) {
    return this.entry.get(member) || [];
  }
  //! entryにmember名のみ追加
  addMember(member: string) {
    this.entry.set(member, []);
  }
  //! 受信したentryを追加
  setEntry(member: string, e: string) {
    this.entry.set(member, this.getEntry(member).concat([e]));
  }
  //! data_sendを返し、data_sendをクリア
  transferSend(isFirst: boolean) {
    if (isFirst) {
      this.dataSend = new Map();
      // dataSendPrevはdataRecvが書き換えられても影響しないようコピーする
      this.dataSendPrev = new Map();
      const dataCurrent =
        this.dataRecv.get(this.selfMemberName) || new Map<string, T>();
      for (const [k, v] of dataCurrent.entries()) {
        this.dataSendPrev.set(k, v);
      }
      return dataCurrent;
    } else {
      const s = this.dataSend;
      this.dataSendPrev = s;
      this.dataSend = new Map();
      return s;
    }
  }
  getSendPrev(isFirst: boolean) {
    if (isFirst) {
      return new Map<string, T>();
    } else {
      return this.dataSendPrev;
    }
  }
  //! req_sendを返し、req_sendをクリア
  transferReq() {
    return this.req;
  }
  getReq(i: number, subField: string) {
    for (const [rm, r] of this.req.entries()) {
      for (const [rf, ri] of r.entries()) {
        if (ri == i) {
          return [rm, subField !== "" ? rf + "." + subField : rf];
        }
      }
    }
    return ["", ""];
  }
}

export class SyncDataStore1<T> {
  dataRecv: Map<string, T>;
  req: Map<string, boolean>;
  selfMemberName: string;
  constructor(name: string) {
    this.selfMemberName = name;
    this.dataRecv = new Map();
    this.req = new Map();
  }
  isSelf(member: string) {
    return this.selfMemberName === member;
  }
  setRecv(member: string, data: T) {
    this.dataRecv.set(member, data);
  }
  addReq(member: string) {
    if (!this.isSelf(member) && this.req.get(member) !== true) {
      this.req.set(member, true);
      return true;
    }
    return false;
  }
  getRecv(member: string) {
    const m = this.dataRecv.get(member);
    if (m != undefined) {
      return m;
    }
    return null;
  }
  unsetRecv(member: string) {
    this.dataRecv.delete(member);
  }
  transferReq() {
    return this.req;
  }
}

export class FuncResultStore {
  results: AsyncFuncResult[] = [];
  addResult(caller: string, base: Field) {
    const callerId = this.results.length;
    this.results.push(new AsyncFuncResult(callerId, caller, base));
    return this.results[callerId];
  }
  getResult(callerId: number) {
    return this.results[callerId];
  }
}

import isEqual from "lodash.isequal";
import { FuncInfo, FuncPromiseData } from "./func.js";
import { EventEmitter } from "eventemitter3";
import { LogLine } from "./log.js";
import * as Message from "./message.js";
import { Field } from "./field.js";
import websocket from "websocket";
import { ImageFrame, ImageReq } from "./image.js";

export interface Canvas2DData {
  width: number;
  height: number;
  components: Message.Canvas2DComponent[];
}
export interface LogData {
  data: LogLine[];
  sentLines: number;
}
export class ClientData {
  selfMemberName: string;
  valueStore: SyncDataStore2<number[]>;
  textStore: SyncDataStore2<string | number | boolean>;
  funcStore: SyncDataStore2<FuncInfo>;
  viewStore: SyncDataStore2<Message.ViewComponent[]>;
  imageStore: SyncDataStore2<ImageFrame, ImageReq>;
  robotModelStore: SyncDataStore2<Message.RobotLink[]>;
  canvas3DStore: SyncDataStore2<Message.Canvas3DComponent[]>;
  canvas2DStore: SyncDataStore2<Canvas2DData>;
  logStore: SyncDataStore2<LogData>;
  syncTimeStore: SyncDataStore1<Date>;
  funcResultStore: FuncResultStore;
  memberIds: Map<string, number>;
  memberLibName: Map<number, string>;
  memberLibVer: Map<number, string>;
  memberRemoteAddr: Map<number, string>;
  eventEmitter: EventEmitter;
  svrName = "";
  svrVersion = "";
  selfMemberId = 0;
  svrHostName = "";
  pingStatus: Map<number, number>;
  pingStatusReq = false;
  pingStatusReqSend = false;
  host: string;
  port: number;
  closing = false;
  connectionStarted = false;
  ws: null | websocket.w3cwebsocket = null;
  messageQueue: ArrayBuffer[] = [];
  logLevel: "trace" | "verbose" | "none";
  constructor(
    name: string,
    host = "",
    port = -1,
    logLevel: "trace" | "verbose" | "none" = "none"
  ) {
    this.selfMemberName = name;
    this.host = host;
    this.port = port;
    this.valueStore = new SyncDataStore2<number[]>(
      name,
      SyncDataStore2.shouldSendOnChange
    );
    this.textStore = new SyncDataStore2<string | number | boolean>(
      name,
      SyncDataStore2.shouldSendOnChange
    );
    this.funcStore = new SyncDataStore2<FuncInfo>(
      name,
      SyncDataStore2.shouldNotSendTwice
    );
    this.viewStore = new SyncDataStore2<Message.ViewComponent[]>(name);
    this.imageStore = new SyncDataStore2<ImageFrame, ImageReq>(name);
    this.robotModelStore = new SyncDataStore2<Message.RobotLink[]>(name);
    this.canvas3DStore = new SyncDataStore2<Message.Canvas3DComponent[]>(name);
    this.canvas2DStore = new SyncDataStore2<Canvas2DData>(name);
    this.logStore = new SyncDataStore2<LogData>(name);
    this.syncTimeStore = new SyncDataStore1<Date>(name);
    this.funcResultStore = new FuncResultStore();
    this.memberIds = new Map<string, number>();
    this.memberLibName = new Map<number, string>();
    this.memberLibVer = new Map<number, string>();
    this.memberRemoteAddr = new Map<number, string>();
    this.eventEmitter = new EventEmitter();
    this.pingStatus = new Map<number, number>();
    this.logLevel = logLevel;
  }
  get consoleLogger() {
    const traceEnabled =
      (typeof process !== "undefined" && process?.env?.WEBCFACE_TRACE) ||
      this.logLevel === "trace";
    const verboseEnabled =
      traceEnabled ||
      (typeof process !== "undefined" && process?.env?.WEBCFACE_VERBOSE) ||
      this.logLevel === "verbose";
    return {
      trace: (msg: string) =>
        traceEnabled && console.log("webcface trace: " + msg),
      info: (msg: string) =>
        verboseEnabled && console.log("webcface info: " + msg),
      warn: (msg: string) =>
        verboseEnabled && console.warn("webcface warn: " + msg),
      error: (msg: string) =>
        verboseEnabled && console.error("webcface error: " + msg),
    } as const;
  }

  isSelf(member: string) {
    return this.selfMemberName === member;
  }
  getMemberNameFromId(id: number) {
    if (id == this.selfMemberId) {
      return this.selfMemberName;
    }
    for (const [n, i] of this.memberIds.entries()) {
      if (i === id) {
        return n;
      }
    }
    return "";
  }
  getMemberIdFromName(name: string) {
    if (name === this.selfMemberName) {
      return this.selfMemberId;
    } else {
      return this.memberIds.get(name) || 0;
    }
  }

  /**
   * 次回接続後一番最初に送信するメッセージ
   * 
   * * syncDataFirst() の返り値であり、
   * すべてのリクエストとすべてのsyncデータ(1時刻分)が含まれる
   * * sync()時に未接続かつこれが空ならその時点のsyncDataFirstをこれにセット
   * * 接続時にこれが空でなければ、
   *   * これ + messageQueueの中身(=syncDataFirst以降のすべてのsync()データ) を、
   *   * これが空ならその時点のsyncDataFirstを、
   * * 送信する
   * * 切断時に再度これを空にする
   */
  syncFirst: ArrayBuffer | null = null;
  /**
   * messageQueueにたまっているメッセージを処理
   */
  sendMsg() {
    if (this.ws != null) {
      for (const msg of this.messageQueue) {
        this.ws.send(msg);
      }
      this.messageQueue = [];
    }    
  }
  /**
   * メッセージを追加 & messageQueueを消費
   *
   * messageQueueになにか追加するところで呼ぶこと
   */
  pushSendAlways(msgs?: Message.AnyMessage[]) {
    if (msgs != undefined) {
      this.messageQueue.push(Message.pack(msgs));
    }
    this.sendMsg();
  }
  /**
   * 接続されている場合に限ってメッセージを追加しtrueを返す
   */
  pushSendOnline(msgs?: Message.AnyMessage[]) {
    if (this.ws != null) {
      if (msgs != undefined) {
        this.messageQueue.push(Message.pack(msgs));
      }
      this.sendMsg();
      return true;
    }else{
      return false;
    }
  }
  /**
   * sync_firstが空でなければメッセージをキューに入れtrueを返す
   */
  pushSendReq(msgs?: Message.AnyMessage[]) {
    if (this.syncFirst != null) {
      if (msgs != undefined) {
        this.messageQueue.push(Message.pack(msgs));
      }
      this.sendMsg();
      return true;
    }else{
      return false;
    }
  }
}

export class SyncDataStore2<T, ReqT = never> {
  dataSend: Map<string, T>;
  dataSendPrev: Map<string, T>;
  dataRecv: Map<string, Map<string, T>>;
  entry: Map<string, string[]>;
  req: Map<string, Map<string, number>>;
  reqInfo: Map<string, Map<string, ReqT>>;
  selfMemberName: string;
  shouldSend: (prev: T | undefined, current: T) => boolean;

  static shouldSendAlways = () => true;
  static shouldNotSendTwice = (prev: any) => prev === undefined;
  static shouldSendOnChange = (prev: any, current: any) =>
    prev === undefined || !isEqual(prev, current);

  constructor(
    name: string,
    shouldSend?: (prev: T | undefined, current: T) => boolean
  ) {
    this.selfMemberName = name;
    this.dataSend = new Map();
    this.dataSendPrev = new Map();
    this.dataRecv = new Map();
    this.entry = new Map();
    this.req = new Map();
    this.reqInfo = new Map();
    this.shouldSend = shouldSend || SyncDataStore2.shouldSendAlways;
  }
  isSelf(member: string) {
    return this.selfMemberName === member;
  }
  /**
   * 送信するデータをdata_sendとdata_recv[self_member_name]にセット
   */
  setSend(field: string, data: T) {
    if (
      this.shouldSend(this.dataRecv.get(this.selfMemberName)?.get(field), data)
    ) {
      this.dataSend.set(field, data);
    }
    this.setRecv(this.selfMemberName, field, data);
  }
  /**
   * 受信したデータをdata_recvにセット
   */
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
   * リクエストされてなければリクエストする
   *
   * @param option undefinedでなく前回のoptionと異なる場合すでにリクエストされてても更新する
   * @return リクエストid, すでにリクエストされてれば0
   */
  addReq(member: string, field: string, option?: ReqT) {
    if (
      !this.isSelf(member) &&
      (!this.req.get(member)?.get(field) ||
        (option !== undefined &&
          !isEqual(option, this.reqInfo.get(member)?.get(field))))
    ) {
      const m = this.req.get(member);
      const newReq = this.req.get(member)?.get(field) || this.getMaxReq() + 1;
      if (m) {
        m.set(field, newReq);
      } else {
        this.req.set(member, new Map([[field, newReq]]));
      }
      if (option !== undefined) {
        const m = this.reqInfo.get(member);
        if (m) {
          m.set(field, option);
        } else {
          this.reqInfo.set(member, new Map([[field, option]]));
        }
      }
      return newReq;
    }
    return 0;
  }
  /**
   * data_recvからデータを返す
   */
  getRecv(member: string, field: string) {
    const m = this.dataRecv.get(member)?.get(field);
    if (m != undefined) {
      return m;
    }
    return null;
  }
  /**
   * dataRecvからデータを削除
   */
  clearRecv(member: string, field: string) {
    this.dataRecv.get(member)?.delete(field);
  }
  /**
   * data_recvからデータを削除, req,req_sendをfalseにする
   */
  unsetRecv(member: string, field: string) {
    if (!this.isSelf(member) && !!this.req.get(member)?.get(field)) {
      this.req.get(member)?.set(field, 0);
    }
    this.dataRecv.get(member)?.delete(field);
  }
  /**
   * member名のりすとを取得(entryから)
   */
  getMembers() {
    return Array.from(this.entry.keys());
  }
  /**
   * entryを取得
   */
  getEntry(member: string) {
    return this.entry.get(member) || [];
  }
  /**
   * entryにmember名のみ追加
   */
  addMember(member: string) {
    this.entry.set(member, []);
  }
  /**
   * 受信したentryを追加
   */
  setEntry(member: string, e: string) {
    this.entry.set(member, this.getEntry(member).concat([e]));
  }
  /**
   * data_sendを返し、data_sendをクリア
   */
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
  /**
   * req_sendを返す
   */
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
  getReqInfo(member: string, field: string) {
    return this.reqInfo.get(member)?.get(field);
  }
}

export class SyncDataStore1<T> {
  dataRecv: Map<string, T>;
  req: Map<string, boolean>;
  entry: Set<string>;
  selfMemberName: string;
  constructor(name: string) {
    this.selfMemberName = name;
    this.dataRecv = new Map();
    this.entry = new Set();
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
  /**
   * entryを取得
   */
  getEntry(member: string): boolean {
    return this.entry.has(member);
  }
  /**
   * 受信したentryを追加
   */
  setEntry(member: string) {
    this.entry.add(member);
  }
  /**
   * entry削除
   */
  clearEntry(member: string) {
    this.entry.delete(member);
  }
}

export class FuncResultStore {
  results: FuncPromiseData[] = [];
  addResult(caller: string, base: Field) {
    const callerId = this.results.length;
    this.results.push(new FuncPromiseData(callerId, caller, base));
    return this.results[callerId];
  }
  getResult(callerId: number) {
    return this.results[callerId];
  }
}

import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { Member } from "./member.js";
import { AsyncFuncResult, runFunc, Val } from "./func.js";
import { log4jsLevelConvert, LogLine } from "./logger.js";
import { getViewDiff, mergeViewDiff } from "./view.js";
import websocket from "websocket";
const w3cwebsocket = websocket.w3cwebsocket;
import util from "util";
import { Levels, LoggingEvent, AppenderModule } from "log4js";
import { getLogger } from "@log4js-node/log4js-api";
import { Field, FieldBase } from "./field.js";
import { EventTarget, eventType } from "./event.js";
import version from "./version.js";
import { Client } from "./client.js";

export function reconnect(wcli: Client, data: ClientData) {
  if (data.closing) {
    return;
  }
  if (data.port == -1) {
    // テスト用
    return;
  }
  console.debug(`reconnecting to ws://${data.host}:${data.port}`);
  const ws = new w3cwebsocket(`ws://${data.host}:${data.port}`);
  setTimeout(() => {
    if (data.ws == null) {
      console.warn("connection timeout");
      reconnect(wcli, data);
    }
  }, 1000);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => {
    if (data.ws == null) {
      data.ws = ws;
      console.log("connected");
      ws.onmessage = (event: { data: string | ArrayBuffer | Buffer }) =>
        onMessage(wcli, data, event);
      ws.onerror = () => {
        console.warn("connection error");
        ws.close();
        data.ws = null;
        if (!data.closing) {
          setTimeout(() => reconnect(wcli, data), 1000);
        }
      };
      ws.onclose = () => {
        console.warn("closed");
        data.ws = null;
        syncDataFirst(data);
        if (!data.closing) {
          setTimeout(() => reconnect(wcli, data), 1000);
        }
      };
      data.pushSend();
    }
  };
}

/**
 * 初期化時に送信するメッセージをキューに入れる
 * 各種reqとsyncData(true)の全データ
 */
export function syncDataFirst(data: ClientData) {
  const msg: Message.AnyMessage[] = [];
  msg.push({
    kind: Message.kind.syncInit,
    M: data.selfMemberName,
    m: 0,
    l: "js",
    v: version,
    a: "",
  });

  for (const [k, v] of data.valueStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.valueReq, M: k, f: k2, i: v2 });
    }
  }

  for (const [k, v] of data.textStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.textReq, M: k, f: k2, i: v2 });
    }
  }
  for (const [k, v] of data.viewStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.viewReq, M: k, f: k2, i: v2 });
    }
  }

  for (const [k] of data.logStore.transferReq().entries()) {
    msg.push({ kind: Message.kind.logReq, M: k });
  }

  if (data.pingStatusReq) {
    msg.push({ kind: Message.kind.pingStatusReq });
  }

  data.pushSend(msg);

  syncData(data, true);
}

export function syncData(data: ClientData, isFirst: boolean) {
  const msg: Message.AnyMessage[] = [];

  msg.push({ kind: Message.kind.sync, m: 0, t: new Date().getTime() });

  for (const [k, v] of data.valueStore.transferSend(isFirst).entries()) {
    msg.push({ kind: Message.kind.value, f: k, d: v });
  }
  for (const [k, v] of data.textStore.transferSend(isFirst).entries()) {
    msg.push({ kind: Message.kind.text, f: k, d: v });
  }
  const viewPrev = data.viewStore.getSendPrev(isFirst);
  for (const [k, v] of data.viewStore.transferSend(isFirst).entries()) {
    const vPrev = viewPrev.get(k) || [];
    const diff = getViewDiff(v, vPrev);
    msg.push({ kind: Message.kind.view, f: k, d: diff, l: v.length });
  }

  for (const [k, v] of data.funcStore.transferSend(isFirst).entries()) {
    if (!v.hidden) {
      msg.push({
        kind: Message.kind.funcInfo,
        f: k,
        r: v.returnType,
        a: v.args.map((a) => ({
          n: a.name || "",
          t: a.type !== undefined ? a.type : Message.valType.none_,
          i: a.init !== undefined ? a.init : null,
          m: a.min !== undefined ? a.min : null,
          x: a.max !== undefined ? a.max : null,
          o: a.option !== undefined ? a.option : [],
        })),
      });
    }
  }

  const logs = data.logStore.getRecv(data.selfMemberName) || [];
  if ((logs.length > 0 && isFirst) || logs.length > data.logSentLines) {
    const logSend = logs
      .slice(isFirst ? 0 : data.logSentLines)
      .map((l) => ({ v: l.level, t: l.time.getTime(), m: l.message }));
    data.logSentLines = logs.length;
    msg.push({ kind: Message.kind.log, l: logSend });
  }

  data.pushSend(msg);
}

export function onMessage(
  wcli: Client,
  data: ClientData,
  event: { data: string | ArrayBuffer | Buffer }
) {
  const messages = Message.unpack(event.data as ArrayBuffer);
  const syncMembers: string[] = [];
  for (const msg of messages) {
    switch (msg.kind) {
      case Message.kind.svrVersion: {
        const dataR = msg as Message.SvrVersion;
        data.svrName = dataR.n;
        data.svrVersion = dataR.v;
        break;
      }
      case Message.kind.ping: {
        data.pushSend([
          {
            kind: Message.kind.ping,
          },
        ]);
        break;
      }
      case Message.kind.pingStatus: {
        const dataR = msg as Message.PingStatus;
        const ps = new Map<number, number>();
        for (const [m, p] of Object.entries(dataR.s)) {
          ps.set(parseInt(m), p);
        }
        data.pingStatus = ps;
        for (const target of wcli.members()) {
          data.eventEmitter.emit(eventType.ping(target), target);
        }
        break;
      }
      case Message.kind.sync: {
        const dataR = msg as Message.Sync;
        const member = data.getMemberNameFromId(dataR.m);
        data.syncTimeStore.setRecv(member, new Date(dataR.t));
        syncMembers.push(member);
        break;
      }
      case Message.kind.valueRes: {
        const dataR = msg as Message.ValueRes;
        const [member, field] = data.valueStore.getReq(dataR.i, dataR.f);
        data.valueStore.setRecv(member, field, dataR.d);
        const target = wcli.member(member).value(field);
        data.eventEmitter.emit(eventType.valueChange(target), target);
        break;
      }
      case Message.kind.textRes: {
        const dataR = msg as Message.TextRes;
        const [member, field] = data.textStore.getReq(dataR.i, dataR.f);
        data.textStore.setRecv(member, field, dataR.d);
        const target = wcli.member(member).text(field);
        data.eventEmitter.emit(eventType.textChange(target), target);
        break;
      }
      case Message.kind.viewRes: {
        const dataR = msg as Message.ViewRes;
        const [member, field] = data.viewStore.getReq(dataR.i, dataR.f);
        const current = data.viewStore.getRecv(member, field) || [];
        const diff: Message.ViewComponentsDiff = {};
        for (const k of Object.keys(dataR.d)) {
          diff[k] = dataR.d[k];
        }
        mergeViewDiff(diff, dataR.l, current);
        data.viewStore.setRecv(member, field, current);
        const target = wcli.member(member).view(field);
        data.eventEmitter.emit(eventType.viewChange(target), target);
        break;
      }
      case Message.kind.log: {
        const dataR = msg as Message.Log;
        const member = data.getMemberNameFromId(dataR.m);
        const log = data.logStore.getRecv(member) || [];
        const target = wcli.member(member).log();
        for (const ll of dataR.l) {
          const ll2: LogLine = {
            level: ll.v,
            time: new Date(ll.t),
            message: ll.m,
          };
          log.push(ll2);
        }
        data.logStore.setRecv(member, log);
        data.eventEmitter.emit(eventType.logAppend(target), target);
        break;
      }
      case Message.kind.call: {
        setTimeout(() => {
          const dataR = msg as Message.Call;
          const s = data.funcStore.dataRecv.get(data.selfMemberName);
          const sendResult = (res: Val | void) => {
            data.pushSend([
              {
                kind: Message.kind.callResult,
                i: dataR.i,
                c: dataR.c,
                e: false,
                r: res === undefined ? "" : res,
              },
            ]);
          };
          const sendError = (e: any) => {
            data.pushSend([
              {
                kind: Message.kind.callResult,
                i: dataR.i,
                c: dataR.c,
                e: true,
                r: (e as Error).toString(),
              },
            ]);
          };
          const sendResponse = (s: boolean) => {
            data.pushSend([
              {
                kind: Message.kind.callResponse,
                i: dataR.i,
                c: dataR.c,
                s: s,
              },
            ]);
          };
          if (s) {
            const m = s.get(dataR.f);
            if (m) {
              sendResponse(true);
              try {
                const res = runFunc(m, dataR.a);
                if (res instanceof Promise) {
                  res
                    .then((res: Val | void) => sendResult(res))
                    .catch((e: any) => sendError(e));
                } else {
                  sendResult(res);
                }
              } catch (e: any) {
                sendError(e);
              }
            } else {
              sendResponse(false);
            }
          } else {
            sendResponse(false);
          }
        });
        break;
      }
      case Message.kind.callResponse: {
        const dataR = msg as Message.CallResponse;
        const r = data.funcResultStore.getResult(dataR.i);
        if (r !== undefined) {
          r.resolveStarted(dataR.s);
        } else {
          console.error(`error receiving call result id=${dataR.i}`);
        }
        break;
      }
      case Message.kind.callResult: {
        const dataR = msg as Message.CallResult;
        const r = data.funcResultStore.getResult(dataR.i);
        if (r !== undefined) {
          if (dataR.e) {
            r.rejectResult(new Error(String(dataR.r)));
          } else {
            r.resolveResult(dataR.r);
          }
        } else {
          console.error(`error receiving call result id=${dataR.i}`);
        }
        break;
      }
      case Message.kind.syncInit: {
        const dataR = msg as Message.SyncInit;
        data.valueStore.addMember(dataR.M);
        data.textStore.addMember(dataR.M);
        data.funcStore.addMember(dataR.M);
        data.logStore.unsetRecv(dataR.M);
        data.viewStore.addMember(dataR.M);
        data.syncTimeStore.unsetRecv(dataR.M);
        data.memberIds.set(dataR.M, dataR.m);
        data.memberLibName.set(dataR.m, dataR.l);
        data.memberLibVer.set(dataR.m, dataR.v);
        data.memberRemoteAddr.set(dataR.m, dataR.a);
        const target = wcli.member(dataR.M);
        data.eventEmitter.emit(eventType.memberEntry(), target);
        break;
      }
      case Message.kind.valueEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.valueStore.setEntry(member, dataR.f);
        const target = wcli.member(member).value(dataR.f);
        data.eventEmitter.emit(eventType.valueEntry(target), target);
        break;
      }
      case Message.kind.textEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.textStore.setEntry(member, dataR.f);
        const target = wcli.member(member).text(dataR.f);
        data.eventEmitter.emit(eventType.textEntry(target), target);
        break;
      }
      case Message.kind.viewEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.viewStore.setEntry(member, dataR.f);
        const target = wcli.member(member).view(dataR.f);
        data.eventEmitter.emit(eventType.viewEntry(target), target);
        break;
      }
      case Message.kind.funcInfo: {
        const dataR = msg as Message.FuncInfo;
        const member = data.getMemberNameFromId(dataR.m);
        data.funcStore.setEntry(member, dataR.f);
        data.funcStore.setRecv(member, dataR.f, {
          returnType: dataR.r,
          args: dataR.a.map((a) => ({
            name: a.n,
            type: a.t,
            init: a.i,
            min: a.m,
            max: a.x,
            option: a.o,
          })),
        });
        const target = wcli.member(member).func(dataR.f);
        data.eventEmitter.emit(eventType.funcEntry(target), target);
        break;
      }
      default: {
        console.error("invalid message kind", msg.kind);
      }
    }
  }
  for (const member of syncMembers) {
    const target = wcli.member(member);
    data.eventEmitter.emit(eventType.sync(target), target);
  }
}

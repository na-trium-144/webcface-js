import * as Message from "./message.js";
import { ClientData } from "./clientData.js";
import { runFunc, Val } from "./func.js";
import { LogLine } from "./logger.js";
import { getDiff, mergeDiff } from "./view.js";
import websocket from "websocket";
const w3cwebsocket = websocket.w3cwebsocket;
import { eventType } from "./event.js";
import version from "./version.js";
import { Client } from "./client.js";
import { ImageFrame, imageCompressMode } from "./image.js";

export function reconnect(wcli: Client, data: ClientData) {
  if (data.closing) {
    return;
  }
  if (data.port == -1) {
    // テスト用
    return;
  }
  data.consoleLogger.trace(`reconnecting to ws://${data.host}:${data.port}`);
  const ws = new w3cwebsocket(`ws://${data.host}:${data.port}`);
  setTimeout(() => {
    if (data.ws == null && !data.closing) {
      data.consoleLogger.trace("connection timeout");
      reconnect(wcli, data);
    }
  }, 1000);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => {
    if (data.ws == null) {
      data.ws = ws;
      data.consoleLogger.info("connected");
      ws.onmessage = (event: { data: string | ArrayBuffer | Buffer }) => {
        data.consoleLogger.trace(
          `onMessage ${(event.data as ArrayBuffer).byteLength}`
        );
        try {
          onMessage(wcli, data, event);
        } catch (e) {
          data.consoleLogger.error(`error in onMessage: ${String(e)}`);
        }
      };
      ws.onerror = (e) => {
        data.consoleLogger.warn(`connection error: ${String(e)}`);
        ws.close();
        data.ws = null;
        if (!data.closing) {
          setTimeout(() => reconnect(wcli, data), 1000);
        }
      };
      ws.onclose = (e) => {
        data.consoleLogger.warn(`closed: ${String(e.reason)}`);
        data.ws = null;
        syncDataFirst(data);
        if (!data.closing) {
          setTimeout(() => reconnect(wcli, data), 1000);
        }
      };
      data.pushSend(); // たまっているメッセージを送信
      if (data.closing) {
        data.ws = null;
        ws.close();
      }
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
  for (const [k, v] of data.robotModelStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.robotModelReq, M: k, f: k2, i: v2 });
    }
  }
  for (const [k, v] of data.viewStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.viewReq, M: k, f: k2, i: v2 });
    }
  }
  for (const [k, v] of data.canvas3DStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.canvas3DReq, M: k, f: k2, i: v2 });
    }
  }
  for (const [k, v] of data.canvas2DStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      msg.push({ kind: Message.kind.canvas2DReq, M: k, f: k2, i: v2 });
    }
  }
  for (const [k, v] of data.imageStore.transferReq().entries()) {
    for (const [k2, v2] of v.entries()) {
      const reqOption = data.imageStore.getReqInfo(k, k2);
      msg.push({
        kind: Message.kind.imageReq,
        M: k,
        f: k2,
        i: v2,
        w: reqOption?.width || null,
        h: reqOption?.height || null,
        l: reqOption?.colorMode || null,
        p: reqOption?.compressMode || imageCompressMode.raw,
        q: reqOption?.quality || 0,
      });
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
  for (const [k, v] of data.robotModelStore.transferSend(isFirst).entries()) {
    msg.push({ kind: Message.kind.robotModel, f: k, d: v });
  }
  const viewPrev = data.viewStore.getSendPrev(isFirst);
  for (const [k, v] of data.viewStore.transferSend(isFirst).entries()) {
    const vPrev = viewPrev.get(k) || [];
    const diff = getDiff<Message.ViewComponent>(v, vPrev);
    msg.push({ kind: Message.kind.view, f: k, d: diff, l: v.length });
  }
  const canvas3DPrev = data.canvas3DStore.getSendPrev(isFirst);
  for (const [k, v] of data.canvas3DStore.transferSend(isFirst).entries()) {
    const vPrev = canvas3DPrev.get(k) || [];
    const diff = getDiff<Message.Canvas3DComponent>(v, vPrev);
    msg.push({ kind: Message.kind.canvas3D, f: k, d: diff, l: v.length });
  }
  const canvas2DPrev = data.canvas2DStore.getSendPrev(isFirst);
  for (const [k, v] of data.canvas2DStore.transferSend(isFirst).entries()) {
    const vPrev = canvas2DPrev.get(k)?.components || [];
    const diff = getDiff<Message.Canvas2DComponent>(v.components, vPrev);
    msg.push({
      kind: Message.kind.canvas2D,
      f: k,
      w: v.width,
      h: v.height,
      d: diff,
      l: v.components.length,
    });
  }
  for (const [k, v] of data.imageStore.transferSend(isFirst).entries()) {
    msg.push({
      kind: Message.kind.image,
      f: k,
      w: v.width,
      h: v.height,
      d: v.data,
      l: v.colorMode,
      p: v.compressMode,
    });
  }

  for (const [k, v] of data.funcStore.transferSend(isFirst).entries()) {
    if (!k.startsWith(".")) {
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
      case Message.kind.syncInitEnd: {
        const dataR = msg as Message.SyncInitEnd;
        data.svrName = dataR.n;
        data.svrVersion = dataR.v;
        data.selfMemberId = dataR.m;
        data.svrHostName = dataR.h;
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
      case Message.kind.robotModelRes: {
        const dataR = msg as Message.RobotModelRes;
        const [member, field] = data.robotModelStore.getReq(dataR.i, dataR.f);
        data.robotModelStore.setRecv(member, field, dataR.d);
        const target = wcli.member(member).robotModel(field);
        data.eventEmitter.emit(eventType.robotModelChange(target), target);
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
        mergeDiff<Message.ViewComponent>(diff, dataR.l, current);
        data.viewStore.setRecv(member, field, current);
        const target = wcli.member(member).view(field);
        data.eventEmitter.emit(eventType.viewChange(target), target);
        break;
      }
      case Message.kind.canvas3DRes: {
        const dataR = msg as Message.Canvas3DRes;
        const [member, field] = data.canvas3DStore.getReq(dataR.i, dataR.f);
        const current = data.canvas3DStore.getRecv(member, field) || [];
        const diff: Message.Canvas3DComponentsDiff = {};
        for (const k of Object.keys(dataR.d)) {
          diff[k] = dataR.d[k];
        }
        mergeDiff<Message.Canvas3DComponent>(diff, dataR.l, current);
        data.canvas3DStore.setRecv(member, field, current);
        const target = wcli.member(member).canvas3D(field);
        data.eventEmitter.emit(eventType.canvas3DChange(target), target);
        break;
      }
      case Message.kind.canvas2DRes: {
        const dataR = msg as Message.Canvas2DRes;
        const [member, field] = data.canvas2DStore.getReq(dataR.i, dataR.f);
        const current =
          data.canvas2DStore.getRecv(member, field)?.components || [];
        const diff: Message.Canvas2DComponentsDiff = {};
        for (const k of Object.keys(dataR.d)) {
          diff[k] = dataR.d[k];
        }
        mergeDiff<Message.Canvas2DComponent>(diff, dataR.l, current);
        data.canvas2DStore.setRecv(member, field, {
          width: dataR.w,
          height: dataR.h,
          components: current,
        });
        const target = wcli.member(member).canvas2D(field);
        data.eventEmitter.emit(eventType.canvas2DChange(target), target);
        break;
      }
      case Message.kind.imageRes: {
        const dataR = msg as Message.ImageRes;
        const [member, field] = data.imageStore.getReq(dataR.i, dataR.f);
        data.imageStore.setRecv(
          member,
          field,
          new ImageFrame(dataR.w, dataR.h, dataR.d, dataR.l, dataR.p)
        );
        const target = wcli.member(member).image(field);
        data.eventEmitter.emit(eventType.imageChange(target), target);
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
          data.consoleLogger.error(`error receiving call result id=${dataR.i}`);
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
          data.consoleLogger.error(`error receiving call result id=${dataR.i}`);
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
        data.imageStore.addMember(dataR.M);
        data.robotModelStore.addMember(dataR.M);
        data.canvas3DStore.addMember(dataR.M);
        data.canvas2DStore.addMember(dataR.M);
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
      case Message.kind.robotModelEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.robotModelStore.setEntry(member, dataR.f);
        const target = wcli.member(member).robotModel(dataR.f);
        data.eventEmitter.emit(eventType.robotModelEntry(target), target);
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
      case Message.kind.canvas3DEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.canvas3DStore.setEntry(member, dataR.f);
        const target = wcli.member(member).canvas3D(dataR.f);
        data.eventEmitter.emit(eventType.canvas3DEntry(target), target);
        break;
      }
      case Message.kind.canvas2DEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.canvas2DStore.setEntry(member, dataR.f);
        const target = wcli.member(member).canvas2D(dataR.f);
        data.eventEmitter.emit(eventType.canvas2DEntry(target), target);
        break;
      }
      case Message.kind.imageEntry: {
        const dataR = msg as Message.Entry;
        const member = data.getMemberNameFromId(dataR.m);
        data.imageStore.setEntry(member, dataR.f);
        const target = wcli.member(member).image(dataR.f);
        data.eventEmitter.emit(eventType.imageEntry(target), target);
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
        data.consoleLogger.error(`invalid message kind ${msg.kind}`);
      }
    }
  }
  for (const member of syncMembers) {
    const target = wcli.member(member);
    data.eventEmitter.emit(eventType.sync(target), target);
  }
}

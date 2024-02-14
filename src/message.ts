import msgpack from "@ygoe/msgpack";
import { Val } from "./func.js";

export function unpack(msg: ArrayBuffer) {
  if (msg.byteLength === 0) {
    return [];
  }
  const m = msgpack.deserialize(msg) as any[];
  const ret: AnyMessage[] = [];
  for (let i = 0; i < m.length; i += 2) {
    ret.push({ ...(m[i + 1] as AnyMessage), kind: m[i] as number });
  }
  return ret;
}
export function pack(data: AnyMessage[]) {
  const sendData: any[] = [];
  for (let i = 0; i < data.length; i++) {
    sendData.push(data[i].kind);
    const e: { kind?: number } = { ...data[i] };
    delete e.kind;
    sendData.push(e);
  }
  return msgpack.serialize(sendData);
}

export const kind = {
  value: 0,
  text: 1,
  view: 3,
  canvas2D: 4,
  image: 5,
  robotModel: 6,
  canvas3D: 7,
  valueEntry: 20,
  textEntry: 21,
  viewEntry: 23,
  canvas2DEntry: 24,
  imageEntry: 25,
  robotModelEntry: 26,
  canvas3DEntry: 27,
  valueReq: 40,
  textReq: 41,
  viewReq: 43,
  canvas2DReq: 44,
  imageReq: 45,
  robotModelReq: 46,
  canvas3DReq: 47,
  valueRes: 60,
  textRes: 61,
  viewRes: 63,
  canvas2DRes: 64,
  imageRes: 65,
  robotModelRes: 66,
  canvas3DRes: 67,
  syncInit: 80,
  call: 81,
  callResponse: 82,
  callResult: 83,
  funcInfo: 84,
  log: 85,
  logReq: 86,
  sync: 87,
  svrVersion: 88,
  ping: 89,
  pingStatus: 90,
  pingStatusReq: 91,
} as const;

export const valType = {
  none_: 0,
  string_: 1,
  boolean_: 2,
  bool_: 2,
  int_: 3,
  float_: 4,
  number_: 4,
} as const;

export interface Value {
  kind: 0;
  f: string;
  d: number[];
}
export interface Text {
  kind: 1;
  f: string;
  d: string;
}
export type ViewComponentsDiff = {
  [key in string]: ViewComponent;
};
export interface ViewComponent {
  t: number;
  x: string;
  L: string | null;
  l: string | null;
  c: number;
  b: number;
}
export interface View {
  kind: 3;
  f: string;
  d: ViewComponentsDiff;
  l: number;
}
export type Canvas3DComponentsDiff = {
  [key in string]: Canvas3DComponent;
};
export interface Canvas3DComponent {
  t: number;
  op: number[];
  or: number[];
  c: number;
  gt: number | null;
  gp: number[];
  fm: string | null;
  ff: string | null;
  a: { [key in string]: number };
}
export interface Canvas3D {
  kind: 7;
  f: string;
  d: Canvas3DComponentsDiff;
  l: number;
}
export type Canvas2DComponentsDiff = {
  [key in string]: Canvas2DComponent;
};
export interface Canvas2DComponent {
  t: number;
  op: number[];
  or: number;
  c: number;
  f: number;
  s: number;
  gt: number | null;
  gp: number[];
}
export interface Canvas2D {
  kind: 4;
  f: string;
  w: number;
  h: number;
  d: Canvas2DComponentsDiff;
  l: number;
}

export interface Image {
  kind: 5;
  f: string;
  d: ArrayBuffer;
  w: number;
  h: number;
  l: number;
  p: number;
}

export interface RobotLink {
  n: string;
  jn: string;
  jp: number;
  jt: number;
  js: number[];
  jr: number[];
  ja: number;
  gt: number;
  gp: number[];
  c: number;
}
export interface RobotModel {
  kind: 6;
  f: string;
  d: RobotLink[];
}
export interface Entry {
  kind: 20 | 21 | 23 | 24 | 25 | 26 | 27;
  m: number;
  f: string;
}
export interface Req {
  kind: 40 | 41 | 43 | 44 | 46 | 47;
  M: string;
  f: string;
  i: number;
}
export interface ImageReq {
  kind: 45;
  M: string;
  f: string;
  i: number;
  w: number | null;
  h: number | null;
  l: number | null;
  p: number;
  q: number;
  r: number | null;
}
export interface ValueRes {
  kind: 60;
  i: number;
  f: string;
  d: number[];
}
export interface TextRes {
  kind: 61;
  i: number;
  f: string;
  d: string;
}
export interface ViewRes {
  kind: 63;
  i: number;
  f: string;
  d: ViewComponentsDiff;
  l: number;
}
export interface Canvas3DRes {
  kind: 67;
  i: number;
  f: string;
  d: Canvas3DComponentsDiff;
  l: number;
}
export interface Canvas2DRes {
  kind: 64;
  i: number;
  f: string;
  w: number;
  h: number;
  d: Canvas2DComponentsDiff;
  l: number;
}
export interface ImageRes {
  kind: 65;
  i: number;
  f: string;
  d: ArrayBuffer;
  w: number;
  h: number;
  l: number;
  p: number;
}
export interface RobotModelRes {
  kind: 66;
  i: number;
  f: string;
  d: RobotLink[];
}
export interface SyncInit {
  kind: 80;
  M: string;
  m: number;
  l: string;
  v: string;
  a: string;
}
export interface SvrVersion {
  kind: 88;
  n: string;
  v: string;
}
export interface Sync {
  kind: 87;
  m: number;
  t: number;
}
export interface Ping {
  kind: 89;
}
export interface PingStatus {
  kind: 90;
  s: { [member_id in number]: number };
}
export interface PingStatusReq {
  kind: 91;
}
export interface Call {
  kind: 81;
  i: number;
  c: number;
  r: number;
  f: string;
  a: Val[];
}
export interface CallResponse {
  kind: 82;
  i: number;
  c: number;
  s: boolean;
}
export interface CallResult {
  kind: 83;
  i: number;
  c: number;
  e: boolean;
  r: Val;
}

export interface Arg {
  n: string;
  t: number;
  i: Val | null;
  m: number | null;
  x: number | null;
  o: number[] | string[];
}
export interface FuncInfo {
  kind: 84;
  m: number;
  f: string;
  r: number;
  a: Arg[];
}

export interface LogLine {
  v: number;
  t: number;
  m: string;
}
export interface Log {
  kind: 85;
  m: number;
  l: LogLine[];
}
export interface LogReq {
  kind: 86;
  M: string;
}
export interface Unknown {
  kind: number;
}
export type AnyMessage =
  | Value
  | Text
  | View
  | Image
  | RobotModel
  | Canvas3D
  | Canvas2D
  | Req
  | ImageReq
  | Entry
  | ValueRes
  | TextRes
  | ViewRes
  | ImageRes
  | RobotModelRes
  | Canvas3DRes
  | Canvas2DRes
  | SyncInit
  | Sync
  | SvrVersion
  | Ping
  | PingStatus
  | PingStatusReq
  | Call
  | CallResponse
  | CallResult
  | FuncInfo
  | Log
  | LogReq
  | Unknown;

import { ClientData } from "./clientData.js";
import { FieldBase } from "./fieldBase.js";

export type Val = string | number | boolean;
export type FuncCallback = (...args: any[]) => Val | Promise<Val> | void;

export interface FuncInfo {
  returnType: number;
  args: Arg[];
  funcImpl?: FuncCallback;
  // call
}

export interface Arg {
  name?: string;
  type?: number;
  init?: Val | null;
  min?: number | null;
  max?: number | null;
  option?: string[] | number[];
}

export class FuncNotFoundError extends Error {
  constructor(base: FieldBase) {
    super(`member("${base.member_}").func("${base.field_}") is not set`);
    this.name = "FuncNotFoundError";
  }
}

export class FuncPromiseData {
  callerId: number;
  caller: string;
  reach: Promise<boolean>;
  resolveReach: (r: boolean) => void = () => undefined;
  finish: Promise<Val>;
  resolveFinish: (r: Val | Promise<Val>) => void = () => undefined;
  // 例外をセットする
  rejectFinish: (e: Error) => void = () => undefined;
  base: FieldBase;
  data: ClientData;

  constructor(callerId: number, caller: string, base: FieldBase, data: ClientData) {
    this.base = base;
    this.data = data
    this.callerId = callerId;
    this.caller = caller;
    this.reach = new Promise((res) => {
      this.resolveReach = (r: boolean) => {
        res(r);
        if (!r) {
          this.rejectFinish(new FuncNotFoundError(this.base));
        }
      };
    });
    this.finish = new Promise((res, rej) => {
      this.resolveFinish = res;
      this.rejectFinish = rej;
    });
  }
}

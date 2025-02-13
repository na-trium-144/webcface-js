import { Field } from "./field.js";
import { Value } from "./value.js";
import { EventTarget, eventType } from "./event.js";
import { Member } from "./member.js";
import * as Message from "./message.js";

export interface PlotSeries {
  values: Value[];
  color: number;
  type: number;
  xRange: [number, number];
  yRange: [number, number];
}

export const plotSeriesType = {
  trace1: 1,
  trace2: 2,
  scatter2: 3,
  line2: 4,
} as const;

/**
 * Plotを指すクラス
 *
 */
export class Plot extends EventTarget<Plot> {
  base_: Field;
  /**
   * このコンストラクタは直接使わず、
   * Member.plot(), Member.plotEntries(), Member.onPlotEntry などを使うこと
   */
  constructor(base: Field, field = "") {
    super("", base.data);
    this.base_ = new Field(base.data, base.member_, field || base.field_);
    this.eventType_ = eventType.plotChange(this.base_);
  }
  /**
   * Memberを返す
   */
  get member() {
    return new Member(this.base_);
  }
  /**
   * field名を返す
   */
  get name() {
    return this.base_.field_;
  }
  /**
   * 「(thisのフィールド名).(追加の名前)」をフィールド名とするPlot
   */
  child(field: string): Plot {
    return new Plot(this.base_.child(field));
  }
  /**
   * 値をリクエストする。
   */
  request() {
    const reqId = this.base_
      .dataCheck()
      .plotStore.addReq(this.base_.member_, this.base_.field_);
    if (reqId > 0) {
      this.base_.dataCheck().pushSendReq([
        {
          kind: Message.kind.plotReq,
          M: this.base_.member_,
          f: this.base_.field_,
          i: reqId,
        },
      ]);
    }
  }

  /**
   * plotのデータを返す
   */
  tryGet(): PlotSeries[] | null {
    this.request();
    return (
      this.base_
        .dataCheck()
        .plotStore.getRecv(this.base_.member_, this.base_.field_)
        ?.map((v) => ({
          values: v.V.map(
            (_, i) => new Value(new Field(this.base_.data, v.V[i], v.v[i]))
          ),
          color: v.c,
          type: v.t,
          xRange: [v.r[0], v.r[1]],
          yRange: [v.r[2], v.r[3]],
        })) || null
    );
  }
  /**
   * plotのデータを返す
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
   * このフィールドにデータが存在すればtrueを返す
   *
   * tryGet() とは違って、実際のデータを受信しない。
   * (リクエストも送信しない)
   */
  exists() {
    return this.base_
      .dataCheck()
      .plotStore.getEntry(this.base_.member_)
      .includes(this.base_.field_);
  }
  /**
   * PlotSeriesのリストをセットする
   */
  set(data: PlotSeries[]) {
    this.base_.setCheck().plotStore.setSend(
      this.base_.field_,
      data.map((c) => ({
        V: c.values.map((v) => v.base_.member_),
        v: c.values.map((v) => v.base_.field_),
        c: c.color,
        t: c.type,
        r: c.xRange.concat(c.yRange),
      }))
    );
    this.triggerEvent(this);
  }
}

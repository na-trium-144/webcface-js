import isEqual from "lodash.isequal";

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];

function rotMatToEuler(m: Mat3): Vec3 {
  if (m[0][0] == 0 && m[1][0] == 0) {
    // singular point cos(b)=0
    // let sin(a)=0, cos(a)=1
    return [
      0,
      -m[2][0] > 0 ? Math.PI / 2 : -Math.PI / 2,
      Math.atan2(-m[1][2], m[1][1]),
    ];
  } else {
    const a = Math.atan2(m[1][0], m[0][0]);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    return [
      a,
      Math.atan2(-m[2][0], m[0][0] * ca + m[1][0] * sa),
      Math.atan2(m[0][2] * sa - m[1][2] * ca, -m[0][1] * sa + m[1][1] * ca),
    ];
  }
}
function rotEulerToMat(e: Vec3): Mat3 {
  const c = e.map((a) => Math.cos(a));
  const s = e.map((a) => Math.sin(a));
  return [
    [
      c[0] * c[1],
      c[0] * s[1] * s[2] - s[0] * c[2],
      c[0] * s[1] * c[2] + s[0] * s[2],
    ],
    [
      s[0] * c[1],
      s[0] * s[1] * s[2] + c[0] * c[2],
      s[0] * s[1] * c[2] - c[0] * s[2],
    ],
    [-s[1], c[1] * s[2], c[1] * c[2]],
  ];
}
/**
 * x,y,zの3次元座標
 */
export class Point {
  protected _pos: Vec3 = [0, 0, 0];
  /**
   * @param pos 座標[x, y, z]
   */
  constructor(pos?: number[]) {
    if (pos != undefined) {
      this.pos = pos;
    }
  }
  /**
   * 平行移動(x, y, z)
   */
  get pos(): Vec3 {
    return this._pos;
  }
  /**
   * @param pos 座標[x, y, z]
   */
  set pos(pos: number[]) {
    if (pos.length == 3) {
      this._pos = pos.slice() as Vec3;
    } else if (pos.length == 2) {
      this._pos = [pos[0], pos[1], 0];
    } else {
      throw Error("invalid pos format for Point");
    }
  }
}
/**
 * 座標変換
 *
 * 内部ではx, y, zの座標とz-y-x系のオイラー角で保持している。
 */
export class Transform extends Point {
  private _rot: Vec3 = [0, 0, 0];
  /**
   * @param pos 座標[x, y, z] または 4x4の同次変換行列
   * @param rot z-y-xのオイラー角、または3x3の回転行列
   * posに同次変換行列を渡した場合rotは不要
   */
  constructor(pos?: number[] | number[][], rot?: number | number[] | number[][]) {
    super();
    if (pos !== undefined) {
      this.pos = pos;
    }
    if (rot !== undefined) {
      this.rot = rot;
    }
  }
  /**
   * 平行移動(x, y, z)
   */
  get pos(): Vec3 {
    return this._pos;
  }
  /**
   * @param pos 座標[x, y, z] または 4x4の同次変換行列
   */
  set pos(pos: number[] | number[][]) {
    if (
      pos.length == 4 &&
      !pos.map((r) => Array.isArray(r) && r.length == 4).includes(false)
    ) {
      this.tfMatrix = pos as number[][];
    } else if (pos.length == 3) {
      this._pos = pos.slice() as Vec3;
    } else if (pos.length == 2) {
      this._pos = [pos[0] as number, pos[1] as number, 0];
    } else {
      throw Error("invalid pos format for Transform");
    }
  }
  /**
   * 回転をz-y-x回転のオイラー角で表す。
   * @return [z, y, x]
   */
  get rot(): Vec3 {
    return this._rot;
  }
  /**
   * @param rot z-y-xのオイラー角、または3x3の回転行列
   */
  set rot(rot: number | number[] | number[][]) {
    if (typeof rot === "number") {
      this._rot = [rot, 0, 0];
    } else if (
      rot.length == 3 &&
      !rot.map((r) => Array.isArray(r) && r.length == 3).includes(false)
    ) {
      this.rotMatrix = rot as number[][];
    } else if (rot.length == 3) {
      this._rot = rot.slice() as Vec3;
    } else {
      throw Error("invalid rot format for Transform");
    }
  }
  /**
   * 回転行列を返す。
   * @return 3x3の行列 (numberの2次元配列)
   */
  get rotMatrix(): Mat3 {
    return rotEulerToMat(this.rot);
  }
  /**
   * 回転行列で回転を指定。
   * @param rot 3x3の行列 (numberの2次元配列)
   */
  set rotMatrix(rot: number[][]) {
    if (
      rot.length == 3 &&
      !rot.map((r) => Array.isArray(r) && r.length == 3).includes(false)
    ) {
      this.rot = rotMatToEuler(rot as Mat3);
    } else {
      throw Error("invalid rot format for Transform");
    }
  }
  /**
   * 同次変換行列を返す。
   * @return 4x4の行列 (numberの2次元配列)
   */
  get tfMatrix(): Mat4 {
    const r = this.rotMatrix;
    return [
      r[0].concat(this.pos[0]) as Vec4,
      r[1].concat(this.pos[1]) as Vec4,
      r[2].concat(this.pos[2]) as Vec4,
      [0, 0, 0, 1],
    ];
  }
  /**
   * 同次変換行列で座標と回転を指定。
   * @param m 4x4の行列 (numberの2次元配列)
   */
  set tfMatrix(pos: number[][]) {
    if (
      pos.length == 4 &&
      !pos.map((r) => Array.isArray(r) && r.length == 4).includes(false) &&
      isEqual(pos[3], [0, 0, 0, 1])
    ) {
      this.pos = pos.slice(0, 3).map((r) => r[3]);
      this.rotMatrix = pos.slice(0, 3).map((r) => r.slice(0, 3));
    } else {
      throw Error("invalid matrix format for Transform");
    }
  }
}

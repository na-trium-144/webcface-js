import { assert } from "chai";
import { Func } from "../src/func.js";
import { ClientData } from "../src/clientData.js";
import { Field } from "../src/field.js";
import { Member } from "../src/member.js";
import { valType } from "../src/message.js";
import * as Message from "../src/message.js";
import { FuncNotFoundError } from "../src/funcBase.js";

describe("Func Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const func = (member: string, field: string) =>
    new Func(new Field(data, member, field));
  beforeEach(function () {
    data = new ClientData(selfName);
    data.logLevel = "trace";
  });
  describe("#member", function () {
    it("returns Member object with its member name", function () {
      assert.instanceOf(func("a", "b").member, Member);
      assert.strictEqual(func("a", "b").member.name, "a");
    });
  });
  describe("#name", function () {
    it("returns field name", function () {
      assert.strictEqual(func("a", "b").name, "b");
    });
  });
  describe("#set()", function () {
    it("sets function, return type, and args information", function () {
      let called = 0;
      func(selfName, "a").set(() => ++called, valType.number_, [{ name: "a" }]);
      assert.isTrue(data.funcStore.dataRecv.get(selfName)?.has("a"));
      const fi = data.funcStore.dataRecv.get(selfName)?.get("a");
      if (fi?.funcImpl != undefined) {
        void fi.funcImpl();
      }
      assert.strictEqual(called, 1);
      assert.strictEqual(fi?.returnType, valType.number_);
      assert.isNotEmpty(fi?.args || []);
    });
    it("throws error when member is not self", function () {
      assert.throws(
        () => func("a", "b").set(() => undefined, valType.none_, []),
        Error
      );
    });
  });
  describe("#runAsync()", function () {
    let called: number;
    beforeEach(function () {
      called = 0;
      const callback = (a: string, b: number, c: boolean) => {
        assert.strictEqual(a, "5");
        assert.strictEqual(b, 123);
        assert.strictEqual(c, true);
        ++called;
        return "test";
      };
      data.funcStore.dataRecv.set(
        selfName,
        new Map([
          [
            "a",
            {
              funcImpl: callback,
              returnType: 0,
              args: [
                { name: "a", type: valType.string_ },
                { name: "b", type: valType.number_ },
                { name: "c", type: valType.boolean_ },
              ],
            },
          ],
        ])
      );
    });
    it("calls function with casted arguments, and returns FuncPromise object", async function () {
      const r = func(selfName, "a").runAsync(5, "123", 1);
      // assert.strictEqual(r.callerId, 0);
      assert.strictEqual(r.member.name, selfName);
      assert.strictEqual(r.name, "a");
      assert.isTrue(await r.started);
      assert.isTrue(await r.reach);
      assert.strictEqual(await r.result, "test");
      assert.strictEqual(await r.finish, "test");
      assert.strictEqual(called, 1);
    });
    it("returns AsyncFuncResult object which throws Error when fewer argument passed", function (done) {
      const r = func(selfName, "a").runAsync();
      r.reach
        .then((started) => assert.isFalse(started))
        .catch(() => assert.fail("r.started threw error"));
      r.finish
        .then(() => {
          assert.fail("r.result did not throw error");
        })
        .catch((e) => {
          assert.instanceOf(e, Error);
          done();
        });
    });
    it("returns AsyncFuncResult object which throws Error when more argument passed", function (done) {
      const r = func(selfName, "a").runAsync(1, 2, 3, 4, 5);
      r.reach
        .then((started) => assert.isFalse(started))
        .catch(() => assert.fail("r.started threw error"));
      r.finish
        .then(() => {
          assert.fail("r.result did not throw error");
          done();
        })
        .catch((e) => {
          assert.instanceOf(e, Error);
          done();
        });
    });
    it("returns AsyncFuncResult object which throws FuncNotFoundError when func is not set", function (done) {
      const r = func(selfName, "b").runAsync();
      r.started
        .then((started) => assert.isFalse(started))
        .catch(() => assert.fail("r.started threw error"));
      r.result
        .then(() => {
          assert.fail("r.result did not throw error");
          done();
        })
        .catch((e) => {
          assert.instanceOf(e, FuncNotFoundError);
          done();
        });
    });
    it("send call message when member is not self and ws is not null", function (done) {
      data.memberIds.set("a", 10);
      let send_called = 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data.ws = {
        send: (msg: ArrayBuffer) => {
          send_called++;
          const msg0 = Message.unpack(msg)[0] as Message.Call;
          assert.strictEqual(msg0.i, 0);
          assert.strictEqual(msg0.r, 10);
          assert.strictEqual(msg0.f, "b");
          assert.sameOrderedMembers(msg0.a, ["5", 123, true]);
        },
      } as any;
      func("a", "b").runAsync("5", 123, true);
      setTimeout(() => {
        assert.strictEqual(send_called, 1);
        done();
      }, 10);
    });
    it("do not push call message to data.messageQueue when ws is null", function (done) {
      data.memberIds.set("a", 10);
      func("a", "b").runAsync("5", 123, true);
      setTimeout(() => {
        assert.isEmpty(data.messageQueue);
        done();
      }, 10);
    });
  });
  describe("#returnType", function () {
    it("returns return type", function () {
      data.funcStore.dataRecv.set(
        "a",
        new Map([
          [
            "a",
            {
              returnType: valType.string_,
              args: [],
            },
          ],
        ])
      );
      assert.strictEqual(func("a", "a").returnType, valType.string_);
    });
    it("returns valType.none_ if func is not set", function () {
      assert.strictEqual(func("a", "a").returnType, valType.none_);
    });
  });
  describe("#args", function () {
    it("returns args information", function () {
      data.funcStore.dataRecv.set(
        "a",
        new Map([
          [
            "a",
            {
              returnType: valType.string_,
              args: [{ name: "a" }, { name: "b" }],
            },
          ],
        ])
      );
      assert.sameDeepOrderedMembers(func("a", "a").args, [
        { name: "a" },
        { name: "b" },
      ]);
    });
    it("returns empty array if func is not set", function () {
      assert.isArray(func("a", "a").args);
      assert.isEmpty(func("a", "a").args);
    });
  });
  describe("#free()", function () {
    it("removes info from data.funcStore.dataRecv", function () {
      data.funcStore.dataRecv.set(
        "a",
        new Map([
          [
            "a",
            {
              returnType: valType.string_,
              args: [],
            },
          ],
        ])
      );
      func("a", "a").free();
      assert.notExists(data.funcStore.dataRecv.get("a")?.get("a"));
    });
  });
});

import { assert } from "chai";
import { Client } from "../src/client.js";
import { WebSocketServer } from "ws";
import * as Message from "../src/message.js";
import { ClientData } from "../src/clientData.js";
import { Value } from "../src/value.js";
import { Text } from "../src/text.js";
import { RobotModel, RobotLink } from "../src/robotModel.js";
import { Transform } from "../src/transform.js";
import { Geometry } from "../src/canvas3d.js";
import { Func, AsyncFuncResult, FuncNotFoundError } from "../src/func.js";
import { valType } from "../src/message.js";
import { View, viewComponents } from "../src/view.js";
import { Field } from "../src/field.js";
import { Member } from "../src/member.js";
import { eventType } from "../src/event.js";
import log4js from "log4js";
import version from "../src/version.js";

describe("Client Tests", function () {
  const selfName = "test";
  let wcli: Client;
  let data: ClientData;
  let wss: WebSocketServer;
  let wssSend: (msg: Message.AnyMessage) => void;
  let wssRecv: Message.AnyMessage[];
  beforeEach(function (done) {
    wssRecv = [];
    wss = new WebSocketServer({ port: 37530 });
    wss.on("connection", (ws) => {
      ws.on("error", console.error);
      ws.on("message", (data) => {
        wssRecv = wssRecv.concat(Message.unpack(data as ArrayBuffer));
      });
      wssSend = (msg) => ws.send(Message.pack([msg]));
    });
    setTimeout(() => {
      wcli = new Client(selfName, "127.0.0.1", 37530, "trace");
      data = wcli.dataCheck();
      setTimeout(done, 10);
    }, 10);
  });
  afterEach(function (done) {
    wcli.close();
    wss.close();
    setTimeout(done, 10);
  });
  it("successfully connects with #start", function (done) {
    wcli.start();
    setTimeout(() => {
      assert.isTrue(wcli.connected);
      done();
    }, 10);
  });
  it("successfully connects with #sync", function (done) {
    wcli.sync();
    setTimeout(() => {
      assert.isTrue(wcli.connected);
      done();
    }, 10);
  });
  describe("#name", function () {
    it("returns self name", function () {
      assert.strictEqual(wcli.name, selfName);
    });
  });
  describe("#member()", function () {
    it("returns Member object", function () {
      const v = wcli.member("a");
      assert.instanceOf(v, Member);
      assert.strictEqual(v.name, "a");
    });
    it("returns Member object with self name if given name is empty", function () {
      const v = wcli.member("");
      assert.instanceOf(v, Member);
      assert.strictEqual(v.name, wcli.name);
    });
  });
  describe("#members()", function () {
    it("returns list of members in data.valueStore.entry", function () {
      data.valueStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(wcli.members());
      assert.lengthOf(wcli.members(), 1);
    });
    it("returns empty array by default", function () {
      assert.isArray(wcli.members());
      assert.isEmpty(wcli.members());
    });
  });
  describe("#onMemberEntry", function () {
    it("handles member entry event", function () {
      let called = 0;
      wcli.onMemberEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.memberEntry());
    });
  });
  describe("#serverName", function () {
    it("returns data.svrName", function () {
      data.svrName = "a";
      assert.strictEqual(wcli.serverName, "a");
    });
  });
  describe("#serverVersion", function () {
    it("returns data.svrVersion", function () {
      data.svrVersion = "a";
      assert.strictEqual(wcli.serverVersion, "a");
    });
  });
  describe("#serverHostName", function () {
    it("returns data.svrHostName", function () {
      data.svrHostName = "a";
      assert.strictEqual(wcli.serverHostName, "a");
    });
  });
  describe("#logAppender", function () {
    it("push log to data.logStore", function () {
      log4js.configure({
        appenders: {
          wcf: { type: wcli.logAppender },
        },
        categories: {
          default: { appenders: ["wcf"], level: "trace" },
        },
      });
      const logger = log4js.getLogger();
      logger.trace("a");
      logger.debug("b");
      logger.info("c");
      logger.warn("d");
      logger.error("e");
      logger.fatal("f");
      const ls = data.logStore.getRecv(selfName) || [];
      assert.lengthOf(ls, 6);
      assert.include(ls[0], { level: 0, message: "a" });
      assert.include(ls[1], { level: 1, message: "b" });
      assert.include(ls[2], { level: 2, message: "c" });
      assert.include(ls[3], { level: 3, message: "d" });
      assert.include(ls[4], { level: 4, message: "e" });
      assert.include(ls[5], { level: 5, message: "f" });
    });
  });
  describe("messages", function () {
    describe("sync", function () {
      it("send SyncInit at the first #sync() call", function (done) {
        wcli.sync();
        setTimeout(() => {
          assert.deepEqual(wssRecv[0], {
            kind: Message.kind.syncInit,
            M: selfName,
            m: 0,
            l: "js",
            v: version,
            a: "",
          });
          done();
        }, 10);
      });
      it("does not send SyncInit twice", function (done) {
        wcli.sync();
        setTimeout(() => {
          wssRecv = [];
          wcli.sync();
          setTimeout(() => {
            assert.notExists(
              wssRecv.find((m) => m.kind === Message.kind.syncInit)
            );
            done();
          }, 10);
        }, 10);
      });
      it("send SyncInit after connection if #sync() was called before connection", function (done) {
        const wcli2 = new Client("test2", "127.0.0.1", 37530);
        wcli2.sync();
        assert.isFalse(wcli2.connected);
        setTimeout(() => {
          assert.deepEqual(wssRecv[0], {
            kind: Message.kind.syncInit,
            M: "test2",
            m: 0,
            l: "js",
            v: version,
            a: "",
          });
          wcli2.close();
          done();
        }, 10);
      });
      it("send Sync every time", function (done) {
        wcli.sync();
        setTimeout(() => {
          assert.exists(wssRecv.find((m) => m.kind === Message.kind.sync));
          wssRecv = [];
          wcli.sync();
          setTimeout(() => {
            assert.exists(wssRecv.find((m) => m.kind === Message.kind.sync));
            done();
          }, 10);
        }, 10);
      });
      it("receiving sync", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onSync.on((v: Member) => {
            ++called;
            assert.strictEqual(v.name, "a");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({ kind: Message.kind.sync, m: 10, t: 1000 });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            done();
          }, 10);
        }, 10);
      });
      it("receiving server version", function (done) {
        wcli.start();
        setTimeout(() => {
          wssSend({
            kind: Message.kind.syncInitEnd,
            n: "a",
            v: "1",
            m: 5,
            h: "b",
          });
          setTimeout(() => {
            assert.strictEqual(data.svrName, "a");
            assert.strictEqual(data.svrVersion, "1");
            assert.strictEqual(data.svrHostName, "b");
            assert.strictEqual(data.selfMemberId, 5);
            done();
          }, 10);
        }, 10);
      });
    });
    describe("ping", function () {
      it("receive and send back ping", function (done) {
        wcli.start();
        setTimeout(() => {
          wssSend({ kind: Message.kind.ping });
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.ping
            ) as Message.Ping;
            assert.exists(m);
            done();
          }, 10);
        }, 10);
      });
      it("receiving ping status", function (done) {
        let called = 0;
        assert.isNull(wcli.member("a").pingStatus);
        wcli.member("a").onPing.on(() => ++called);
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.pingStatusReq
          ) as Message.PingStatusReq;
          assert.exists(m);

          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({
            kind: Message.kind.pingStatus,
            s: {
              10: 15,
            },
          });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.strictEqual(wcli.member("a").pingStatus, 15);
            done();
          }, 10);
        }, 10);
      });
    });
    describe("receiving entry", function () {
      it("member entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.onMemberEntry.on((m: Member) => {
            ++called;
            assert.strictEqual(m.name, "a");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "a",
            v: "1",
            a: "100",
          });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.members(), 1);
            assert.strictEqual(wcli.members()[0].name, "a");
            assert.strictEqual(data.memberIds.get("a"), 10);
            assert.strictEqual(data.memberLibName.get(10), "a");
            assert.strictEqual(data.memberLibVer.get(10), "1");
            assert.strictEqual(data.memberRemoteAddr.get(10), "100");
            done();
          }, 10);
        }, 10);
      });
      it("value entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onValueEntry.on((v: Value) => {
            ++called;
            assert.strictEqual(v.member.name, "a");
            assert.strictEqual(v.name, "b");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({ kind: Message.kind.valueEntry, m: 10, f: "b" });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.member("a").values(), 1);
            assert.isTrue(wcli.member("a").value("b").exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.lengthOf(wcli.member("a").values(), 0);
              assert.isFalse(wcli.member("a").value("b").exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("text entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onTextEntry.on((v: Text) => {
            ++called;
            assert.strictEqual(v.member.name, "a");
            assert.strictEqual(v.name, "b");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({ kind: Message.kind.textEntry, m: 10, f: "b" });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.member("a").texts(), 1);
            assert.isTrue(wcli.member("a").text("b").exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.lengthOf(wcli.member("a").texts(), 0);
              assert.isFalse(wcli.member("a").text("b").exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("robot model entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onRobotModelEntry.on((v: RobotModel) => {
            ++called;
            assert.strictEqual(v.member.name, "a");
            assert.strictEqual(v.name, "b");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({ kind: Message.kind.robotModelEntry, m: 10, f: "b" });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.member("a").robotModels(), 1);
            assert.isTrue(wcli.member("a").robotModel("b").exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.lengthOf(wcli.member("a").robotModels(), 0);
              assert.isFalse(wcli.member("a").robotModel("b").exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("view entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onViewEntry.on((v: View) => {
            ++called;
            assert.strictEqual(v.member.name, "a");
            assert.strictEqual(v.name, "b");
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({ kind: Message.kind.viewEntry, m: 10, f: "b" });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.member("a").views(), 1);
            assert.isTrue(wcli.member("a").view("b").exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.lengthOf(wcli.member("a").views(), 0);
              assert.isFalse(wcli.member("a").view("b").exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("log entry", function (done) {
        wcli.start();
        setTimeout(() => {
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({
            kind: Message.kind.logEntry,
            m: 10,
          });
          setTimeout(() => {
            assert.isTrue(wcli.member("a").log().exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.isFalse(wcli.member("a").log().exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("func entry", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          wcli.member("a").onFuncEntry.on((v: Func) => {
            ++called;
            assert.strictEqual(v.member.name, "a");
            assert.strictEqual(v.name, "b");
            assert.strictEqual(v.returnType, valType.number_);
            assert.lengthOf(v.args, 1);
          });
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({
            kind: Message.kind.funcInfo,
            m: 10,
            f: "b",
            r: valType.number_,
            a: [
              {
                n: "a",
                t: valType.number_,
                i: null,
                m: null,
                x: null,
                o: [],
              },
            ],
          });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(wcli.member("a").funcs(), 1);
            assert.isTrue(wcli.member("a").func("b").exists());
            wssSend({
              kind: Message.kind.syncInit,
              M: "a",
              m: 10,
              l: "",
              v: "",
              a: "",
            });
            setTimeout(() => {
              assert.lengthOf(wcli.member("a").funcs(), 0);
              assert.isFalse(wcli.member("a").func("b").exists());
              done();
            }, 10);
          }, 10);
        }, 10);
      });
    });
    describe("sending data", function () {
      it("value", function (done) {
        data.valueStore.setSend("a", [5]);
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.value
          ) as Message.Value;
          assert.strictEqual(m?.f, "a");
          assert.sameMembers(m?.d || [], [5]);
          done();
        }, 10);
      });
      it("text", function (done) {
        data.textStore.setSend("a", "b");
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.text
          ) as Message.Text;
          assert.strictEqual(m?.f, "a");
          assert.strictEqual(m?.d, "b");
          done();
        }, 10);
      });
      it("robotModel", function (done) {
        data.robotModelStore.setSend("a", [
          new RobotLink(
            "a",
            {
              name: "a",
              parentName: "",
              type: 0,
              origin: new Transform([0, 0, 0], [0, 0, 0]),
              angle: 0,
            },
            new Geometry(0, []),
            0
          ).toMessage([]),
        ]);
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.robotModel
          ) as Message.RobotModel;
          assert.strictEqual(m?.f, "a");
          assert.lengthOf(m?.d, 1);
          done();
        }, 10);
      });
      it("view", function (done) {
        data.viewStore.setSend("a", [
          viewComponents.text("a").toMessage(),
          viewComponents.newLine().toMessage(),
        ]);
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.view
          ) as Message.View;
          assert.strictEqual(m?.f, "a");
          assert.lengthOf(Object.keys(m?.d || {}), 2);
          assert.strictEqual(m?.l, 2);
          done();
        }, 10);
      });
      it("view diff only on second time", function (done) {
        data.viewStore.setSend("a", [
          viewComponents.text("a").toMessage(),
          viewComponents.newLine().toMessage(),
        ]);
        wcli.sync();
        setTimeout(() => {
          wssRecv = [];
          data.viewStore.setSend("a", [
            viewComponents.text("b").toMessage(),
            viewComponents.newLine().toMessage(),
          ]);
          wcli.sync();
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.view
            ) as Message.View;
            assert.strictEqual(m?.f, "a");
            assert.lengthOf(Object.keys(m?.d || {}), 1); // diff = 1
            assert.strictEqual(m?.l, 2);
            done();
          }, 10);
        }, 10);
      });
      it("func info", function (done) {
        data.funcStore.setSend("a", {
          returnType: valType.number_,
          args: [
            {
              name: "a",
              type: valType.number_,
              init: 3,
              min: null,
              max: null,
              option: [],
            },
          ],
        });
        wcli.sync();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.funcInfo
          ) as Message.FuncInfo;
          assert.strictEqual(m?.f, "a");
          assert.strictEqual(m?.r, valType.number_);
          assert.lengthOf(m?.a || [], 1);
          done();
        }, 10);
      });
      it("log", function (done) {
        data.logStore
          .getRecv(selfName)
          ?.push({ level: 0, time: new Date(), message: "a" });
        data.logStore
          .getRecv(selfName)
          ?.push({ level: 1, time: new Date(), message: "b" });
        wcli.sync();
        assert.exists(data.logStore.dataRecv.get(selfName));
        assert.lengthOf(data.logStore.dataRecv.get(selfName) || [], 2);
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.log
          ) as Message.Log;
          assert.lengthOf(m?.l || [], 2);
          assert.include(m?.l?.[0], { v: 0, m: "a" });
          assert.include(m?.l?.[1], { v: 1, m: "b" });
          wssRecv = [];

          // 追加分を送る
          data.logStore
            .getRecv(selfName)
            ?.push({ level: 2, time: new Date(), message: "c" });
          wcli.sync();
          assert.lengthOf(data.logStore.dataRecv.get(selfName) || [], 3);
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.log
            ) as Message.Log;
            assert.lengthOf(m?.l || [], 1);
            assert.include(m?.l?.[0], { v: 2, m: "c" });
            done();
          }, 10);
        }, 10);
      });
    });
    describe("data request", function () {
      it("value", function (done) {
        wcli.start();
        wcli.member("a").value("b").request();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.valueReq
          ) as Message.Req;
          assert.strictEqual(m?.M, "a");
          assert.strictEqual(m?.f, "b");
          assert.strictEqual(m?.i, 1);

          let called = 0;
          wcli
            .member("a")
            .value("b")
            .on(() => ++called);
          wssSend({ kind: Message.kind.valueRes, i: 1, f: "", d: [1, 2, 3] });
          wssSend({ kind: Message.kind.valueRes, i: 1, f: "c", d: [1, 2, 3] });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.isArray(data.valueStore.dataRecv.get("a")?.get("b"));
            assert.lengthOf(
              data.valueStore.dataRecv.get("a")?.get("b") || [],
              3
            );
            assert.isArray(data.valueStore.dataRecv.get("a")?.get("b.c"));
            assert.lengthOf(
              data.valueStore.dataRecv.get("a")?.get("b.c") || [],
              3
            );
            done();
          }, 10);
        }, 10);
      });
      it("text", function (done) {
        wcli.start();
        wcli.member("a").text("b").request();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.textReq
          ) as Message.Req;
          assert.strictEqual(m?.M, "a");
          assert.strictEqual(m?.f, "b");
          assert.strictEqual(m?.i, 1);

          let called = 0;
          wcli
            .member("a")
            .text("b")
            .on(() => ++called);
          wssSend({ kind: Message.kind.textRes, i: 1, f: "", d: "z" });
          wssSend({ kind: Message.kind.textRes, i: 1, f: "c", d: "z" });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.strictEqual(data.textStore.dataRecv.get("a")?.get("b"), "z");
            assert.strictEqual(
              data.textStore.dataRecv.get("a")?.get("b.c"),
              "z"
            );
            done();
          }, 10);
        }, 10);
      });
      it("robotModel", function (done) {
        wcli.start();
        wcli.member("a").robotModel("b").request();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.robotModelReq
          ) as Message.Req;
          assert.strictEqual(m?.M, "a");
          assert.strictEqual(m?.f, "b");
          assert.strictEqual(m?.i, 1);

          let called = 0;
          wcli
            .member("a")
            .robotModel("b")
            .on(() => ++called);
          const rm = [
            new RobotLink(
              "a",
              {
                name: "a",
                parentName: "",
                type: 0,
                origin: new Transform([0, 0, 0], [0, 0, 0]),
                angle: 0,
              },
              new Geometry(0, []),
              0
            ).toMessage([]),
          ];

          wssSend({ kind: Message.kind.robotModelRes, i: 1, f: "", d: rm });
          wssSend({ kind: Message.kind.robotModelRes, i: 1, f: "c", d: rm });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.lengthOf(
              data.robotModelStore.dataRecv.get("a")?.get("b") || [],
              1
            );
            assert.lengthOf(
              data.robotModelStore.dataRecv.get("a")?.get("b.c") || [],
              1
            );
            done();
          }, 10);
        }, 10);
      });
      it("view", function (done) {
        wcli.start();
        wcli.member("a").view("b").request();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.viewReq
          ) as Message.Req;
          assert.strictEqual(m?.M, "a");
          assert.strictEqual(m?.f, "b");
          assert.strictEqual(m?.i, 1);

          let called = 0;
          wcli
            .member("a")
            .view("b")
            .on(() => ++called);
          const v = {
            0: viewComponents.text("a").toMessage(),
            1: viewComponents.newLine().toMessage(),
          };
          wssSend({ kind: Message.kind.viewRes, i: 1, f: "", d: v, l: 2 });
          wssSend({ kind: Message.kind.viewRes, i: 1, f: "c", d: v, l: 2 });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.isArray(data.viewStore.dataRecv.get("a")?.get("b"));
            assert.lengthOf(
              data.viewStore.dataRecv.get("a")?.get("b") || [],
              2
            );
            assert.strictEqual(
              data.viewStore.dataRecv.get("a")?.get("b")?.[0]?.x,
              "a"
            );
            assert.isArray(data.viewStore.dataRecv.get("a")?.get("b.c"));
            assert.lengthOf(
              data.viewStore.dataRecv.get("a")?.get("b.c") || [],
              2
            );
            assert.strictEqual(
              data.viewStore.dataRecv.get("a")?.get("b.c")?.[0]?.x,
              "a"
            );

            // 2回目: diffを送る
            const v2 = {
              0: viewComponents.text("b").toMessage(),
            };
            wssSend({ kind: Message.kind.viewRes, i: 1, f: "", d: v2, l: 2 });
            wssSend({ kind: Message.kind.viewRes, i: 1, f: "c", d: v2, l: 2 });
            setTimeout(() => {
              assert.isArray(data.viewStore.dataRecv.get("a")?.get("b"));
              assert.lengthOf(
                data.viewStore.dataRecv.get("a")?.get("b") || [],
                2
              );
              assert.strictEqual(
                data.viewStore.dataRecv.get("a")?.get("b")?.[0]?.x,
                "b"
              );
              assert.isArray(data.viewStore.dataRecv.get("a")?.get("b.c"));
              assert.lengthOf(
                data.viewStore.dataRecv.get("a")?.get("b.c") || [],
                2
              );
              assert.strictEqual(
                data.viewStore.dataRecv.get("a")?.get("b.c")?.[0]?.x,
                "b"
              );
              done();
            }, 10);
          }, 10);
        }, 10);
      });
      it("log", function (done) {
        wcli.start();
        wcli.member("a").log().request();
        setTimeout(() => {
          const m = wssRecv.find(
            (m) => m.kind === Message.kind.logReq
          ) as Message.LogReq;
          assert.strictEqual(m?.M, "a");

          let called = 0;
          wcli
            .member("a")
            .log()
            .on(() => ++called);
          wssSend({
            kind: Message.kind.syncInit,
            M: "a",
            m: 10,
            l: "",
            v: "",
            a: "",
          });
          wssSend({
            kind: Message.kind.log,
            m: 10,
            l: [
              {
                v: 1,
                t: 1000,
                m: "a",
              },
              {
                v: 2,
                t: 1000,
                m: "b",
              },
            ],
          });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            assert.isArray(data.logStore.dataRecv.get("a"));
            assert.lengthOf(data.logStore.dataRecv.get("a") || [], 2);
            assert.strictEqual(data.logStore.dataRecv.get("a")?.[0]?.level, 1);
            assert.strictEqual(
              data.logStore.dataRecv.get("a")?.[0]?.time?.getTime(),
              1000
            );
            assert.strictEqual(
              data.logStore.dataRecv.get("a")?.[0]?.message,
              "a"
            );

            // 追加
            wssSend({
              kind: Message.kind.log,
              m: 10,
              l: [
                {
                  v: 3,
                  t: 1000,
                  m: "a",
                },
              ],
            });
            setTimeout(() => {
              assert.strictEqual(called, 2);
              assert.lengthOf(data.logStore.dataRecv.get("a") || [], 3);
              assert.strictEqual(
                data.logStore.dataRecv.get("a")?.[2]?.level,
                3
              );
              done();
            }, 10);
          }, 10);
        }, 10);
      });
    });
    describe("send func call", function () {
      it("send func call on data.callFunc()", function (done) {
        wcli.start();
        setTimeout(() => {
          data.memberIds.set("a", 10);
          const r = new AsyncFuncResult(1, "", new Field(data, "a", "b"));
          data.pushSend([
            {
              kind: Message.kind.call,
              i: r.callerId,
              c: 0,
              r: 10,
              f: "b",
              a: [1, true, "a"],
            },
          ]);
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.call
            ) as Message.Call;
            assert.strictEqual(m?.i, 1);
            assert.strictEqual(m?.r, 10);
            assert.strictEqual(m?.f, "b");
            assert.lengthOf(m?.a || [], 3);
            assert.strictEqual(m?.a[0], 1);
            assert.strictEqual(m?.a[1], true);
            assert.strictEqual(m?.a[2], "a");
            done();
          }, 10);
        }, 10);
      });
      it("receive response of not started", function (done) {
        wcli.start();
        setTimeout(() => {
          data.memberIds.set("a", 10);
          const r = data.funcResultStore.addResult(
            "",
            new Field(data, "a", "b")
          );
          assert.strictEqual(r.callerId, 0);
          data.pushSend([
            {
              kind: Message.kind.call,
              i: r.callerId,
              c: 0,
              r: 10,
              f: "b",
              a: [],
            },
          ]);
          setTimeout(() => {
            wssSend({
              kind: Message.kind.callResponse,
              i: 0,
              c: 0,
              s: false,
            });
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
          }, 10);
        }, 10);
      });
      it("receive error result", function (done) {
        wcli.start();
        setTimeout(() => {
          data.memberIds.set("a", 10);
          const r = data.funcResultStore.addResult(
            "",
            new Field(data, "a", "b")
          );
          data.pushSend([
            {
              kind: Message.kind.call,
              i: r.callerId,
              c: 0,
              r: 10,
              f: "b",
              a: [],
            },
          ]);
          setTimeout(() => {
            wssSend({
              kind: Message.kind.callResponse,
              i: 0,
              c: 0,
              s: true,
            });
            wssSend({
              kind: Message.kind.callResult,
              i: 0,
              c: 0,
              e: true,
              r: "aaa",
            });
            r.started
              .then((started) => assert.isFalse(started))
              .catch(() => assert.fail("r.started threw error"));
            r.result
              .then(() => {
                assert.fail("r.result did not throw error");
                done();
              })
              .catch((e) => {
                assert.instanceOf(e, Error);
                done();
              });
          }, 10);
        }, 10);
      });
      it("receive result", function (done) {
        wcli.start();
        setTimeout(() => {
          data.memberIds.set("a", 10);
          const r = data.funcResultStore.addResult(
            "",
            new Field(data, "a", "b")
          );
          data.pushSend([
            {
              kind: Message.kind.call,
              i: r.callerId,
              c: 0,
              r: 10,
              f: "b",
              a: [],
            },
          ]);
          setTimeout(() => {
            wssSend({
              kind: Message.kind.callResponse,
              i: 0,
              c: 0,
              s: true,
            });
            wssSend({
              kind: Message.kind.callResult,
              i: 0,
              c: 0,
              e: false,
              r: "aaa",
            });
            r.started
              .then((started) => assert.isTrue(started))
              .catch(() => assert.fail("r.started threw error"));
            r.result
              .then((res) => {
                assert.strictEqual(res, "aaa");
                done();
              })
              .catch((e) => {
                assert.fail(`r.result threw error ${String(e)}`);
                done();
              });
          }, 10);
        }, 10);
      });
    });
    describe("receive func call", function () {
      it("runs callback with arg", function (done) {
        wcli.start();
        setTimeout(() => {
          let called = 0;
          data.funcStore.setSend("a", {
            funcImpl: (a: number) => {
              ++called;
              assert.strictEqual(a, 100);
              return a + 1;
            },
            returnType: valType.number_,
            args: [
              {
                name: "a",
                type: valType.number_,
                init: null,
                min: null,
                max: null,
                option: [],
              },
            ],
          });
          wssSend({
            kind: Message.kind.call,
            i: 5,
            c: 10,
            r: 0,
            f: "a",
            a: [100],
          });
          setTimeout(() => {
            assert.strictEqual(called, 1);
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.callResponse
            ) as Message.CallResponse;
            assert.strictEqual(m?.i, 5);
            assert.strictEqual(m?.c, 10);
            assert.strictEqual(m?.s, true);
            const m2 = wssRecv.find(
              (m) => m.kind === Message.kind.callResult
            ) as Message.CallResult;
            assert.strictEqual(m2?.i, 5);
            assert.strictEqual(m2?.c, 10);
            assert.strictEqual(m2?.e, false);
            assert.strictEqual(m2?.r, 101);
            done();
          }, 10);
        }, 10);
      });
      it("send result with error when arg does not match", function (done) {
        wcli.start();
        setTimeout(() => {
          data.funcStore.setSend("a", {
            funcImpl: () => undefined,
            returnType: valType.number_,
            args: [
              {
                name: "a",
                type: valType.number_,
                init: null,
                min: null,
                max: null,
                option: [],
              },
            ],
          });
          wssSend({
            kind: Message.kind.call,
            i: 5,
            c: 10,
            r: 0,
            f: "a",
            a: [100, 100],
          });
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.callResponse
            ) as Message.CallResponse;
            assert.strictEqual(m?.s, true);
            const m2 = wssRecv.find(
              (m) => m.kind === Message.kind.callResult
            ) as Message.CallResult;
            assert.strictEqual(m2?.e, true);
            done();
          }, 10);
        }, 10);
      });
      it("send result with error when callback throws error", function (done) {
        wcli.start();
        setTimeout(() => {
          data.funcStore.setSend("a", {
            funcImpl: () => {
              throw new Error("aaa");
            },
            returnType: valType.none_,
            args: [],
          });
          wssSend({
            kind: Message.kind.call,
            i: 5,
            c: 10,
            r: 0,
            f: "a",
            a: [],
          });
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.callResponse
            ) as Message.CallResponse;
            assert.strictEqual(m?.s, true);
            const m2 = wssRecv.find(
              (m) => m.kind === Message.kind.callResult
            ) as Message.CallResult;
            assert.strictEqual(m2?.e, true);
            assert.strictEqual(m2?.r, "Error: aaa");
            done();
          }, 10);
        }, 10);
      });
      it("send response with not started when callback not found", function (done) {
        wcli.start();
        setTimeout(() => {
          wssSend({
            kind: Message.kind.call,
            i: 5,
            c: 10,
            r: 0,
            f: "a",
            a: [],
          });
          setTimeout(() => {
            const m = wssRecv.find(
              (m) => m.kind === Message.kind.callResponse
            ) as Message.CallResponse;
            assert.strictEqual(m?.s, false);
            done();
          }, 10);
        }, 10);
      });
    });
  });
});

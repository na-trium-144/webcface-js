import { assert } from "chai";
import { ClientData } from "../src/clientData.js";
import { Value } from "../src/value.js";
import { Text } from "../src/text.js";
import { Log } from "../src/log.js";
import { Func } from "../src/func.js";
import { View } from "../src/view.js";
import { RobotModel } from "../src/robotModel.js";
import { Field } from "../src/field.js";
import { Member } from "../src/member.js";
import { eventType } from "../src/event.js";
import { FieldBase } from "../src/fieldBase.js";

describe("Member Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const member = (member: string) => new Member(new Field(data, member));
  beforeEach(function () {
    data = new ClientData(selfName);
    data.logLevel = "trace";
    data.memberIds.set("a", 1);
  });
  describe("#name", function () {
    it("returns member name", function () {
      assert.strictEqual(member("a").name, "a");
    });
  });
  describe("#value()", function () {
    it("returns Value object", function () {
      const v = member("a").value("b");
      assert.instanceOf(v, Value);
      assert.strictEqual(v.member.name, "a");
      assert.strictEqual(v.name, "b");
    });
  });
  describe("#text()", function () {
    it("returns Text object", function () {
      const v = member("a").text("b");
      assert.instanceOf(v, Text);
      assert.strictEqual(v.member.name, "a");
      assert.strictEqual(v.name, "b");
    });
  });
  describe("#robotModel()", function () {
    it("returns RobotModel object", function () {
      const v = member("a").robotModel("b");
      assert.instanceOf(v, RobotModel);
      assert.strictEqual(v.member.name, "a");
      assert.strictEqual(v.name, "b");
    });
  });
  describe("#view()", function () {
    it("returns View object", function () {
      const v = member("a").view("b");
      assert.instanceOf(v, View);
      assert.strictEqual(v.member.name, "a");
      assert.strictEqual(v.name, "b");
    });
  });
  describe("#func()", function () {
    it("returns Func object", function () {
      const v = member("a").func("b");
      assert.instanceOf(v, Func);
      assert.strictEqual(v.member.name, "a");
      assert.strictEqual(v.name, "b");
    });
  });
  describe("#log()", function () {
    it("returns log object", function () {
      const v = member("a").log();
      assert.instanceOf(v, Log);
      assert.strictEqual(v.member.name, "a");
    });
  });
  describe("#values()", function () {
    it("returns list of entries in data.valueStore.entry", function () {
      data.valueStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(member("a").values());
      assert.lengthOf(member("a").values(), 3);
    });
    it("returns empty array by default", function () {
      assert.isArray(member("a").values());
      assert.isEmpty(member("a").values());
    });
  });
  describe("#texts()", function () {
    it("returns list of entries in data.textStore.entry", function () {
      data.textStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(member("a").texts());
      assert.lengthOf(member("a").texts(), 3);
    });
    it("returns empty array by default", function () {
      assert.isArray(member("a").texts());
      assert.isEmpty(member("a").texts());
    });
  });
  describe("#robotModels()", function () {
    it("returns list of entries in data.robotModelStore.entry", function () {
      data.robotModelStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(member("a").robotModels());
      assert.lengthOf(member("a").robotModels(), 3);
    });
    it("returns empty array by default", function () {
      assert.isArray(member("a").robotModels());
      assert.isEmpty(member("a").robotModels());
    });
  });
  describe("#views()", function () {
    it("returns list of entries in data.viewStore.entry", function () {
      data.viewStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(member("a").views());
      assert.lengthOf(member("a").views(), 3);
    });
    it("returns empty array by default", function () {
      assert.isArray(member("a").views());
      assert.isEmpty(member("a").views());
    });
  });
  describe("#funcs()", function () {
    it("returns list of entries in data.funcStore.entry", function () {
      data.funcStore.entry.set("a", ["b", "c", "d"]);
      assert.isArray(member("a").funcs());
      assert.lengthOf(member("a").funcs(), 3);
    });
    it("returns empty array by default", function () {
      assert.isArray(member("a").funcs());
      assert.isEmpty(member("a").funcs());
    });
  });
  describe("#onValueEntry", function () {
    it("handles value entry event", function () {
      let called = 0;
      member("a").onValueEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.valueEntry(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#onTextEntry", function () {
    it("handles text entry event", function () {
      let called = 0;
      member("a").onTextEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.textEntry(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#onRobotModelEntry", function () {
    it("handles robotModel entry event", function () {
      let called = 0;
      member("a").onRobotModelEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.robotModelEntry(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#onFuncEntry", function () {
    it("handles func entry event", function () {
      let called = 0;
      member("a").onFuncEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.funcEntry(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#onViewEntry", function () {
    it("handles view entry event", function () {
      let called = 0;
      member("a").onViewEntry.on(() => ++called);
      data.eventEmitter.emit(eventType.viewEntry(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#onSync", function () {
    it("handles sync event", function () {
      let called = 0;
      member("a").onSync.on(() => ++called);
      data.eventEmitter.emit(eventType.sync(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
  });
  describe("#libName", function () {
    it("returns memberLibName", function () {
      data.memberLibName.set(1, "hoge");
      assert.strictEqual(member("a").libName, "hoge");
    });
  });
  describe("#libVersion", function () {
    it("returns memberLibVer", function () {
      data.memberLibVer.set(1, "hoge");
      assert.strictEqual(member("a").libVersion, "hoge");
    });
  });
  describe("#remoteAddr", function () {
    it("returns memberRemoteAddr", function () {
      data.memberRemoteAddr.set(1, "hoge");
      assert.strictEqual(member("a").remoteAddr, "hoge");
    });
  });
  describe("#pingStatus", function () {
    it("returns pingStatus", function () {
      data.pingStatus.set(1, 10);
      assert.strictEqual(member("a").pingStatus, 10);
    });
    it("returns pingStatus of client itself if selfMemberId is known", function () {
      data.selfMemberId = 5;
      data.pingStatus.set(5, 10);
      assert.strictEqual(member(data.selfMemberName).pingStatus, 10);
    });
    it("sets pingStatusReq", function () {
      void member("a").pingStatus;
      assert.isTrue(data.pingStatusReq);
    });
  });
  describe("#requestPingStatus", function () {
    it("sets pingStatusReq", function () {
      member("a").requestPingStatus();
      assert.isTrue(data.pingStatusReq);
    });
  });
  describe("#onPing", function () {
    it("handles ping event", function () {
      let called = 0;
      member("a").onPing.on(() => ++called);
      data.eventEmitter.emit(eventType.ping(new FieldBase("a")));
      assert.strictEqual(called, 1);
    });
    it("sets pingStatusReq", function () {
      member("a").onPing.on(() => undefined);
      assert.isTrue(data.pingStatusReq);
    });
  });
});

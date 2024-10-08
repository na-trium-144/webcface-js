import { assert } from "chai";
import { ClientData } from "../src/clientData.js";
import { Value } from "../src/value.js";
import { Text } from "../src/text.js";
import { Log } from "../src/log.js";
import { Field } from "../src/field.js";
import { Member } from "../src/member.js";

describe("Value Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const value = (member: string, field: string) =>
    new Value(new Field(data, member, field));
  beforeEach(function () {
    data = new ClientData(selfName);
    data.logLevel = "trace";
  });
  describe("#member", function () {
    it("returns Member object with its member name", function () {
      assert.instanceOf(value("a", "b").member, Member);
      assert.strictEqual(value("a", "b").member.name, "a");
    });
  });
  describe("#name", function () {
    it("returns field name", function () {
      assert.strictEqual(value("a", "b").name, "b");
    });
  });
  describe("#child()", function () {
    it("returns child Value object", function () {
      const c = value("a", "b").child("c");
      assert.instanceOf(c, Value);
      assert.strictEqual(c.member.name, "a");
      assert.strictEqual(c.name, "b.c");
    });
  });
  describe("#tryGet()", function () {
    it("returns null by default", function () {
      assert.isNull(value("a", "b").tryGet());
    });
    it("returns first element of value if data.valueStore.dataRecv is set", function () {
      data.valueStore.dataRecv.set("a", new Map([["b", [2, 3, 4]]]));
      assert.strictEqual(value("a", "b").tryGet(), 2);
    });
    it("sets request when member is not self name", function () {
      value("a", "b").tryGet();
      assert.strictEqual(data.valueStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      value(selfName, "b").tryGet();
      assert.isEmpty(data.valueStore.req);
    });
  });
  describe("#get()", function () {
    it("returns 0 by default", function () {
      assert.strictEqual(value("a", "b").get(), 0);
    });
    it("returns first element of value if data.valueStore.dataRecv is set", function () {
      data.valueStore.dataRecv.set("a", new Map([["b", [2, 3, 4]]]));
      assert.strictEqual(value("a", "b").get(), 2);
    });
    it("sets request when member is not self name", function () {
      value("a", "b").get();
      assert.strictEqual(data.valueStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      value(selfName, "b").get();
      assert.isEmpty(data.valueStore.req);
    });
  });
  describe("#tryGetVec()", function () {
    it("returns null by default", function () {
      assert.isNull(value("a", "b").tryGetVec());
    });
    it("returns value if data.valueStore.dataRecv is set", function () {
      data.valueStore.dataRecv.set("a", new Map([["b", [2, 3, 4]]]));
      assert.sameOrderedMembers(value("a", "b").tryGetVec() || [], [2, 3, 4]);
    });
    it("sets request when member is not self name", function () {
      value("a", "b").tryGetVec();
      assert.strictEqual(data.valueStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      value(selfName, "b").tryGetVec();
      assert.isEmpty(data.valueStore.req);
    });
  });
  describe("#getVec()", function () {
    it("returns empty array by default", function () {
      assert.isArray(value("a", "b").getVec());
      assert.isEmpty(value("a", "b").getVec());
    });
    it("returns value if data.valueStore.dataRecv is set", function () {
      data.valueStore.dataRecv.set("a", new Map([["b", [2, 3, 4]]]));
      assert.sameOrderedMembers(value("a", "b").getVec(), [2, 3, 4]);
    });
    it("sets request when member is not self name", function () {
      value("a", "b").getVec();
      assert.strictEqual(data.valueStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      value(selfName, "b").getVec();
      assert.isEmpty(data.valueStore.req);
    });
  });
  describe("#set()", function () {
    it("sets array of single value when single value is passed", function () {
      value(selfName, "b").set(5);
      assert.sameOrderedMembers(data.valueStore.dataSend.get("b") || [], [5]);
      data.valueStore.dataSend = new Map();
      value(selfName, "b").set(42);
      assert.sameOrderedMembers(data.valueStore.dataSend.get("b") || [], [42]);
    });
    it("sets value when array of number is passed", function () {
      value(selfName, "b").set([2, 3, 4]);
      assert.sameOrderedMembers(
        data.valueStore.dataSend.get("b") || [],
        [2, 3, 4]
      );
    });
    it("sets value recursively when object is passed", function () {
      value(selfName, "b").set({
        a: 3,
        b: { c: 5 },
        v: [8, 9, 10],
      });
      assert.sameOrderedMembers(data.valueStore.dataSend.get("b.a") || [], [3]);
      assert.sameOrderedMembers(data.valueStore.dataSend.get("b.b.c") || [], [
        5,
      ]);
      assert.sameOrderedMembers(
        data.valueStore.dataSend.get("b.v") || [],
        [8, 9, 10]
      );
    });
    it("does not set value when same value is passed twice", function () {
      value(selfName, "b").set(5);
      data.valueStore.dataSend = new Map();
      value(selfName, "b").set(5);
      assert.isFalse(data.valueStore.dataSend.has("b"));
    });
    it("triggers change event", function () {
      let called = 0;
      value(selfName, "b").addListener((v) => {
        ++called;
        assert.strictEqual(v.member.name, selfName);
        assert.strictEqual(v.name, "b");
      });
      value(selfName, "b").set(1);
      assert.strictEqual(called, 1);
    });
    it("throws error when member is not self", function () {
      assert.throws(() => value("a", "b").set(1), Error);
    });
  });
  describe("#time()", function () {
    it("returns time set in data.syncTimeStore", function () {
      data.syncTimeStore.setRecv("a", new Date(10000));
      assert.strictEqual(value("a", "b").time().getTime(), 10000);
    });
  });
});

describe("Text Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const text = (member: string, field: string) =>
    new Text(new Field(data, member, field));
  beforeEach(function () {
    data = new ClientData(selfName);
  });
  describe("#member", function () {
    it("returns Member object with its member name", function () {
      assert.instanceOf(text("a", "b").member, Member);
      assert.strictEqual(text("a", "b").member.name, "a");
    });
  });
  describe("#name", function () {
    it("returns field name", function () {
      assert.strictEqual(text("a", "b").name, "b");
    });
  });
  describe("#child()", function () {
    it("returns child Value object", function () {
      const c = text("a", "b").child("c");
      assert.instanceOf(c, Text);
      assert.strictEqual(c.member.name, "a");
      assert.strictEqual(c.name, "b.c");
    });
  });
  describe("#tryGet()", function () {
    it("returns null by default", function () {
      assert.isNull(text("a", "b").tryGet());
    });
    it("returns value if data.textStore.dataRecv is set", function () {
      data.textStore.dataRecv.set("a", new Map([["b", "aaa"]]));
      assert.strictEqual(text("a", "b").tryGet(), "aaa");
    });
    it("sets request when member is not self name", function () {
      text("a", "b").tryGet();
      assert.strictEqual(data.textStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      text(selfName, "b").tryGet();
      assert.isEmpty(data.textStore.req);
    });
  });
  describe("#get()", function () {
    it("returns empty string by default", function () {
      assert.strictEqual(text("a", "b").get(), "");
    });
    it("returns value if data.textStore.dataRecv is set", function () {
      data.textStore.dataRecv.set("a", new Map([["b", "aaa"]]));
      assert.strictEqual(text("a", "b").get(), "aaa");
    });
    it("sets request when member is not self name", function () {
      text("a", "b").get();
      assert.strictEqual(data.textStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      text(selfName, "b").get();
      assert.isEmpty(data.textStore.req);
    });
  });
  describe("#set()", function () {
    it("sets value when string is passed", function () {
      text(selfName, "b").set("aaa");
      assert.strictEqual(data.textStore.dataSend.get("b"), "aaa");
      data.textStore.dataSend = new Map();
      text(selfName, "b").set("bbb");
      assert.strictEqual(data.textStore.dataSend.get("b"), "bbb");
    });
    it("sets value recursively when object is passed", function () {
      text(selfName, "b").set({
        a: "a",
        b: { c: "bc" },
      });
      assert.strictEqual(data.textStore.dataSend.get("b.a"), "a");
      assert.strictEqual(data.textStore.dataSend.get("b.b.c"), "bc");
    });
    it("does not set value when same string is passed twice", function () {
      text(selfName, "b").set("aaa");
      data.textStore.dataSend = new Map();
      text(selfName, "b").set("aaa");
      assert.isFalse(data.textStore.dataSend.has("b"));
    });
    it("triggers change event", function () {
      let called = 0;
      text(selfName, "b").addListener((t) => {
        ++called;
        assert.strictEqual(t.member.name, selfName);
        assert.strictEqual(t.name, "b");
      });
      text(selfName, "b").set("aaa");
      assert.strictEqual(called, 1);
    });
    it("throws error when member is not self", function () {
      assert.throws(() => text("a", "b").set("a"), Error);
    });
  });
  describe("#time()", function () {
    it("returns time set in data.syncTimeStore", function () {
      data.syncTimeStore.setRecv("a", new Date(10000));
      assert.strictEqual(text("a", "b").time().getTime(), 10000);
    });
  });
});
describe("Log Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const log = (member: string, name: string) => new Log(new Field(data, member, ""), name);
  beforeEach(function () {
    data = new ClientData(selfName);
  });
  describe("#member", function () {
    it("returns Member object with its member name", function () {
      assert.instanceOf(log("a", "b").member, Member);
      assert.strictEqual(log("a", "b").member.name, "a");
      assert.strictEqual(log("a", "b").name, "b");
    });
  });
  describe("#tryGet()", function () {
    it("returns null by default", function () {
      assert.isNull(log("a", "b").tryGet());
    });
    it("returns value if data.logStore.dataRecv is set", function () {
      data.logStore.setRecv("a", "b", {data: [
        { level: 1, time: new Date(), message: "a" },
      ], sentLines: 0});
      assert.lengthOf(log("a", "b").tryGet() || [], 1);
      assert.strictEqual((log("a", "b").tryGet() || [])[0]?.level, 1);
      assert.strictEqual((log("a", "b").tryGet() || [])[0]?.message, "a");
    });
    it("sets request when member is not self name", function () {
      log("a", "b").tryGet();
      assert.strictEqual(data.logStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      log(selfName, "b").tryGet();
      assert.isEmpty(data.logStore.req);
    });
  });
  describe("#get()", function () {
    it("returns empty array by default", function () {
      assert.isArray(log("a", "b").get());
      assert.isEmpty(log("a", "b").get());
    });
    it("returns value if data.logStore.dataRecv is set", function () {
      data.logStore.setRecv("a", "b", {data: [
        { level: 1, time: new Date(), message: "a" },
      ], sentLines: 0});
      assert.lengthOf(log("a", "b").get(), 1);
      assert.strictEqual(log("a", "b").get()[0]?.level, 1);
      assert.strictEqual(log("a", "b").get()[0]?.message, "a");
    });
    it("sets request when member is not self name", function () {
      log("a", "b").get();
      assert.strictEqual(data.logStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      log(selfName, "b").get();
      assert.isEmpty(data.logStore.req);
    });
  });
  describe("#exists()", function () {
    it("returns true if data.logStore.entry has this member", function () {
      assert.isFalse(log("a", "b").exists());
      data.logStore.setEntry("a", "b");
      assert.isTrue(log("a", "b").exists());
    });
    // todo: selfの場合もexists()は機能するべき?
  });
  describe("#clear()", function () {
    it("clears data.logStore.dataRecv", function () {
      data.logStore.setRecv("a", "b", {data:[
        { level: 1, time: new Date(), message: "a" },
      ], sentLines: 0});
      log("a", "b").clear();
      assert.isArray(data.logStore.getRecv("a", "b")?.data);
      assert.isEmpty(data.logStore.getRecv("a", "b")?.data);
    });
  });
  describe("#append()", function () {
    it("push log to data.logStore", function () {
      log(selfName, "b").append(0, "a");
      log(selfName, "b").append(1, "b");
      const ls = data.logStore.getRecv(selfName, "b")?.data || [];
      assert.lengthOf(ls, 2);
      assert.include(ls[0], { level: 0, message: "a" });
      assert.include(ls[1], { level: 1, message: "b" });
    });
    it("triggers change event", function () {
      let called = 0;
      log(selfName, "b").addListener((v) => {
        ++called;
        assert.strictEqual(v.member.name, selfName);
      });
      log(selfName, "b").append(1, "a");
      assert.strictEqual(called, 1);
    });
    it("throws error when member is not self", function () {
      assert.throws(() => log("a", "b").append(1, "a"), Error);
    });
  });
});

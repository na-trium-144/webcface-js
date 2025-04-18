import { assert } from "chai";
import {
  ClientData,
  SyncDataStore2,
  SyncDataStore1,
  FuncResultStore,
} from "../src/clientData.js";
import { FuncPromise } from "../src/func.js";
import { FieldBase } from "../src/fieldBase.js";

describe("ClientData Tests", function () {
  const selfName = "test";
  let data: ClientData;
  beforeEach(function () {
    data = new ClientData(selfName);
    data.logLevel = "trace";
  });
  describe("SyncDataStore2 Tests", function () {
    let s2: SyncDataStore2<string>;
    beforeEach(function () {
      s2 = new SyncDataStore2<string>(selfName);
    });
    describe("#isSelf()", function () {
      it("returns true when self name is passed", function () {
        assert.isTrue(s2.isSelf(selfName));
      });
      it("returns false when different name is passed", function () {
        assert.isFalse(s2.isSelf("hoge"));
      });
      it("returns false when empty string is passed", function () {
        assert.isFalse(s2.isSelf(""));
      });
    });
    describe("#setSend()", function () {
      it("sets value to #dataSend", function () {
        s2.setSend("a", "b");
        assert.strictEqual(s2.dataSend.get("a"), "b");
      });
      it("sets value to #dataRecv", function () {
        s2.setSend("a", "b");
        assert.strictEqual(s2.dataRecv.get(selfName)?.get("a"), "b");
      });
    });
    describe("#setRecv()", function () {
      it("sets value to #dataRecv", function () {
        s2.setRecv("a", "b", "c");
        assert.strictEqual(s2.dataRecv.get("a")?.get("b"), "c");
      });
    });
    describe("#addReq()", function () {
      it("sets new request to #req and return id", function () {
        const r = s2.addReq("a", "b");
        assert.strictEqual(r, 1);
        assert.strictEqual(s2.req.get("a")?.get("b"), 1);
      });
      it("return 0 for the second time", function () {
        s2.addReq("a", "b");
        const r = s2.addReq("a", "b");
        assert.strictEqual(r, 0);
      });
      it("does not set #req if member is self name", function () {
        const r = s2.addReq(selfName, "b");
        assert.strictEqual(r, 0);
        assert.isEmpty(s2.req);
      });
    });
    describe("#getRecv()", function () {
      it("returns value in #dataRecv", function () {
        s2.dataRecv.set("a", new Map([["b", "c"]]));
        assert.strictEqual(s2.getRecv("a", "b"), "c");
      });
    });
    describe("#unsetRecv()", function () {
      it("removes value from #dataRecv", function () {
        s2.dataRecv.set("a", new Map([["b", "c"]]));
        s2.unsetRecv("a", "b");
        assert.notExists(s2.dataRecv.get("a")?.get("b"));
      });
      it("sets 0 to #req if already set", function () {
        s2.dataRecv.set("a", new Map([["b", "c"]]));
        s2.req.set("a", new Map([["b", 1]]));
        s2.unsetRecv("a", "b");
        assert.strictEqual(s2.req.get("a")?.get("b"), 0);
      });
    });
    describe("#initMember()", function () {
      it("add member to #entry", function () {
        s2.initMember("a");
        assert.isTrue(s2.entry.has("a"));
        assert.isEmpty(s2.entry.get("a"));
      });
      it("clear previous data in #dataRecv", function () {
        s2.dataRecv.set("a", new Map([["b", "c"]]));
        s2.initMember("a");
        assert.isFalse(s2.dataRecv.has("a"));
      });
    });
    describe("#addEntry()", function () {
      it("add entry to #entry", function () {
        s2.setEntry("a", "b");
        assert.sameOrderedMembers(s2.entry.get("a") || [], ["b"]);
      });
    });
    describe("#getMembers()", function () {
      it("returns members in #entry", function () {
        s2.entry.set("a", []);
        s2.entry.set("b", []);
        assert.sameMembers(s2.getMembers(), ["a", "b"]);
      });
    });
    describe("#getEntry()", function () {
      it("returns entries in #entry", function () {
        s2.entry.set("a", ["a", "b", "c"]);
        assert.sameMembers(s2.getEntry("a"), ["a", "b", "c"]);
      });
    });
    describe("#transferSend()", function () {
      beforeEach(function () {
        s2.dataSend.set("a", "a");
        s2.dataRecv.set(
          selfName,
          new Map([
            ["a", "a"],
            ["b", "b"],
          ])
        );
      });
      it("returns #dataSend when isFirst = false", function () {
        const s = s2.transferSend(false);
        assert.strictEqual(s.get("a"), "a");
        assert.isFalse(s.has("b"));
      });
      it("returns nothing on second call with isFirst = false", function () {
        s2.transferSend(false);
        const s = s2.transferSend(false);
        assert.isEmpty(s);
      });
      it("returns all values with self name in #dataRecv when isFirst = true", function () {
        const s = s2.transferSend(true);
        assert.strictEqual(s.get("a"), "a");
        assert.strictEqual(s.get("b"), "b");
      });
    });
    describe("#getSendPrev()", function () {
      beforeEach(function () {
        s2.dataSend.set("a", "a");
        s2.dataRecv.set(
          selfName,
          new Map([
            ["a", "a"],
            ["b", "b"],
          ])
        );
      });
      it("returns previous #dataSend when isFirst = false", function () {
        s2.transferSend(false);
        const s = s2.getSendPrev(false);
        assert.strictEqual(s.get("a"), "a");
        assert.isFalse(s.has("b"));
      });
      it("returns nothing when isFirst = true", function () {
        const s = s2.getSendPrev(true);
        assert.isEmpty(s);
      });
    });
    describe("#transferReq", function () {
      beforeEach(function () {
        s2.req.set(
          "a",
          new Map([
            ["b", 1],
            ["c", 2],
          ])
        );
      });
      it("returns #req", function () {
        const s = s2.transferReq();
        assert.strictEqual(s.get("a")?.get("b"), 1);
        assert.strictEqual(s.get("a")?.get("c"), 2);
      });
    });
    describe("#getReq()", function () {
      beforeEach(function () {
        s2.req.set(
          "a",
          new Map([
            ["b", 1],
            ["c", 2],
          ])
        );
      });
      it("returns member and field of given req_id and subField", function () {
        assert.sameOrderedMembers(s2.getReq(1, ""), ["a", "b"]);
        assert.sameOrderedMembers(s2.getReq(1, "c"), ["a", "b.c"]);
      });
      it("returns empty member and field when req_id not found", function () {
        assert.sameOrderedMembers(s2.getReq(999, ""), ["", ""]);
      });
    });
  });
  describe("SyncDataStore1 Tests", function () {
    let s1: SyncDataStore1<string>;
    beforeEach(function () {
      s1 = new SyncDataStore1<string>(selfName);
    });
    describe("#isSelf()", function () {
      it("returns true when self name is passed", function () {
        assert.isTrue(s1.isSelf(selfName));
      });
      it("returns false when different name is passed", function () {
        assert.isFalse(s1.isSelf("hoge"));
      });
      it("returns false when empty string is passed", function () {
        assert.isFalse(s1.isSelf(""));
      });
    });
    describe("#setRecv()", function () {
      it("sets value to #dataRecv", function () {
        s1.setRecv("a", "b");
        assert.strictEqual(s1.dataRecv.get("a"), "b");
      });
    });
    describe("#addReq()", function () {
      it("sets new request to #req and return true", function () {
        const r = s1.addReq("a");
        assert.isTrue(r);
        assert.strictEqual(s1.req.get("a"), true);
      });
      it("return false for the second time", function () {
        s1.addReq("a");
        const r = s1.addReq("a");
        assert.isFalse(r);
      });
      it("does not set #req if member is self name", function () {
        const r = s1.addReq(selfName);
        assert.isFalse(r);
        assert.isEmpty(s1.req);
      });
    });
    describe("#getRecv()", function () {
      it("returns value in #dataRecv", function () {
        s1.dataRecv.set("a", "b");
        assert.strictEqual(s1.getRecv("a"), "b");
      });
    });
    describe("#transferReq", function () {
      beforeEach(function () {
        s1.req.set("a", true);
        s1.req.set("b", true);
      });
      it("returns #req", function () {
        const s = s1.transferReq();
        assert.strictEqual(s.get("a"), true);
        assert.strictEqual(s.get("b"), true);
      });
    });
    describe("#addEntry()", function () {
      it("add entry to #entry", function () {
        s1.setEntry("a");
        assert.isTrue(s1.entry.has("a"));
      });
    });
    describe("#getEntry()", function () {
      it("returns true if entry is in #entry", function () {
        s1.entry.add("a");
        assert.isTrue(s1.getEntry("a"));
        assert.isFalse(s1.getEntry("b"));
      });
    });
    describe("#clearEntry()", function () {
      it("clears #entry", function () {
        s1.entry.add("a");
        s1.clearEntry("a");
        assert.isFalse(s1.entry.has("a"));
      });
    });
  });
  describe("FuncResultStore Tests", function () {
    let fs: FuncResultStore;
    beforeEach(function () {
      fs = new FuncResultStore();
    });
    describe("#addResult()", function () {
      it("returns result object", function () {
        const r = fs.addResult("a", new FieldBase("b", "c"), data);
        assert.strictEqual(r.caller, "a");
        assert.strictEqual(new FuncPromise(r).member.name, "b");
        assert.strictEqual(new FuncPromise(r).name, "c");
        assert.strictEqual(r.callerId, 0);
      });
    });
    describe("#getResult()", function () {
      it("returns result object", function () {
        fs.addResult("a", new FieldBase("b", "c"), data);
        const r = fs.getResult(0);
        assert.strictEqual(r.caller, "a");
        assert.strictEqual(new FuncPromise(r).member.name, "b");
        assert.strictEqual(new FuncPromise(r).name, "c");
        assert.strictEqual(r.callerId, 0);
      });
    });
  });
  describe("#isSelf()", function () {
    it("returns true when self name is passed", function () {
      assert.isTrue(data.isSelf(selfName));
    });
    it("returns false when different name is passed", function () {
      assert.isFalse(data.isSelf("hoge"));
    });
    it("returns false when empty string is passed", function () {
      assert.isFalse(data.isSelf(""));
    });
  });
  describe("#getMemberNameFromId()", function () {
    it("returns member name with given member id", function () {
      data.memberIds.set("a", 10);
      assert.strictEqual(data.getMemberNameFromId(10), "a");
    });
    it("returns empty string when member id not found", function () {
      assert.strictEqual(data.getMemberNameFromId(999), "");
    });
  });
  describe("#getMemberIdFromName()", function () {
    it("returns member id with given name", function () {
      data.memberIds.set("a", 10);
      assert.strictEqual(data.getMemberIdFromName("a"), 10);
    });
    it("returns 0 when member name not found", function () {
      assert.strictEqual(data.getMemberIdFromName("b"), 0);
      assert.strictEqual(data.getMemberIdFromName(""), 0);
    });
  });
});

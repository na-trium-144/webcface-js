import { assert } from "chai";
import { ClientData } from "../src/clientData.js";
import { Field } from "../src/field.js";
import { RobotModel, RobotLink } from "../src/robotModel.js";
import { Member } from "../src/member.js";

describe("RobotModel Tests", function () {
  const selfName = "test";
  let data: ClientData;
  const robotModel = (member: string, field: string) =>
    new RobotModel(new Field(data, member, field));
  beforeEach(function () {
    data = new ClientData(selfName);
    data.logLevel = "trace";
  });
  describe("#member", function () {
    it("returns Member object with its member name", function () {
      assert.instanceOf(robotModel("a", "b").member, Member);
      assert.strictEqual(robotModel("a", "b").member.name, "a");
    });
  });
  describe("#name", function () {
    it("returns field name", function () {
      assert.strictEqual(robotModel("a", "b").name, "b");
    });
  });
  describe("#tryGet()", function () {
    it("returns null by default", function () {
      assert.isNull(robotModel("a", "b").tryGet());
    });
    it("returns value if data.robotModelStore.dataRecv is set", function () {
      data.robotModelStore.dataRecv.set(
        "a",
        new Map([
          [
            "b",
            [
              new RobotLink(
                "a",
                {
                  name: "a",
                  parentName: "",
                  type: 0,
                  origin: { pos: [0, 0, 0], rot: [0, 0, 0] },
                  angle: 0,
                },
                {
                  type: 0,
                  origin: { pos: [0, 0, 0], rot: [0, 0, 0] },
                  properties: [],
                },
                0
              ).toMessage([]),
            ],
          ],
        ])
      );
      assert.lengthOf(robotModel("a", "b").tryGet() || [], 1);
    });
    it("sets request when member is not self name", function () {
      robotModel("a", "b").tryGet();
      assert.strictEqual(data.robotModelStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      robotModel(selfName, "b").tryGet();
      assert.isEmpty(data.robotModelStore.req);
    });
  });
  describe("#get()", function () {
    it("returns empty array by default", function () {
      assert.isArray(robotModel("a", "b").get());
      assert.isEmpty(robotModel("a", "b").get());
    });
    it("returns value if data.robotModelStore.dataRecv is set", function () {
      data.robotModelStore.dataRecv.set(
        "a",
        new Map([
          [
            "b",
            [
              new RobotLink(
                "a",
                {
                  name: "a",
                  parentName: "",
                  type: 0,
                  origin: { pos: [0, 0, 0], rot: [0, 0, 0] },
                  angle: 0,
                },
                {
                  type: 0,
                  origin: { pos: [0, 0, 0], rot: [0, 0, 0] },
                  properties: [],
                },
                0
              ).toMessage([]),
            ],
          ],
        ])
      );
      assert.lengthOf(robotModel("a", "b").get() || [], 1);
    });
    it("sets request when member is not self name", function () {
      robotModel("a", "b").get();
      assert.strictEqual(data.robotModelStore.req.get("a")?.get("b"), 1);
    });
    it("does not set request when member is self name", function () {
      robotModel(selfName, "b").get();
      assert.isEmpty(data.robotModelStore.req);
    });
  });
  describe("#time()", function () {
    it("returns time set in data.syncTimeStore", function () {
      data.syncTimeStore.setRecv("a", new Date(10000));
      assert.strictEqual(robotModel("a", "b").time().getTime(), 10000);
    });
  });
});

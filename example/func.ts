import { Client, valType } from "../src/index.js";

const c = new Client("example_func");
c.func("func1").set(() => console.log("hello, world!"), valType.none_, []);
c.func("func2").set(
  (a: number, b: number, c: boolean, d: string) => {
    console.log(`hello world 2 ${a} ${b} ${c ? "true" : "false"} ${d}`);
    return a + b;
  },
  valType.float_,
  [
    { name: "a", type: valType.int_, init: 3 },
    { name: "b", type: valType.float_, min: 2, max: 8 },
    { name: "c", type: valType.boolean_, init: false },
    { name: "d", type: valType.string_, option: ["hoge", "fuga"] },
  ]
);
c.sync();

setInterval(() => undefined, 250);

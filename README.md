# webcface-js
[![coverage](https://raw.githubusercontent.com/na-trium-144/webcface-js/badge/coverage.svg)](https://github.com/na-trium-144/webcface-js/actions/workflows/node.js.coverage.yml)
[![npm](https://img.shields.io/npm/v/webcface)](https://www.npmjs.com/package/webcface)

Client library of [WebCFace](https://github.com/na-trium-144/webcface) for JavaScript and TypeScript.
Runs on Node.js and browser.

Please refer to the WebCFace repository for how to use it.
To use this library, you need WebCFace server separately.

## Installation

```bash
npm install webcface
```

## API Documentation
[API Reference](https://na-trium-144.github.io/webcface-js/modules.html)

See also [WebCFace c++ documentation](https://na-trium-144.github.io/webcface/)(Currently Japanese only), which has similar API.

## Usage

### value, text
```ts
import { Client, Value } from "webcface";
const wcli = new Client("example_main");
wcli.value("test").set(0);
wcli.value("dict").set({
  a: 1,
  b: 2,
  nest: {c: 3, d: 4},
})
wcli.text("str").set("hello");
wcli.sync();
```

```ts
import { Client, Value } from "webcface";
const wcli = Client("example_recv");
wcli.start();

setInterval(() => {
  console.log(`test = ${c.member("example_main").value("test").get()}`);
  console.log(`str = ${c.member("example_main").text("str").get()}`);
}, 250);
```

### func
```ts
import { Client, valType } from "webcface";
const wcli = Client("example_recv");
wcli.func("func2").set(
  (a: number, b: number, c: boolean, d: string) => {
    console.log(`hello world 2 ${a} ${b} ${c ? "true" : "false"} ${d}`);
    return a + b;
  },
  valType.float_, // return type
  [ // arguments
    { name: "a", type: valType.int_, init: 3 },
    { name: "b", type: valType.float_, min: 2, max: 8 },
    { name: "c", type: valType.boolean_, init: false },
    { name: "d", type: valType.string_, option: ["hoge", "fuga"] },
  ]
);
```

```ts
wcli
  .member("example_main")
  .func("func2")
  .runAsync(9, 7.1, false, "aaa")
  .result.then((v) => {
    console.log(`func2 = ${v as number}`);
  })
  .catch(() => undefined);
```

### view
```ts
wcli.view("a").set([
  "hello, world\n",
  i,
  viewComponents.button("a", () => console.log("hello")),
]);
```

### log
WebCFace client provides Appender for [log4js-node](https://www.npmjs.com/package/log4js).
```ts
import log4js from "log4js";

log4js.configure({
  appenders: {
    out: { type: "stdout" },
  },
  categories: {
    default: { appenders: ["out", "wcf"], level: "debug" },
  },
});
const logger = log4js.getLogger();
logger.info("this is info");
logger.warn("this is warn");
logger.error("this is error");
```

```ts
import { LogLine } from "webcface";
const logs: LogLine[] = wcli.member("webcface_main").log().get();
```


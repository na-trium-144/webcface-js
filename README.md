# webcface-js
[WebCFace](https://github.com/na-trium-144/webcface)のJavaScript/TypeScript版クライアントライブラリです。
Node.jsとブラウザーで動きます。

使い方はwebcfaceのリポジトリを参照してください。
このライブラリを動かすにはwebcface-serverを別途インストールする必要があります。

## example
書きかけ
適当

### value, text
送信側
```ts
import { Client, Value } from "webcface";
const wcli = new Client("example_main");
wcli.value("test").set(0);
// まとめてセット
wcli.value("dict").set({
  a: 1,
  b: 2,
  nest: {c: 3, d: 4},
})
wcli.text("str").set("hello");
wcli.sync();
```

受信側
```ts
import { Client, Value } from "webcface";
const wcli = Client("example_recv");

setInterval(() => {
  console.log(`test = ${c.member("example_main").value("test").get()}`);
  console.log(`str = ${c.member("example_main").text("str").get()}`);
  wcli.sync();
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
[log4js-node](https://www.npmjs.com/package/log4js)のAppenderとして実装しています
```ts
import log4js from "log4js";

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    wcf: { type: wcli.logAppender },
  },
  categories: {
    default: { appenders: ["out", "wcf"], level: "debug" },
    webcface: { appenders: ["out"], level: "debug" }, // webcface internal
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


import {
  Client,
  Member,
  Value,
  Text,
  Func,
  Image,
  imageCompressMode,
} from "../src/index.js";

const c = new Client("example_recv");

c.onMemberEntry.on((m: Member) => {
  console.log(`member ${m.name}`);
  m.onValueEntry.on((v: Value) => {
    console.log(`value ${v.name}`);
  });
  m.onTextEntry.on((v: Text) => {
    console.log(`text ${v.name}`);
  });
  m.onImageEntry.on((v: Image) => {
    console.log(`image ${v.name}`);
    v.request({
      width: 100,
      height: 100,
      compressMode: imageCompressMode.webp,
      quality: 90,
    });
    v.on(() => {
      const img = v.get();
      console.log(
        `image ${v.name} received ${img.data.byteLength} (${img.width}x${img.height})`
      );
    });
  });
  m.onFuncEntry.on((v: Func) => {
    console.log(`func  ${v.name} ${v.args.length} args, ret: ${v.returnType}`);
  });
});

c.sync();
setInterval(() => {
  console.log(`recv test = ${c.member("example_main").value("test").get()}`);
  void c
    .member("example_main")
    .func("func2")
    .runAsync(9, 7.1, false, "aaa")
    .result.then((v) => {
      console.log(`func2 = ${v as number}`);
    })
    .catch(() => undefined);
  c.sync();
}, 250);

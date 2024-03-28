import { Client, viewComponents, InputRef } from "../src/index.js";

const c = new Client("example_view");

let i = 0;

const staticRef = new InputRef();
setInterval(() => {
  const ref1 = new InputRef();
  const ref2 = new InputRef();
  const ref3 = new InputRef();
  c.view("a").set([
    "hello, world\n",
    i,
    viewComponents.newLine(),
    viewComponents.button("a", () => console.log("hello")),
    "\n",
    viewComponents.textInput({
      text: "staticRef",
      bind: staticRef,
      init: "hello",
    }),
    viewComponents.textInput({ text: "ref1", bind: ref1 }),
    viewComponents.numInput({ text: "ref2", bind: ref2, min: -15, max: 15 }),
    viewComponents.toggleInput({
      text: "ref3",
      bind: ref3,
      option: ["hoge", "fuga", "1", "2", "4", "8"],
    }),
    "\n",
    viewComponents.button("output", () => {
      console.log(`staticRef = ${staticRef.get()}`);
      console.log(`ref1 = ${ref1.get()}`);
      console.log(`ref2 = ${ref2.get()}`);
      console.log(`ref3 = ${ref3.get()}`);
    }),
    "\n",
    `staticRef = ${staticRef.get()}\n`,
    `ref1 (not working) = ${ref1.get()}\n`,
    viewComponents.textInput({
      text: "onChange",
      onChange: (val: string | number | boolean) =>
        console.log(`changed: ${val}`),
    }),
  ]);
  ++i;
  c.sync();
}, 250);

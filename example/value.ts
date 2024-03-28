import { Client } from "../src/index.js";

const c = new Client("example_value");
c.value("test").set(0);

setInterval(() => {
  c.value("test").set(c.value("test").get() + 1);
  c.text("str").set(`hello${c.value("test").get()}`);
  c.sync();
}, 250);

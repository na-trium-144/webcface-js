import { Client } from "../src/index.js";
import log4js from "log4js";

const c = new Client("example_log");

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    wcf: { type: c.logAppender },
  },
  categories: {
    default: { appenders: ["out", "wcf"], level: "debug" },
    webcface: { appenders: ["out"], level: "debug" },
  },
});
const logger = log4js.getLogger();
logger.info("this is info");
logger.warn("this is warn");
logger.error("this is error");

let i = 0;
setInterval(() => {
  logger.info("hello, world", i++);
  c.sync();
}, 250);

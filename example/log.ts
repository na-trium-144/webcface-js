import { Client } from "../src/index.js";
import log4js from "log4js";
import { Level, Levels, LoggingEvent, AppenderModule } from "log4js";
import util from "util";

const c = new Client("example_log");

export function log4jsLevelConvert(level: Level, levels: Levels) {
  if (level.isGreaterThanOrEqualTo(levels.FATAL)) {
    return 5;
  } else if (level.isGreaterThanOrEqualTo(levels.ERROR)) {
    return 4;
  } else if (level.isGreaterThanOrEqualTo(levels.WARN)) {
    return 3;
  } else if (level.isGreaterThanOrEqualTo(levels.INFO)) {
    return 2;
  } else if (level.isGreaterThanOrEqualTo(levels.DEBUG)) {
    return 1;
  } else if (level.isGreaterThanOrEqualTo(levels.TRACE)) {
    return 0;
  } else {
    return -1;
  }
}

export function appender(): AppenderModule {
  return {
    configure:
      (config?: object, layouts?: any, findAppender?: any, levels?: Levels) =>
      (logEvent: LoggingEvent) => {
        c.log().append(
          levels !== undefined ? log4jsLevelConvert(logEvent.level, levels) : 2,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          util.format(...logEvent.data)

          // time: new Date(logEvent.startTime),
        );
      },
  };
}

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    wcf: { type: appender() },
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

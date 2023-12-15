import { Level, Levels, LoggingEvent, AppenderModule } from "log4js";
import util from "util";
import { ClientData } from "./clientData.js";

export interface LogLine {
  level: number;
  time: Date;
  message: string;
}

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

export function appender(data: ClientData): AppenderModule {
  return {
    configure:
      (config?: object, layouts?: any, findAppender?: any, levels?: Levels) =>
      (logEvent: LoggingEvent) => {
        const ll = {
          level:
            levels !== undefined
              ? log4jsLevelConvert(logEvent.level, levels)
              : 2,
          time: new Date(logEvent.startTime),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          message: util.format(...logEvent.data),
        };
        data.logStore.getRecv(data.selfMemberName)?.push(ll);
      },
  };
}

import { Level, Levels } from "log4js";

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

import pc from "picocolors";
import { env } from "@/env";

export class Logger {
  constructor(private readonly name: string) {
    this.name = name;
  }

  private static logMessage(
    type: string,
    name: string,
    message: unknown,
    colorFn: (s: string) => string
  ) {
    if (env.NODE_ENV !== "production" || type === "log" || type === "error") {
      const prefix = colorFn(`[${type.toUpperCase()} - ${new Date().toISOString()} - ${name}]:`);
      console.log(`${prefix} ${typeof message === "string" ? message : JSON.stringify(message)}`);
    }
  }

  log(message: unknown) {
    Logger.logMessage("log", this.name, message, pc.cyan);
  }

  debug(message: unknown) {
    Logger.logMessage("debug", this.name, message, pc.yellow);
  }

  error(message: unknown) {
    Logger.logMessage("error", this.name, message, pc.red);
  }

  info(message: unknown) {
    Logger.logMessage("info", this.name, message, pc.green);
  }

  static log(name: string, message: unknown) {
    this.logMessage("log", name, message, pc.cyan);
  }

  static debug(name: string, message: unknown) {
    this.logMessage("debug", name, message, pc.yellow);
  }

  static error(name: string, message: unknown) {
    this.logMessage("error", name, message, pc.red);
  }

  static info(name: string, message: unknown) {
    this.logMessage("info", name, message, pc.green);
  }
}

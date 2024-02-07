/* eslint-disable no-console */
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
  ): void {
    if (env.NODE_ENV !== "production" || type === "log" || type === "error") {
      const prefix = colorFn(`[${type.toUpperCase()} - ${new Date().toISOString()} - ${name}]:`);
      console.log(
        `\n${prefix} ${typeof message === "string" ? message : JSON.stringify(message)}\n`
      );
    }
  }

  public log(message: unknown): void {
    Logger.logMessage("log", this.name, message, pc.green);
  }

  public debug(message: unknown): void {
    Logger.logMessage("debug", this.name, message, pc.yellow);
  }

  public error(message: unknown): void {
    Logger.logMessage("error", this.name, message, pc.red);
  }

  public info(message: unknown): void {
    Logger.logMessage("info", this.name, message, pc.cyan);
  }

  public static log(name: string, message: unknown): void {
    this.logMessage("log", name, message, pc.cyan);
  }

  public static debug(name: string, message: unknown): void {
    this.logMessage("debug", name, message, pc.yellow);
  }

  public static error(name: string, message: unknown): void {
    this.logMessage("error", name, message, pc.red);
  }

  public static info(name: string, message: unknown): void {
    this.logMessage("info", name, message, pc.green);
  }
}

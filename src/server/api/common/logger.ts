/* eslint-disable no-console */
import { env } from "@/env";
import { DateTime } from "luxon";
import pc from "@/server/api/common/pc";

export class Logger {
  constructor(private readonly name: string) {
    this.name = name;
  }

  private static logMessage(
    type: "log" | "debug" | "info" | "error",
    name: string,
    messages: unknown[],
    colorFn: (s: string) => string
  ): void {
    if (env.NODE_ENV !== "production" || type === "log" || type === "info" || type === "error") {
      const prefix = colorFn(
        `[${type.toUpperCase()} - ${DateTime.now().toLocaleString(
          DateTime.DATETIME_FULL
        )} - ${name}]:`
      );
      console.log(prefix, ...messages);
    }
  }

  public log(...messages: unknown[]): void {
    Logger.logMessage("log", this.name, messages, pc.green);
  }

  public debug(...messages: unknown[]): void {
    Logger.logMessage("debug", this.name, messages, pc.orange);
  }

  public error(...messages: unknown[]): void {
    Logger.logMessage("error", this.name, messages, pc.red);
  }

  public info(...messages: unknown[]): void {
    Logger.logMessage("info", this.name, messages, pc.cyan);
  }

  public static log(name: string, ...messages: unknown[]): void {
    this.logMessage("log", name, messages, pc.green);
  }

  public static debug(name: string, ...messages: unknown[]): void {
    this.logMessage("debug", name, messages, pc.orange);
  }

  public static error(name: string, ...messages: unknown[]): void {
    this.logMessage("error", name, messages, pc.red);
  }

  public static info(name: string, ...messages: unknown[]): void {
    this.logMessage("info", name, messages, pc.cyan);
  }
}

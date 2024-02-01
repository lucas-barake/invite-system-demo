export type Formatter = (input: string | number | null | undefined) => string;

let isColorSupported: boolean;

const replaceClose: (string: string, close: string, replace: string, index: number) => string = (
  string,
  close,
  replace,
  index
) => {
  const start = string.substring(0, index) + replace;
  const end = string.substring(index + close.length);
  const nextIndex = end.indexOf(close);
  return ~nextIndex !== 0 ? start + replaceClose(end, close, replace, nextIndex) : start + end;
};

const formatter: (open: string, close: string, replace?: string) => Formatter =
  (open, close, replace = open) =>
  (input) => {
    const string = `${input}`;
    const index = string.indexOf(close, open.length);
    return ~index !== 0
      ? open + replaceClose(string, close, replace, index) + close
      : open + string + close;
  };

export const createColors = (enabled: boolean = isColorSupported) => ({
  isColorSupported: enabled,
  reset: enabled ? (s: string) => `\x1b[0m${s}\x1b[0m` : String,
  bold: enabled ? formatter("\x1b[1m", "\x1b[22m", "\x1b[22m\x1b[1m") : String,
  dim: enabled ? formatter("\x1b[2m", "\x1b[22m", "\x1b[22m\x1b[2m") : String,
  italic: enabled ? formatter("\x1b[3m", "\x1b[23m") : String,
  underline: enabled ? formatter("\x1b[4m", "\x1b[24m") : String,
  inverse: enabled ? formatter("\x1b[7m", "\x1b[27m") : String,
  hidden: enabled ? formatter("\x1b[8m", "\x1b[28m") : String,
  strikethrough: enabled ? formatter("\x1b[9m", "\x1b[29m") : String,
  black: enabled ? formatter("\x1b[30m", "\x1b[39m") : String,
  red: enabled ? formatter("\x1b[31m", "\x1b[39m") : String,
  green: enabled ? formatter("\x1b[32m", "\x1b[39m") : String,
  yellow: enabled ? formatter("\x1b[33m", "\x1b[39m") : String,
  blue: enabled ? formatter("\x1b[34m", "\x1b[39m") : String,
  magenta: enabled ? formatter("\x1b[35m", "\x1b[39m") : String,
  cyan: enabled ? formatter("\x1b[36m", "\x1b[39m") : String,
  white: enabled ? formatter("\x1b[37m", "\x1b[39m") : String,
  gray: enabled ? formatter("\x1b[90m", "\x1b[39m") : String,
  bgBlack: enabled ? formatter("\x1b[40m", "\x1b[49m") : String,
  bgRed: enabled ? formatter("\x1b[41m", "\x1b[49m") : String,
  bgGreen: enabled ? formatter("\x1b[42m", "\x1b[49m") : String,
  bgYellow: enabled ? formatter("\x1b[43m", "\x1b[49m") : String,
  bgBlue: enabled ? formatter("\x1b[44m", "\x1b[49m") : String,
  bgMagenta: enabled ? formatter("\x1b[45m", "\x1b[49m") : String,
  bgCyan: enabled ? formatter("\x1b[46m", "\x1b[49m") : String,
  bgWhite: enabled ? formatter("\x1b[47m", "\x1b[49m") : String,
  orange: enabled ? formatter("\u001b[38;5;208m", "\x1b[39m") : String,
  bgOrange: enabled ? formatter("\u001b[48;5;208m", "\x1b[49m") : String,
});

let colors: ReturnType<typeof createColors>;

void (async () => {
  const tty = await import("tty");
  const isTTY = tty.isatty(1);

  const argv: string[] = process.argv ?? [],
    env: NodeJS.ProcessEnv = process.env;
  isColorSupported =
    !("NO_COLOR" in env || argv.includes("--no-color")) &&
    ("FORCE_COLOR" in env ||
      argv.includes("--color") ||
      process.platform === "win32" ||
      (isTTY && env.TERM !== "dumb") ||
      "CI" in env);

  colors = createColors(isColorSupported);
})();

export { colors as default };

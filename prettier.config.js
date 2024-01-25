/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlIdentifiers: ["sql"],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: "postgresql",
  keywordCase: "upper",
};

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss", "prettier-plugin-sql", "prettier-plugin-embed"],
  printWidth: 100,
  singleQuote: false,
  semi: true,
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
  bracketSpacing: true,
  endOfLine: "lf",
};

export default {
  ...config,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

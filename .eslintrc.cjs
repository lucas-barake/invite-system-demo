const path = require("path");

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      files: ["*.js", "*.jsx", "*.cjs"],
      env: {
        es6: true,
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: path.join(__dirname, "./tsconfig.json"),
      },
      plugins: ["@typescript-eslint", "eslint-plugin-react"],
      extends: [
        "plugin:@next/next/recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "plugin:tailwindcss/recommended",
        "plugin:react/recommended",
        "plugin:@next/next/recommended",
      ],
      rules: {
        "no-restricted-imports": "off",
        "@typescript-eslint/no-restricted-imports": [
          "error",
          {
            patterns: ["../*"],
          },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "warn",
          {
            prefer: "type-imports",
            fixStyle: "inline-type-imports",
          },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: { attributes: false },
          },
        ],
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "no-unused-vars": "off",
        "no-dupe-else-if": "error",
        "no-dupe-keys": "error",
        "no-duplicate-imports": "error",
        "no-unreachable": "error",
        "no-use-before-define": "error",
        "dot-notation": "error",
        eqeqeq: "error",
        "no-lonely-if": "error",
        "no-return-await": "error",
        "no-useless-catch": "error",
        "no-var": "error",
        "prefer-const": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
        "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
        "@typescript-eslint/no-empty-interface": "error",
        "consistent-return": "error",
        "@typescript-eslint/explicit-function-return-type": [
          "warn",
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
        "object-shorthand": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "no-implicit-coercion": "error",
        "@typescript-eslint/return-await": "error",
        "no-unneeded-ternary": "error",
        "@typescript-eslint/no-confusing-void-expression": "error",
        "@typescript-eslint/no-meaningless-void-operator": "warn",
        "no-plusplus": [
          "error",
          {
            allowForLoopAfterthoughts: true,
          },
        ],
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "no-shadow": "error",
        "@typescript-eslint/explicit-member-accessibility": [
          "error",
          {
            accessibility: "explicit",
            overrides: {
              accessors: "off",
              constructors: "no-public",
              methods: "explicit",
              properties: "explicit",
              parameterProperties: "explicit",
            },
          },
        ],
        "@typescript-eslint/consistent-type-exports": [
          "error",
          {
            fixMixedExportsWithInlineTypeSpecifier: true,
          },
        ],
        "@typescript-eslint/consistent-generic-constructors": "error",
        "@typescript-eslint/no-confusing-non-null-assertion": "error",
        "@typescript-eslint/no-duplicate-enum-values": "error",
        "@typescript-eslint/strict-boolean-expressions": [
          "error",
          {
            allowString: false,
            allowNumber: false,
            allowNullableObject: false,
            allowNullableBoolean: false,
            allowNullableString: false,
            allowNullableNumber: false,
            allowNullableEnum: false,
            allowAny: false,
            allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
          },
        ],
        "no-self-compare": "error",
        "prefer-template": "error",

        // React
        "react/prop-types": "off",
        "react/jsx-key": "error",
        "react/jsx-no-target-blank": "error",
        "react/jsx-no-useless-fragment": "warn",
        "react/no-array-index-key": "warn",
        "react/no-deprecated": "warn",
        "react/no-unused-state": "error",
        "react/button-has-type": "error",
        "react/display-name": "error",
        "react/hook-use-state": "error",
        "react/jsx-fragments": ["error", "element"],
        "react/no-children-prop": "off",
        "react/react-in-jsx-scope": "off",

        // Tailwind
        "tailwindcss/classnames-order": "error",
        "tailwindcss/enforces-negative-arbitrary-values": "error",
        "tailwindcss/enforces-shorthand": "error",
        "tailwindcss/no-contradicting-classname": "error",
      },
    },
  ],
};

module.exports = config;

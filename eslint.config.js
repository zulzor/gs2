import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import babelParser from "@babel/eslint-parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: react,
    },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": "warn"
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  prettier,
];

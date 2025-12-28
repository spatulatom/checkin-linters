import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import compat from "eslint-plugin-compat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Browser compatibility checking (same targets as browserslist in package.json)
  {
    plugins: { compat },
    rules: {
      "compat/compat": "warn",
    },
    settings: {
      browsers: ["Chrome >= 60", "Firefox >= 55", "Safari >= 11", "Edge >= 79"],
    },
  },
  // Special config for checking built output (only compat rules, no code quality)
  {
    files: [".next/static/chunks/**/*.js"],
    plugins: { compat },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "compat/compat": "warn",
    },
    settings: {
      browsers: ["Chrome >= 60", "Firefox >= 55", "Safari >= 11", "Edge >= 79"],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Ignore build output EXCEPT for the chunks we want to check
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".next/cache/**",
    ".next/server/**",
    ".next/types/**",
  ]),
]);

export default eslintConfig;

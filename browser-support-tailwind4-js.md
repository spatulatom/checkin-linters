# Browser Support: Tailwind CSS v4 + JavaScript

> A practical guide to understanding and checking browser compatibility in modern web projects.

---

## Table of Contents

1. [Key Misconceptions to Avoid](#1-key-misconceptions-to-avoid)
2. [The Mental Model: Syntax vs APIs vs CSS Features](#2-the-mental-model-syntax-vs-apis-vs-css-features)
   - [JavaScript: Syntax vs APIs](#javascript-has-two-concerns)
   - [CSS: Just Features](#css-is-simpler)
3. [Who Uses What: Tool Data Sources](#3-who-uses-what-tool-data-sources)
4. [Default Browser Targets](#4-default-browser-targets)
   - [CSS: Tailwind v4 (Hardcoded)](#tailwind-v4-css-hardcoded)
   - [JavaScript: Vite/esbuild](#viteesbuild-javascript)
5. [Setting Up Compatibility Checking](#5-setting-up-compatibility-checking)
   - [JavaScript: ESLint + compat plugin](#javascript-api-checking-eslint)
   - [CSS: Stylelint](#css-feature-checking-stylelint)
6. [Configuring Browser Targets](#6-configuring-browser-targets)
7. [Limitations to Be Aware Of](#7-limitations-to-be-aware-of)
8. [Quick Reference](#8-quick-reference)

---

## 1. Key Misconceptions to Avoid

### ❌ `npx browserslist` shows your actual browser support

**Reality:** It only shows:

- That browserslist is installed
- Your configured query (or defaults)
- A list that **most tools ignore**

Tailwind v4, Vite, and esbuild all **ignore browserslist**. Only ESLint, Stylelint, and Next.js SWC use it.

### ❌ ESLint checks browser compatibility by default

**Reality:** ESLint core only checks code quality (unused variables, syntax errors, style issues). Browser API checking requires **eslint-plugin-compat** — it's not built-in.

### ❌ `ecmaVersion` in ESLint config controls browser support

**Reality:** `ecmaVersion: 2022` only tells ESLint's parser what syntax to understand. It has **zero effect** on browser compatibility checking.

```javascript
languageOptions: {
  ecmaVersion: 2022,  // Parser setting, NOT browser targeting
}
```

### ❌ TypeScript compiles your code for older browsers

**Reality:** In Vite projects with `noEmit: true`, TypeScript only type-checks. The bundler (esbuild) handles all syntax transformation.

### ❌ Linters show which browsers your code supports

**Reality:** ESLint and Stylelint are **problem reporters**, not compatibility reporters. They only warn when something is **wrong** — no output means no problems found.

---

## 2. The Mental Model: Syntax vs APIs vs CSS Features

### JavaScript Has Two Concerns

| Concern    | What It Is                                          | Who Handles It                   | Your Responsibility               |
| ---------- | --------------------------------------------------- | -------------------------------- | --------------------------------- |
| **Syntax** | Grammar: `?.`, `??`, `=>`, `class`                  | Bundler transforms automatically | None (trust your build target)    |
| **APIs**   | Vocabulary: `fetch()`, `structuredClone()`, `.at()` | Nobody — runs as-is              | Check with ESLint + compat plugin |

**The Translation Analogy:**

- **Syntax** = Grammar rules ("I will" → "Je vais") — translator handles
- **APIs** = Vocabulary ("defenestration") — word must exist in target language

### CSS Is Simpler

CSS has no syntax/API split. Everything is a **feature**:

- `display: flex` — feature
- `oklch()` — feature
- `@layer` — feature

Features either work, get ignored, or partially work. No crashes.

---

## 3. Who Uses What: Tool Data Sources

### The Browserslist Misconception

```
┌─────────────────────────────────────┐
│     browserslist config/query       │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
 ✅ Uses               ❌ Ignores
 - eslint-plugin-compat   - Vite/esbuild
 - Stylelint plugin       - Tailwind v4
 - Next.js SWC            - Lightning CSS
```

### Data Sources for Compatibility Checking

| Tool                     | Browser List From                       | Compatibility Data From |
| ------------------------ | --------------------------------------- | ----------------------- |
| **eslint-plugin-compat** | `settings.browsers` in eslint.config.js | MDN browser-compat-data |
| **Stylelint plugin**     | `browsers` in .stylelintrc.json         | caniuse-lite            |
| **Vite/esbuild**         | `build.target` in vite.config.js        | Internal (hardcoded)    |
| **Tailwind v4**          | Hardcoded (not configurable)            | N/A                     |

**Key insight:** ESLint uses **MDN data** (for JS APIs), Stylelint uses **caniuse data** (for CSS features). They're separate databases with different update cycles.

---

## 4. Default Browser Targets

### Tailwind v4 CSS (Hardcoded)

| Browser    | Minimum Version |
| ---------- | --------------- |
| Safari/iOS | 16.4+           |
| Chrome     | 111+            |
| Firefox    | 128+            |

**⚠️ Not configurable.** Tailwind v4 ignores browserslist entirely.

### Vite/esbuild JavaScript

Default target: **ES2020** (or `baseline-widely-available` in Vite 6+)

| ES Target | Safari | Chrome | Firefox |
| --------- | ------ | ------ | ------- |
| `es2020`  | 14+    | 80+    | 72+     |
| `es2018`  | 12+    | 71+    | 78+     |
| `es2015`  | 10+    | 51+    | 54+     |

---

## 5. Setting Up Compatibility Checking

### JavaScript API Checking (ESLint)

**Required packages:**

```
eslint
@eslint/js
typescript-eslint
eslint-plugin-compat
browserslist (used as a library by compat plugin)
```

**Config structure:**

```javascript
// eslint.config.js
import compat from "eslint-plugin-compat";

export default [
  {
    plugins: { compat },
    rules: {
      "compat/compat": "warn", // Required — not enabled by default
    },
    settings: {
      browsers: ["safari >= 12", "chrome >= 80", "firefox >= 72"],
    },
  },
];
```

**Key points:**

- `settings.browsers` is ONLY for eslint-plugin-compat
- Without the plugin, this setting does nothing
- The plugin checks APIs against MDN browser-compat-data

**Command:**

```powershell
npx eslint src/*.ts
```

### CSS Feature Checking (Stylelint)

**Required packages:**

```
stylelint
stylelint-no-unsupported-browser-features
browserslist
```

**Config structure:**

```json
// .stylelintrc.json
{
  "plugins": ["stylelint-no-unsupported-browser-features"],
  "rules": {
    "plugin/no-unsupported-browser-features": [
      true,
      {
        "browsers": ["safari >= 12", "chrome >= 80", "firefox >= 72"],
        "severity": "warning"
      }
    ]
  }
}
```

**Commands:**

```powershell
# Check source CSS
npx stylelint "src/**/*.css"

# Check built CSS (recommended — includes all Tailwind utilities)
npx stylelint "dist/assets/*.css"
```

---

## 6. Configuring Browser Targets

### What You CAN Configure

| Tool                       | Configurable? | Where                                   |
| -------------------------- | ------------- | --------------------------------------- |
| **Vite JS output**         | ✅ Yes        | `build.target` in vite.config.js        |
| **ESLint API checking**    | ✅ Yes        | `settings.browsers` in eslint.config.js |
| **Stylelint CSS checking** | ✅ Yes        | `browsers` in .stylelintrc.json         |
| **Tailwind v4 CSS output** | ❌ No         | Hardcoded (Safari 16.4+, Chrome 111+)   |

### Vite Build Target Options

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // Option 1: ES version
    target: "es2018",

    // Option 2: Specific browsers
    target: ["safari12", "chrome80", "firefox72"],

    // Option 3: Latest (minimal transpilation)
    target: "esnext",
  },
});
```

### Aligning Your Targets

For consistency, align your checking tools with your build output:

| Config Location                          | Purpose          | Example            |
| ---------------------------------------- | ---------------- | ------------------ |
| `vite.config.js` → `build.target`        | Actual JS output | `"es2018"`         |
| `eslint.config.js` → `settings.browsers` | API checking     | `["safari >= 12"]` |
| `.stylelintrc.json` → `browsers`         | CSS checking     | `["safari >= 12"]` |

---

## 7. Limitations to Be Aware Of

### ESLint Can't Detect Fallbacks

```javascript
// Your code with proper fallback:
window.requestIdleCallback ? requestIdleCallback(fn) : setTimeout(fn, 1);
```

**ESLint will still warn** about `requestIdleCallback` not being supported. It performs static analysis only — it can't understand that you've handled the incompatibility gracefully.

**Options:**

1. Ignore the warning (you know you have a fallback)
2. Add `// eslint-disable-next-line compat/compat`

### Not All APIs Are in the Database

eslint-plugin-compat uses MDN browser-compat-data, which may lag behind caniuse for very new APIs.

**Example:** `Promise.withResolvers()` (2024) may not trigger a warning even when unsupported in your targets.

**For bleeding-edge APIs:** Manually check caniuse.com

### Checking Built Files Has Caveats

You can check `dist/*.js` with ESLint, but:

1. Minified code triggers false positives (disable code quality rules)
2. APIs are identical to source (bundler doesn't add/remove APIs)
3. Syntax is guaranteed by your build target (no need to check)

---

## 8. Quick Reference

### Commands

| Check                | Command                                 |
| -------------------- | --------------------------------------- |
| JS APIs (source)     | `npx eslint src/*.ts`                   |
| CSS features (built) | `npx stylelint "dist/assets/*.css"`     |
| Browserslist query   | `npx browserslist` (informational only) |

### What Each Tool Does

| Tool                 | Checks                      | Affects Build?             |
| -------------------- | --------------------------- | -------------------------- |
| ESLint core          | Code quality, syntax errors | ❌ No                      |
| eslint-plugin-compat | JS API browser support      | ❌ No                      |
| Stylelint plugin     | CSS feature browser support | ❌ No                      |
| TypeScript           | Types (with `noEmit: true`) | ❌ No                      |
| Vite/esbuild         | —                           | ✅ Yes (transforms syntax) |
| Tailwind v4          | —                           | ✅ Yes (outputs CSS)       |

### Output Interpretation

| Tool Output                  | Meaning                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| No warnings                  | ✅ All APIs/features work in your targets                         |
| Warnings listed              | ⚠️ These specific items don't work                                |
| No "supported browsers" list | Normal — these are problem reporters, not compatibility reporters |

### Browser Support Summary

| Output Type       | Minimum Support           | Configurable?     |
| ----------------- | ------------------------- | ----------------- |
| CSS (Tailwind v4) | Safari 16.4+, Chrome 111+ | ❌ No             |
| JS Syntax (Vite)  | Depends on `build.target` | ✅ Yes            |
| JS APIs           | Depends on what you use   | Check with ESLint |

---

## Next.js Differences

Next.js 16+ uses **SWC** instead of esbuild and **respects browserslist** for JS targets.

| Aspect           | Vite                             | Next.js                        |
| ---------------- | -------------------------------- | ------------------------------ |
| JS target config | `build.target` in vite.config.js | `browserslist` in package.json |
| Build output     | `dist/`                          | `.next/`                       |
| CSS engine       | Lightning CSS                    | Lightning CSS (same)           |

CSS behavior is identical — Tailwind v4's hardcoded targets apply regardless of framework.

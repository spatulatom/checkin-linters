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
5. [Quick Audit Tools (One-Time Checks)](#5-quick-audit-tools-one-time-checks)
   - [JavaScript Syntax: es-check](#javascript-syntax-es-check)
   - [CSS Features: doiuse](#css-features-doiuse)
6. [Setting Up Ongoing Compatibility Checking](#6-setting-up-ongoing-compatibility-checking)
   - [JavaScript: ESLint + compat plugin](#javascript-api-checking-eslint)
   - [CSS: Stylelint](#css-feature-checking-stylelint)
7. [Configuring Browser Targets](#7-configuring-browser-targets)
8. [Limitations to Be Aware Of](#8-limitations-to-be-aware-of)
9. [Quick Reference](#9-quick-reference)

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

## 5. Quick Audit Tools (One-Time Checks)

These tools are perfect for **discovery and auditing** — quickly checking what ES level or CSS features your build actually outputs. They require no configuration and give immediate answers.

### JavaScript Syntax: es-check

**Purpose:** Verify what ECMAScript version your built JavaScript actually requires.

**Install:**

```powershell
npm install -D es-check
```

**Usage — test against different ES versions:**

```powershell
# Check if build output is ES2017 compatible
npx es-check es2017 "dist/assets/*.js"

# Check if build output is ES2022 compatible
npx es-check es2022 "dist/assets/*.js"

# For Next.js projects
npx es-check es2022 ".next/static/chunks/*.js"
```

**How it works:** The tool parses your JS files with a parser set to a specific ES version. If the parser encounters syntax it doesn't understand at that level, it errors.

**Available ES levels:**

| Level    | Key Features Added                                         |
| -------- | ---------------------------------------------------------- |
| `es2015` | Arrow functions, classes, `let`/`const`, template literals |
| `es2017` | `async`/`await`                                            |
| `es2018` | Rest/spread properties, async iteration                    |
| `es2020` | Optional chaining `?.`, nullish coalescing `??`            |
| `es2022` | Private class fields `#`, `.at()`, top-level await         |
| `es2023` | Array findLast, hashbang grammar                           |

**Example output:**

```
# If code uses ES2022 features but you check against ES2017:
error: SyntaxError: Unexpected character '#' (1:2306)

# If code is compatible:
info: ✓ ES-Check passed! All files are ES2022 compatible.
```

**When to use:**

- Auditing a new project to understand its output level
- Verifying your bundler config is working as expected
- Checking third-party builds

**⚠️ Limitation:** Only checks **syntax**, not **runtime APIs**. Code could parse as ES2017 but still use `fetch()` or `IntersectionObserver`.

---

### CSS Features: doiuse

**Purpose:** Scan CSS files and report which features are unsupported in specified browsers.

**Install:**

```powershell
npm install -D doiuse
```

**Usage:**

```powershell
# Check against default browserslist
npx doiuse --browsers "defaults" "dist/assets/*.css"

# Check against specific browsers
npx doiuse --browsers "safari >= 12, chrome >= 80" "dist/assets/*.css"

# For Next.js projects
npx doiuse --browsers "defaults" ".next/static/chunks/*.css"
```

**Example output:**

```
style.css:1:1: CSS Variables not supported by: Opera Mini (all)
style.css:1:1: CSS Grid Layout not supported by: Opera Mini (all)
style.css:1:500: backdrop-filter not supported by: Opera Mini, Firefox (< 103)
```

**Data source:** Uses caniuse-lite (same as Stylelint plugin).

**When to use:**

- Quick one-time audit of CSS compatibility
- Checking built CSS (includes all Tailwind utilities)
- Understanding what browsers your CSS actually supports

---

### Comparison: Audit Tools vs. Ongoing Checking

| Aspect             | Audit Tools (es-check, doiuse) | Linter Plugins (ESLint, Stylelint)     |
| ------------------ | ------------------------------ | -------------------------------------- |
| Setup              | Zero config                    | Requires config files                  |
| Purpose            | Discovery / one-time check     | Ongoing enforcement                    |
| CI Integration     | Possible but basic             | Designed for CI                        |
| Editor Integration | ❌ None                        | ✅ Real-time warnings                  |
| Best for           | "What does my build output?"   | "Warn me when I use incompatible code" |

---

## 6. Setting Up Ongoing Compatibility Checking

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
import compat from 'eslint-plugin-compat';

export default [
  {
    plugins: { compat },
    rules: {
      'compat/compat': 'warn', // Required — not enabled by default
    },
    settings: {
      browsers: ['safari >= 12', 'chrome >= 80', 'firefox >= 72'],
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

## 7. Configuring Browser Targets

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
    target: 'es2018',

    // Option 2: Specific browsers
    target: ['safari12', 'chrome80', 'firefox72'],

    // Option 3: Latest (minimal transpilation)
    target: 'esnext',
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

## 8. Limitations to Be Aware Of

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

## 9. Quick Reference

### Commands

| Check                | Command                                         | Tool Type |
| -------------------- | ----------------------------------------------- | --------- |
| JS syntax (built)    | `npx es-check es2022 "dist/*.js"`               | Audit     |
| JS APIs (source)     | `npx eslint src/*.ts`                           | Ongoing   |
| CSS features (built) | `npx doiuse --browsers "defaults" "dist/*.css"` | Audit     |
| CSS features (built) | `npx stylelint "dist/assets/*.css"`             | Ongoing   |
| Browserslist query   | `npx browserslist` (informational only)         | Info      |

### What Each Tool Does

| Tool                 | Checks                      | Affects Build?             | Use Case |
| -------------------- | --------------------------- | -------------------------- | -------- |
| **es-check**         | JS syntax level             | ❌ No                      | Audit    |
| **doiuse**           | CSS feature browser support | ❌ No                      | Audit    |
| ESLint core          | Code quality, syntax errors | ❌ No                      | Ongoing  |
| eslint-plugin-compat | JS API browser support      | ❌ No                      | Ongoing  |
| Stylelint plugin     | CSS feature browser support | ❌ No                      | Ongoing  |
| TypeScript           | Types (with `noEmit: true`) | ❌ No                      | Ongoing  |
| Vite/esbuild         | —                           | ✅ Yes (transforms syntax) | Build    |
| Tailwind v4          | —                           | ✅ Yes (outputs CSS)       | Build    |

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

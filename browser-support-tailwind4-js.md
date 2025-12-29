# Browser Support: Tailwind CSS v4 + JavaScript

> A practical guide to understanding and checking browser compatibility in modern web projects.

---

## The Framework: Three Categories of Tools

Every web project has tools that fall into three categories. Understanding which role each tool plays clarifies the entire browser compatibility picture:

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. ECOSYSTEM (Build & Run)                                         │
│     "What produces my output?"                                      │
│     → Vite/esbuild, Next.js/SWC, Tailwind, TypeScript              │
├─────────────────────────────────────────────────────────────────────┤
│  2. LINTING (Code Quality)                                          │
│     "What checks code quality?"                                     │
│     → ESLint core, Prettier, TypeScript type-checking              │
├─────────────────────────────────────────────────────────────────────┤
│  3. CHECKING (Browser Compatibility)                                │
│     "What verifies browser support?"                                │
│     ├── 3a: Config Investigation (indirect)                        │
│     │       "What are tools configured to target?"                  │
│     │       → browserslist, vite.config.js, package.json           │
│     └── 3b: Output Measurement (direct)                             │
│             "What does the output actually require?"                │
│             → es-check, doiuse, eslint-plugin-compat               │
└─────────────────────────────────────────────────────────────────────┘
```

**Why this matters:** Most confusion comes from conflating these categories. ESLint core (category 2) doesn't check browser support. `npx browserslist` (category 3a) doesn't tell you what your build actually outputs.

> **Note:** This model describes _roles_, not rigid categories. Tools can wear multiple hats — ESLint with `eslint-plugin-compat` spans categories 2 and 3b.

---

## Table of Contents

1. [Ecosystem: Build Tools](#1-ecosystem-build-tools)
2. [Linting: Code Quality Tools](#2-linting-code-quality-tools)
3. [Checking: Browser Compatibility](#3-checking-browser-compatibility)
   - [3a: Config Investigation (Indirect)](#3a-config-investigation-indirect)
   - [3b: Output Measurement (Direct)](#3b-output-measurement-direct)
4. [Key Concepts: Syntax vs APIs vs CSS Features](#4-key-concepts-syntax-vs-apis-vs-css-features)
5. [Common Misconceptions](#5-common-misconceptions)
6. [Limitations to Be Aware Of](#6-limitations-to-be-aware-of)
7. [Quick Reference](#7-quick-reference)
8. [Appendix: Complete Config Files](#appendix-complete-config-files-copypaste-ready)
   - [Quick Audit Commands (3b)](#quick-audit-commands-3b)
   - [ESLint Config (Next.js)](#eslint-config-eslintconfigmjs)
   - [Stylelint Config](#stylelint-config-stylelintrcjson)
   - [Vite Project Variant](#vite-project-variant-eslintconfigmjs)

---

## 1. Ecosystem: Build Tools

> **Question answered:** "What produces my output?"

These tools transform and bundle your code. They determine the **actual syntax level** of your output.

### JavaScript Build Tools

| Tool             | Role                  | Browser Target Config                   |
| ---------------- | --------------------- | --------------------------------------- |
| **Vite/esbuild** | Bundler + transpiler  | `build.target` in vite.config.js        |
| **Next.js/SWC**  | Bundler + transpiler  | `browserslist` in package.json          |
| **TypeScript**   | Type-checker (noEmit) | N/A (doesn't transform in Vite/Next.js) |

**Key insight:** In modern setups, TypeScript with `noEmit: true` only type-checks. The bundler handles all syntax transformation.

### CSS Build Tools

| Tool              | Role            | Browser Target                                      |
| ----------------- | --------------- | --------------------------------------------------- |
| **Tailwind v4**   | Utility CSS     | Hardcoded (Safari 16.4+, Chrome 111+, Firefox 128+) |
| **Lightning CSS** | CSS transformer | Hardcoded by Tailwind                               |
| **Autoprefixer**  | Vendor prefixes | Uses browserslist                                   |

**⚠️ Tailwind v4 ignores browserslist entirely.** Its browser targets are hardcoded and not configurable.

### Default Browser Targets

#### Tailwind v4 CSS (Hardcoded)

| Browser    | Minimum Version |
| ---------- | --------------- |
| Safari/iOS | 16.4+           |
| Chrome     | 111+            |
| Firefox    | 128+            |

#### Vite/esbuild JavaScript

Default target: **ES2020** (or `baseline-widely-available` in Vite 6+)

| ES Target | Safari | Chrome | Firefox |
| --------- | ------ | ------ | ------- |
| `es2020`  | 14+    | 80+    | 72+     |
| `es2018`  | 12+    | 71+    | 78+     |
| `es2015`  | 10+    | 51+    | 54+     |

### Configuring Build Output

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

---

## 2. Linting: Code Quality Tools

> **Question answered:** "What checks code quality?"

These tools analyze your code for errors, style issues, and best practices. **They don't check browser compatibility by default.**

| Tool            | What It Checks                               |
| --------------- | -------------------------------------------- |
| **ESLint core** | Unused variables, syntax errors, code style  |
| **Prettier**    | Formatting (indentation, quotes, semicolons) |
| **TypeScript**  | Type errors, type safety                     |

**Critical distinction:** ESLint core does NOT check browser compatibility. That requires adding `eslint-plugin-compat` (which moves ESLint into category 3b).

---

## 3. Checking: Browser Compatibility

> **Question answered:** "What verifies browser support?"

This splits into two approaches:

### 3a: Config Investigation (Indirect)

> **Question answered:** "What are my tools _configured_ to target?"

This is **indirect** — you're reading config files and querying what tools _claim_ to target, not measuring actual output.

#### The Browserslist Query

```powershell
npx browserslist
```

**What it tells you:**

- That browserslist is installed
- Your configured query (or defaults)
- A list of browser versions matching that query

**What it DOESN'T tell you:**

- What your build actually outputs
- Which tools actually use this list

#### Who Uses Browserslist?

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
 - Autoprefixer
```

#### Config Locations by Tool

| Tool                       | Config Location                         | Configurable? |
| -------------------------- | --------------------------------------- | ------------- |
| **Vite JS output**         | `build.target` in vite.config.js        | ✅ Yes        |
| **Next.js JS output**      | `browserslist` in package.json          | ✅ Yes        |
| **ESLint API checking**    | `settings.browsers` in eslint.config.js | ✅ Yes        |
| **Stylelint CSS checking** | `browsers` in .stylelintrc.json         | ✅ Yes        |
| **Tailwind v4 CSS output** | Hardcoded                               | ❌ No         |

#### Data Sources for Checking Tools

| Tool                     | Browser List From                       | Compatibility Data From |
| ------------------------ | --------------------------------------- | ----------------------- |
| **eslint-plugin-compat** | `settings.browsers` in eslint.config.js | MDN browser-compat-data |
| **Stylelint plugin**     | `browsers` in .stylelintrc.json         | caniuse-lite            |
| **Vite/esbuild**         | `build.target` in vite.config.js        | Internal (hardcoded)    |
| **Tailwind v4**          | Hardcoded (not configurable)            | N/A                     |

**Key insight:** ESLint uses **MDN data** (for JS APIs), Stylelint uses **caniuse data** (for CSS features). They're separate databases with different update cycles.

---

### 3b: Output Measurement (Direct)

> **Question answered:** "What does my build output _actually_ require?"

This is **direct** — you're measuring the actual built files. This is the **source of truth**.

#### Tool Capabilities Overview

| Tool                | Checks          | Source Code | Build Output | Editor Integration |
| ------------------- | --------------- | ----------- | ------------ | ------------------ |
| **es-check**        | JS syntax level | ❌          | ✅           | ❌                 |
| **doiuse**          | CSS features    | ✅          | ✅           | ❌                 |
| **ESLint + compat** | JS APIs         | ✅          | ✅           | ✅                 |
| **Stylelint**       | CSS features    | ✅          | ✅           | ✅                 |

**Key insight:** ESLint and Stylelint can check **both** source code (for real-time feedback) **and** build output (for source-of-truth verification). This makes them the most versatile option.

---

#### JavaScript Checking

##### Syntax Level: es-check

**Purpose:** Verify what ECMAScript version your built JavaScript actually requires.

**Install:**

```powershell
npm install -D es-check
```

**Usage:**

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

**⚠️ Limitation:** Only checks **syntax**, not **runtime APIs**. Code could parse as ES2017 but still use `fetch()` or `IntersectionObserver`.

---

#### CSS Checking

##### Feature Scanning: doiuse

**Purpose:** Scan CSS files and report which features are unsupported in specified browsers. Zero-config option for quick checks.

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

**Data source:** Uses caniuse-lite.

##### Feature Checking: Stylelint

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
# Check source CSS (real-time feedback in editor)
npx stylelint "src/**/*.css"

# Check built CSS (source of truth — includes all Tailwind utilities)
npx stylelint "dist/assets/*.css"

# For Next.js projects
npx stylelint ".next/static/css/*.css"
```

**Checking build output** gives you the source of truth while still using the same tooling and configuration.

---

#### ESLint + compat plugin (Full Setup)

**Required packages:**

```
eslint
@eslint/js
typescript-eslint
eslint-plugin-compat
browserslist
```

**Config structure for checking both source AND build output:**

```javascript
// eslint.config.js
import compat from "eslint-plugin-compat";
import { globalIgnores } from "eslint/config";

export default [
  // Check source code (editor integration + CI)
  {
    plugins: { compat },
    rules: {
      "compat/compat": "warn",
    },
    settings: {
      browsers: ["Chrome >= 60", "Firefox >= 55", "Safari >= 11", "Edge >= 79"],
    },
  },
  // Check build output (source of truth)
  {
    files: [".next/static/chunks/**/*.js"], // or 'dist/assets/*.js' for Vite
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
  // Don't ignore build output you want to check
  globalIgnores([
    ".next/cache/**",
    ".next/server/**",
    // NOT ignoring .next/static/chunks/**
  ]),
];
```

**Key points:**

- `settings.browsers` is ONLY for eslint-plugin-compat
- Without the plugin, this setting does nothing
- The plugin checks APIs against MDN browser-compat-data
- **Same tool** can check source (for editor feedback) AND build output (for verification)

**Commands:**

```powershell
# Check source code
npx eslint src/*.ts

# Check build output
npx eslint ".next/static/chunks/*.js"
```

---

#### Choosing Your Approach

| Need                                  | Recommended Approach                          |
| ------------------------------------- | --------------------------------------------- |
| Quick one-time syntax check           | `es-check`                                    |
| Quick one-time CSS check              | `doiuse`                                      |
| Ongoing enforcement + editor feedback | ESLint/Stylelint on source                    |
| Source of truth verification          | ESLint/Stylelint on build output              |
| **Best of both worlds**               | ESLint/Stylelint on **both** source AND build |

---

## 4. Key Concepts: Syntax vs APIs vs CSS Features

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

## 5. Common Misconceptions

### ❌ `npx browserslist` shows your actual browser support

**Reality:** It only shows your configured query. Most build tools (Vite, Tailwind v4) **ignore browserslist**.

### ❌ ESLint checks browser compatibility by default

**Reality:** ESLint core only checks code quality. Browser API checking requires **eslint-plugin-compat**.

### ❌ `ecmaVersion` in ESLint config controls browser support

**Reality:** `ecmaVersion: 2022` only tells ESLint's parser what syntax to understand. It has **zero effect** on browser compatibility checking.

```javascript
languageOptions: {
  ecmaVersion: 2022,  // Parser setting, NOT browser targeting
}
```

### ❌ TypeScript compiles your code for older browsers

**Reality:** In Vite/Next.js projects with `noEmit: true`, TypeScript only type-checks. The bundler handles all syntax transformation.

### ❌ Linters show which browsers your code supports

**Reality:** ESLint and Stylelint are **problem reporters**, not compatibility reporters. They only warn when something is **wrong** — no output means no problems found.

---

## 6. Limitations to Be Aware Of

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

You can (and should) check build output with ESLint/Stylelint, but be aware:

1. **Disable code quality rules for build output** — minified code triggers false positives. Only enable `compat/compat` for built files.
2. **APIs are identical to source** — bundler doesn't add/remove APIs, but checking build output confirms nothing was unexpectedly introduced by dependencies.
3. **Syntax is guaranteed by your build target** — use `es-check` only if you don't trust your build config.

**Recommended setup:** Check source for real-time feedback, check build output in CI for verification.

---

## 7. Quick Reference

### Commands

| Check                                  | Command                                         | Target       |
| -------------------------------------- | ----------------------------------------------- | ------------ |
| What browsers does browserslist query? | `npx browserslist`                              | Config       |
| JS syntax (built)                      | `npx es-check es2022 "dist/*.js"`               | Build output |
| JS APIs (source)                       | `npx eslint src/*.ts`                           | Source       |
| JS APIs (built)                        | `npx eslint ".next/static/chunks/*.js"`         | Build output |
| CSS features (quick check)             | `npx doiuse --browsers "defaults" "dist/*.css"` | Build output |
| CSS features (source)                  | `npx stylelint "src/**/*.css"`                  | Source       |
| CSS features (built)                   | `npx stylelint "dist/assets/*.css"`             | Build output |

### What Each Tool Does

| Tool                 | Category      | Checks                      | Source | Build | Editor |
| -------------------- | ------------- | --------------------------- | ------ | ----- | ------ |
| Vite/esbuild         | 1 (Ecosystem) | —                           | —      | —     | —      |
| Tailwind v4          | 1 (Ecosystem) | —                           | —      | —     | —      |
| ESLint core          | 2 (Linting)   | Code quality, syntax errors | ✅     | ✅    | ✅     |
| TypeScript           | 2 (Linting)   | Types (with `noEmit: true`) | ✅     | ❌    | ✅     |
| browserslist         | 3a (Config)   | Shows configured query      | —      | —     | —      |
| **es-check**         | 3b (Output)   | JS syntax level             | ❌     | ✅    | ❌     |
| **doiuse**           | 3b (Output)   | CSS feature support         | ✅     | ✅    | ❌     |
| eslint-plugin-compat | 3b (Output)   | JS API browser support      | ✅     | ✅    | ✅     |
| Stylelint plugin     | 3b (Output)   | CSS feature browser support | ✅     | ✅    | ✅     |

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

---

## Appendix: Complete Config Files (Copy/Paste Ready)

These configs check browser compatibility for **both source code and build output**. Adjust the `browsers` array to match your project's requirements.

### Quick Audit Commands (3b)

**Build your project first**, then run these commands to check browser compatibility of the output.

#### Next.js Project

```powershell
# Check built JavaScript (APIs)
npx eslint ".next/static/chunks/**/*.js"

# Check built CSS (features)
npx stylelint ".next/static/css/**/*.css"

# Both in one line
npx eslint ".next/static/chunks/**/*.js"; npx stylelint ".next/static/css/**/*.css"
```

#### Vite Project

```powershell
# Check built JavaScript (APIs)
npx eslint "dist/assets/**/*.js"

# Check built CSS (features)
npx stylelint "dist/assets/**/*.css"

# Both in one line
npx eslint "dist/assets/**/*.js"; npx stylelint "dist/assets/**/*.css"
```

#### Add to package.json (optional)

```json
{
  "scripts": {
    "check:compat": "eslint \".next/static/chunks/**/*.js\" && stylelint \".next/static/css/**/*.css\"",
    "check:compat:js": "eslint \".next/static/chunks/**/*.js\"",
    "check:compat:css": "stylelint \".next/static/css/**/*.css\""
  }
}
```

Then run: `npm run check:compat`

---

### ESLint Config (eslint.config.mjs)

```javascript
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
```

**Required packages:**

```bash
npm install -D eslint eslint-plugin-compat eslint-config-next
```

**Usage:**

```bash
# Check source code
npx eslint "app/**/*.{ts,tsx}"

# Check build output
npx eslint ".next/static/chunks/**/*.js"
```

---

### Stylelint Config (.stylelintrc.json)

```json
{
  "plugins": ["stylelint-no-unsupported-browser-features"],
  "rules": {
    "plugin/no-unsupported-browser-features": [
      true,
      {
        "browsers": [
          "Chrome >= 60",
          "Firefox >= 55",
          "Safari >= 11",
          "Edge >= 79"
        ],
        "severity": "warning"
      }
    ]
  }
}
```

**Required packages:**

```bash
npm install -D stylelint stylelint-no-unsupported-browser-features
```

**Usage:**

```bash
# Check source CSS
npx stylelint "app/**/*.css"

# Check build output (includes all Tailwind utilities)
npx stylelint ".next/static/css/**/*.css"
```

---

### Vite Project Variant (eslint.config.mjs)

For non-Next.js projects using Vite:

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import compat from "eslint-plugin-compat";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Browser compatibility checking
  {
    plugins: { compat },
    rules: {
      "compat/compat": "warn",
    },
    settings: {
      browsers: ["Chrome >= 60", "Firefox >= 55", "Safari >= 11", "Edge >= 79"],
    },
  },
  // Check build output
  {
    files: ["dist/assets/**/*.js"],
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
  globalIgnores([
    "dist/**",
    "!dist/assets/**/*.js", // Don't ignore the JS we want to check
  ]),
]);

export default eslintConfig;
```

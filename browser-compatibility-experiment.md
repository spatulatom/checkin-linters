# Browser Compatibility Experiment

> Testing browser compatibility checking on a fresh Next.js 16 project with Tailwind CSS v4

---

## Table of Contents

1. [Experiment Setup](#experiment-setup)
2. [Findings](#findings)
3. [Critical Discovery: Default ESLint Has No Browser Guards](#critical-discovery-default-eslint-has-no-browser-guards)
4. [What We Learned](#what-we-learned)
5. [Real-World Usage](#real-world-usage)
6. [Configuration Files](#configuration-files-created)
7. [Conclusion](#conclusion)
8. [Commands Reference](#commands-reference)

---

## Experiment Setup

### Goal

Check what CSS features and JS APIs the built Next.js output actually uses, and see which would fail in "ancient" browsers.

### Target Browsers (Intentionally Old)

```json
"browserslist": [
  "Chrome >= 60",
  "Firefox >= 55",
  "Safari >= 11",
  "Edge >= 79"
]
```

These are ~7 years old (2017-2019 era) to stress-test compatibility.

### Tools Installed

| Tool                                        | Purpose                                    |
| ------------------------------------------- | ------------------------------------------ |
| `eslint-plugin-compat`                      | Check JS APIs against browser targets      |
| `stylelint`                                 | CSS linting framework                      |
| `stylelint-no-unsupported-browser-features` | Check CSS features against browser targets |

---

## Findings

### CSS Compatibility: 92 Warnings

Tailwind CSS v4 uses modern CSS features that don't work in ancient browsers:

| Feature                   | What It Is                  | Not Supported In                        |
| ------------------------- | --------------------------- | --------------------------------------- |
| `@layer` (cascade layers) | CSS organization            | Chrome <99, Firefox <97, Safari <15.4   |
| `oklch()` color function  | Modern color space          | Chrome <111, Firefox <113, Safari <15.4 |
| `lab()`/`lch()` colors    | Perceptually uniform colors | Same as oklch                           |
| `prefers-color-scheme`    | Dark mode detection         | Firefox <67, Chrome <76, Safari <12.1   |
| `:is()` / `:where()`      | Modern selectors            | Chrome <88, Firefox <78, Safari <14     |
| `appearance: none`        | Form styling reset          | Partial support in old browsers         |
| Variable fonts            | `font-variation-settings`   | Firefox <62, Chrome <62                 |
| `::file-selector-button`  | File input styling          | Firefox <82                             |

**Key Insight:** Tailwind v4 has **hardcoded** browser targets (Safari 16.4+, Chrome 111+, Firefox 128+). Your browserslist does NOT change what CSS it outputs.

### JS API Compatibility: 20 Warnings

Next.js/React runtime uses modern JavaScript APIs:

| API                          | Not Supported In                          | Used By                 |
| ---------------------------- | ----------------------------------------- | ----------------------- |
| `AbortController`            | Safari 11, Firefox 55, Chrome 60          | React/fetch             |
| `ReadableStream`             | Firefox 55                                | Streaming SSR           |
| `IntersectionObserver`       | Safari 11                                 | next/image lazy loading |
| `Object.fromEntries()`       | Safari 11, Firefox 55, Chrome 60          | Various utilities       |
| `Object.hasOwn()`            | Safari 11, Firefox 55, Edge 79, Chrome 60 | Property checking       |
| `String.trimStart/trimEnd()` | Safari 11, Firefox 55, Chrome 60          | String utilities        |
| `Symbol.asyncIterator()`     | Safari 11, Firefox 55, Chrome 60          | Async iteration         |
| `DOMRect`                    | Chrome 60                                 | Layout measurements     |

**Key Insight:** These APIs are in Next.js/React core, not your code. You can't avoid them without polyfills.

---

## What We Learned

### 1. Browserslist Doesn't Control Output

Setting `browserslist` in package.json only affects:

- ✅ **Checking tools** (eslint-plugin-compat, stylelint plugin)
- ✅ **Next.js SWC** (JS syntax transpilation)
- ❌ **NOT** Tailwind v4 CSS output (hardcoded targets)
- ❌ **NOT** Next.js runtime API usage

### 2. Modern Frameworks Require Modern Browsers

A fresh `create-next-app` in 2025 uses:

- React 19 (needs modern APIs)
- Tailwind v4 (needs CSS cascade layers, oklch colors)
- Next.js 16 (streaming, modern fetch patterns)

**Realistic minimum browser support:** Chrome 90+, Firefox 90+, Safari 15+

### 3. Checking Source vs Built Output

| Check                | Source Files           | Built Files                 |
| -------------------- | ---------------------- | --------------------------- |
| **Your code's APIs** | ✅ Useful              | Redundant (same APIs)       |
| **Framework APIs**   | ❌ Not visible         | ✅ Reveals all dependencies |
| **CSS features**     | Limited (pre-Tailwind) | ✅ Full picture             |
| **Code quality**     | ✅ Useful              | ❌ Noisy (minified code)    |

**Recommendation:** Check CSS on built output, check JS APIs on source.

### 4. Minified Code Creates Noise

Running ESLint on built JS shows thousands of warnings like:

- `Expected an assignment or function call` (minification patterns)
- `'e' is defined but never used` (short variable names)

These are false positives from minification, not real issues.

---

## Critical Discovery: Default ESLint Has No Browser Guards

**The default Next.js ESLint setup provides ZERO browser API protection.**

### Test: Using Bleeding-Edge APIs

We created a test file using Chrome-only APIs:

```typescript
// APIs that only work in Chrome, NOT Firefox/Safari
document.startViewTransition(() => {}); // Chrome 111+ only
scheduler.postTask(() => {}); // Chrome 94+ only
navigation.navigate("/somewhere"); // Chrome 102+ only
window.showOpenFilePicker(); // Chrome 86+ only
new EyeDropper(); // Chrome 95+ only
```

### Results

| Config                      | Warning Count     |
| --------------------------- | ----------------- |
| Default Next.js ESLint      | **0 warnings** ❌ |
| With `eslint-plugin-compat` | **5 warnings** ✅ |

**Without the compat plugin:**

- ESLint won't warn you
- TypeScript won't warn you (if types exist)
- Build won't fail
- Users on Firefox/Safari get runtime errors

### The Only Ways to Catch Browser API Issues

1. `eslint-plugin-compat` with browser targets
2. Manual testing in different browsers
3. Real users reporting bugs
4. Error monitoring (Sentry) in production

---

## Real-World Usage

### What Most Projects Do: Just Use Defaults

99% of teams ship with the default Next.js/Vite ESLint config without browser checking because:

- Time pressure favors features over tooling
- Modern browsers dominate (~95%+ of traffic)
- Framework handles syntax transpilation
- "It works in Chrome" is often good enough

### Who Actually Does Deep Browser Checking?

| Type                | Why                                       |
| ------------------- | ----------------------------------------- |
| Banks/Finance       | Legal requirements, corporate browsers    |
| Government          | Accessibility laws, legacy support        |
| E-commerce giants   | Every 0.1% of users = millions in revenue |
| Embedded/Kiosk apps | Locked browser versions                   |

### The Real-World Alternative Strategy

Instead of lint-time browser checking, most successful teams:

1. **Trust the framework** - Next.js/Vite handle 99% of compatibility
2. **Use analytics** - Check actual user browser stats
3. **Test in CI** - Playwright/Cypress with real browsers
4. **Monitor errors** - Sentry/LogRocket catch real-world failures

---

## Configuration Files Created

### eslint.config.mjs (with compat plugin)

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import compat from "eslint-plugin-compat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { compat },
    rules: {
      "compat/compat": "warn",
    },
    settings: {
      browsers: ["Chrome >= 60", "Firefox >= 55", "Safari >= 11", "Edge >= 79"],
    },
  },
  globalIgnores([...]),
]);
```

### .stylelintrc.json

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

---

## Conclusion

**If you need to support ancient browsers (Chrome 60, Safari 11):**

1. Don't use Tailwind v4 (use v3 with PostCSS fallbacks)
2. Add polyfills for modern APIs (core-js, whatwg-fetch)
3. Consider a different framework or SSR-only approach

**For realistic 2025 browser support (last 2 years):**

- Next.js 16 + Tailwind v4 works out of the box
- No compatibility checking needed for ~95%+ of users
- Monitor caniuse.com for specific features you use

**Key Takeaway:** The `eslint-plugin-compat` provides real value that default setups lack - but most teams rely on testing and monitoring instead.

---

## Commands Reference

```bash
npm run build                                    # Build first
npx stylelint ".next/static/chunks/*.css"        # Check CSS
npx eslint app/                                  # Check JS source
npx eslint ".next/static/chunks/*.js" --no-ignore 2>&1 | Select-String "compat/compat"  # Check built JS
```

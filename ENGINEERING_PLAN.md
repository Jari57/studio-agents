# Engineering Strategy: Eliminating TDZ & Production Crashes

This document outlines the engineering standards and structural changes required to eliminate "Temporal Dead Zone" (TDZ) crashes and improve production stability for `StudioView.jsx` and the wider codebase.

## 1. Immediate Prevention (Linting & Static Analysis)

The most effective way to prevent TDZ (ReferenceError: Cannot access 'X' before initialization) is to enforce it at build time.

### A. Enforce `no-use-before-define`
We must update `eslint.config.js` to strictly enforce that variables and components are defined before they are used.

**Action:** Add/Update rule in ESLint config:
```javascript
'no-use-before-define': ['error', { functions: false, classes: true, variables: true }]
```
*Note: We set `functions: false` because function hoisting is safe in JS, but variables/classes (const/let) are not.*

### B. Enforce Import Ordering
TDZ often occurs when `lazy()` components or constant values are declared *between* import statements.

**Action:** Enforce `import/order` or similar rule to ensure 100% of imports are at the top of the file.
```javascript
// Good
import React from 'react';
import { Icon } from 'lucide-react';
const Component = lazy(() => ...);

// Bad (Causes TDZ if bundler reorders)
import React from 'react';
const Component = lazy(() => ...); // Might need 'Ref' from below
import { Ref } from './Ref';
```

## 2. Structural Engineering (Refactoring `StudioView.jsx`)

`StudioView.jsx` (~14k lines) is a "God Component". Large files increase the likelihood of scope collision and hoisting issues because human developers lose track of definition order.

### A. Extract Sub-Components
Move standard UI sections into their own files. This eliminates the chance of them accessing variables from the parent scope by accident.

**Strategy:**
1. Identify independent sections (e.g., `NewsHub`, `ProjectBoard`).
2. Move them to `src/components/studio/`.
3. Pass data via props, removing reliance on massive closure scope.

### B. Extract Hooks
Logic for specific features (auth, voice, navigation) is currently mixed with UI code.

**Strategy:**
- `useStudioNavigation()`
- `useStudioAuth()`
- `useStudioVoice()`

## 3. Build & Bundling Safety

### A. Circular Dependency Checks
We verified `madge` today, but this should be part of the CI pipeline.

**Action:** Add to `package.json` scripts:
```json
"check:circular": "madge --circular src/"
```

### B. Strict Mode
React Strict Mode is enabled, which is good. It helps double-invoke effects to catch side-effects, but it doesn't catch TDZ. That is strictly a JS runtime engine constraint.

## 4. Testing Strategy

### A. Smoke Tests for Auth Flows
The crash happened *after* login. Our current tests might mock too much. We need an E2E test that actually logs in (or fully simulates the post-login state) and renders the dashboard.

**Action:** Enhance Playwright tests to cover the "Redirect Loop" scenario.

---

## Summary Recommendation

1. **Immediate:** I have already reordered imports in `StudioView.jsx` to fix the current crash.
2. **Short Term:** Enable `no-use-before-define` in ESLint and fix the resulting errors (likely many).
3. **Medium Term:** Split `StudioView.jsx` into at least 5 sub-files to reduce lexical scope complexity.

# CKM Navigator - Comprehensive Remediation Plan

## Phase 1: Critical Fixes (Stability & Loading)
**Goal:** Ensure app loads real content, not placeholders, and secure the data injection points.

1.  **Fix "Content Loading..." Fallback**
    *   Update `js/config/inline-fallback-en.js` to contain **actual** minimal content (the Intro sections) rather than "Content loading...", so even if fetch fails, the app is usable.
    *   Improve error handling in `I18nService` to retry fetching `en.json` once before falling back.

2.  **Service Worker Cache Busting**
    *   Update `sw.js` cache name to `ckm-navigator-v7`.
    *   Implement a "Skip Waiting" mechanism to force-update clients when a new version is deployed.

3.  **Security Hardening (XSS)**
    *   Refactor `renderSidebarChatSnippet` and `renderPassport` in `main.js` to use `DOMUtils.safeSetHTML` or `DOMUtils.createElement` instead of `insertAdjacentHTML`.

4.  **Fix Theme Storage**
    *   Refactor `initTheme` and `toggleTheme` to use `app.secureStorage` instead of raw `localStorage`.

## Phase 2: Functionality Restoration
**Goal:** Fix broken interactions and accessibility.

1.  **Refactor Focus Trap**
    *   Rewrite `trapFocus` in `main.js` to return a clean cleanup function.
    *   Standardize usages in `toggleChat` and `closeModal`.

2.  **Chatbot Static Fallback**
    *   Update `chatbot.js` to immediately detect if `/api` is unreachable (404/Connection Refused) and switch to "Static Mode" (providing pre-canned responses based on keyword matching from `search-engine.js` only, without trying to hit the AI).

## Phase 3: Architecture Modernization (Post-Fix)
**Goal:** Prevent regression and improve maintainability.

1.  **Split `main.js`**
    *   Extract `ChatController` (lines ~2700-3000) into `js/features/chat-controller.js`.
    *   Extract `QuizController` (lines ~3100-3300) into `js/features/quiz-controller.js`.
2.  **Add Build Script**
    *   Create a simple `scripts/build.js` that can minify JS/CSS for production (optional, but recommended).

---
## Execution Status
*   [x] Phase 1: Critical Fixes
*   [x] Phase 2: Functionality Restoration
*   [x] Phase 3: Architecture Modernization

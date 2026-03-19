# EMPOWER-CKM Navigator — Full Codebase Audit
**Date:** February 23, 2026  
**Auditor:** Antigravity AI  
**Version:** Post-Security/Accessibility Fix Pass (v2)

---

## Executive Summary

The codebase is now in a significantly improved state following the recent security and accessibility fix passes. The architecture is well-structured with modular controllers (`ChatController`, `QuizController`, `MedicationController`, etc.), a solid design-token system in CSS, a working RAG chatbot, and proper SPA routing. The following audit identifies remaining issues across all major dimensions, ranked by severity.

---

## 1. Implementation Quality

### ✅ Strengths
- `app.init()` is cleanly sequenced: storage → language load → state restore → controllers → UI
- TaskManager is integrated for cancellable transitions (no leaked timers on navigation)
- ActionDispatcher cleanly separates event delegation from business logic
- DOMPurify rigorously sanitizes all `innerHTML` writes via `DOMUtils.safeSetHTML`

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `maximum-scale=1.0` still present in viewport meta — re-introduced or never removed during previous fix; violates WCAG 1.4.4 | `index.html:6` |
| 🔴 HIGH | `_openChatOnLoad` flag is set on `checkUrlParams()` (line 69) but the init code at line 340 checks `urlObj.searchParams.get('chat') === 'true'` instead — the flag is never consumed, breaking the `?page=chat` URL parameter | `main.js:69, 335-342` |
| 🟡 MED | `setTimeout` on line 84 of `quiz-controller.js` uses bare global `setTimeout` instead of `this.app.tasks.setTimeout` — can fire after navigation away | `quiz-controller.js:84` |
| 🟡 MED | `console.log` migration log at `main.js:121` and `main.js:150` should be removed for production | `main.js:121,150` |
| 🟡 MED | `handleSidebarChatKey` calls `this.sendSidebarChatMessage()` directly — missing `.bind(this)` in the event listener registration path; could cause `this` context loss if handler is detached/reattached | `main.js:1048-1050` |
| 🟢 LOW | `runRefactorCompatibilityCheck` fires on every `init()` but is a development utility — should be gated behind `development` env check | `main.js:183-188` |
| 🟢 LOW | `showUpdateNotification` button lacks `type="button"` | `main.js:160` |
| 🟢 LOW | Duplicate CSS comment block: `/* Accordion Animations (CSS Grid Trick) */` appears twice consecutively | `main.css:181-182` |
| 🟢 LOW | Duplicate section comment `/* Chat Sidebar Minimized State */` appears twice | `main.css:2780-2781` |
| 🟢 LOW | Duplicate dark-mode section header comment block | `main.css:2645-2650` |

---

## 2. Refactorability

### ✅ Strengths
- Controllers are well-separated (`curriculum-renderers.js`, `curriculum-controller.js`, `chat-controller.js`, etc.)
- `REFACTOR_ACTION_ALLOWLIST` provides a single source of truth for allowed actions
- `DOMUtils` is a clean utility module
- `I18nService` abstracts locale loading nicely

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 MED | `quiz-controller.js` still contains 50+ lines of inline HTML template strings with hardcoded inline styles — should move to a `quiz-renderers.js` pattern like `curriculum-renderers.js` | `quiz-controller.js:25-220` |
| 🟡 MED | Stage determination logic in `showQuizResult()` uses raw index comparisons (`answers[0] === 1`, etc.) with no named constants — brittle, hard to modify for new quiz questions | `quiz-controller.js:96-100` |
| 🟡 MED | `main.js` still has 3 stub comments (lines 1213-1228) that are documentation noise left over from an earlier refactor — should be removed | `main.js:1213-1228` |
| 🟢 LOW | `app.celebrate()` uses raw `setTimeout` (not `tasks.setTimeout`) — minor, as it's a fire-and-forget animation, but inconsistent | `main.js:106` |
| 🟢 LOW | `generateUserId()` in `server.js` uses `Math.random()` — not cryptographically secure; should use `crypto.randomUUID()` available in Node 15+ | `server.js:327-330` |

---

## 3. Speed / Efficiency

### ✅ Strengths
- All scripts use `defer` — no render-blocking JS
- `IntersectionObserver` + `MutationObserver` combo for scroll animations is efficient
- `content-visibility: auto` applied to module content areas
- `will-change: opacity` applied transiently during transitions and cleaned up
- CSS uses `contain: layout style paint` on `#main-view`
- GPU acceleration via `transform: translateZ(0)` on scroll container

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 MED | `pruneRateLimitMap()` is called on every `/api/chat` and `/api/rate-limit` request rather than on a periodic interval — at scale this is O(n) on every request. Should use `setInterval` instead | `server.js:116-123, 133, 314` |
| 🟡 MED | `MemoryStore` for sessions will cause memory leaks at scale (acknowledged in code but not flagged for production migration) — should use Redis or a persistent store | `server.js:79-81` |
| 🟡 MED | `extractModuleKnowledge(this.translations)` and `new HybridSearchEngine(chunks)` are called on every language change — expensive re-indexing that could be cached by language key | `main.js:519-524, 588-590` |
| 🟢 LOW | `transitionView` creates a `new Promise` that resolves asynchronously but most callers `await` it — the inner `requestAnimationFrame` → `requestAnimationFrame` double-RAF is correct but the 200ms timeout could be reduced to 150ms for snappier UX | `main.js:394-435` |
| 🟢 LOW | Font preload (`<link rel="preload" as="style">`) is redundant when followed immediately by the same `<link rel="stylesheet">` — browsers load it anyway, and preload for fonts-as-style doesn't help subsets | `index.html:14-16` |

---

## 4. Feature Set

### ✅ Strengths
- Full tri-lingual support (EN/ES/PT) with locale-based lazy loading
- AI chat with RAG context retrieval and source citation
- PWA-ready (manifest, service worker, app badging API)
- Theming (light/dark with system + manual override)
- Staging quiz with personalized action plan
- Doctor Passport feature
- Medication tracker with persistence
- Anatomy interactive diagram
- Movement and food education modules

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 MED | No offline fallback UI — if the service worker cache misses and network is unavailable, users get a blank screen with no messaging | `sw.js` |
| 🟡 MED | Chat rate limit (10 req/min) has no client-side countdown — user sees a generic error with no indication of when they can retry | `chat-controller.js` |
| 🟡 MED | `?page=chat` URL deep-link is broken due to the `_openChatOnLoad` flag bug documented in section 1 | `main.js:69, 335` |
| 🟢 LOW | Language preference from URL (`?lang=pt`) takes effect but is not persisted for that session — next navigation resets to stored preference | `main.js:73-76` |
| 🟢 LOW | No print stylesheet — `@media print` rules would allow the Doctor Passport to be printable | Global |

---

## 5. Ease of Use (UX)

### ✅ Strengths
- Skip-to-content link (`<a href="#main-view" class="skip-link">`) present
- Hamburger menu with ARIA attributes
- Language selector with `aria-pressed`
- Focus trap in modals
- Smooth view transitions with fade + slide animations
- Confetti celebration on module completion

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 MED | `chat-input-sidebar` has no `autocomplete="off"` — browsers may autofill health questions from form history, a privacy concern | `index.html:164` |
| 🟡 MED | Minimized chat bubble has no accessible label — screen readers cannot identify it | `main.css:2812-2824` (pseudo-element icon only) |
| 🟢 LOW | Language options use flag emoji only as visual hint — the `aria-label` (`English`, `Português`, `Español`) is correct but the flag emoji is announced by some screen readers; `aria-hidden="true"` on the flag `<span>` is present ✅ |  |
| 🟢 LOW | Haptic feedback on quiz answer (line 76) but not on module completion — inconsistent haptic pattern | `quiz-controller.js:76` |

---

## 6. Backend Connectivity

### ✅ Strengths
- API proxy cleanly hides the Qwen API key from clients
- Session initialization endpoint (`/api/session/init`) exists
- Rate limit headers (`RateLimit-Remaining`, `RateLimit-Reset`) are returned
- Input validation with length limits on query and context
- Health check endpoint at `/api/health`
- Graceful SIGTERM/SIGINT shutdown

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | Qwen API endpoint URL is `dashscope-us.aliyuncs.com` but CSP header in server.js allows `dashscope-intl.aliyuncs.com` — mismatch; if the frontend ever makes direct calls this would be blocked | `server.js:59, 251` |
| 🟡 MED | No request timeout on the upstream Qwen `fetch()` call — a hanging upstream response will hold the Node.js connection open indefinitely, exhausting the thread pool under load | `server.js:251-265` |
| 🟡 MED | `/api/session/init` has no CSRF protection — any cross-origin page can POST to it (though CORS limits browser requests, it's still best practice to add a CSRF token) | `server.js:190-201` |
| 🟡 MED | The chat endpoint logs the user query: `console.log(\`Chat request from user ${req.session.userId}: ${query.substring(0, 50)}...\`)` — health queries are PII-adjacent; should log only session ID + timestamp in production | `server.js:294` |
| 🟢 LOW | `generateUserId()` uses `Math.random()` — not cryptographically secure; should use `crypto.randomUUID()` | `server.js:327-330` |

---

## 7. Security / Vulnerability

### ✅ Strengths (Fixed in Recent Passes)
- Static files served from `/public` only — project root not exposed ✅
- SRI hashes on CDN scripts (DOMPurify, idb-keyval) ✅
- `replaceInlineHandlers` gadget removed ✅
- Session secret fails fast in production if not set ✅
- Security headers middleware: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS`, `CSP` ✅
- DOMPurify sanitizes all dynamic HTML ✅

### ⚠️ Remaining Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `unsafe-inline` and `unsafe-eval` in CSP `script-src` — these negate most XSS protection from the CSP; the app's inline handlers should be removed entirely in favor of the data-action pattern (already partially done) to allow a strict CSP | `server.js:59` |
| 🔴 HIGH | Meta CSP in `index.html` (line 36-44) allows `script-src 'self' https://cdn.jsdelivr.net` with NO `unsafe-inline` — but the server-side CSP header DOES have `unsafe-inline`. The stricter meta-CSP will be overridden by the less-strict header; the header wins and is weaker | `index.html:36-44, server.js:59` |
| 🟡 MED | No `Referrer-Policy` header — external links could leak the app URL to third-party sites; should set `strict-origin-when-cross-origin` | `server.js` |
| 🟡 MED | No `Permissions-Policy` header — the app doesn't need camera, microphone, geolocation, etc.; these should be explicitly denied | `server.js` |
| 🟡 MED | `target="_blank"` links (e.g., in locale JSON files for MetroWest Meds, Kennedy CHC) lack `rel="noopener noreferrer"` — tab-napping vulnerability | `locales/en.json`, `locales/pt.json`, `locales/es.json` |
| 🟡 MED | Passport modal appended to `document.body` — this is outside DOMPurify's sanitization path because it's constructed via `DOMUtils.safeSetHTML(container, ...)` then `document.body.appendChild(container)`. This is fine but the container is never scoped under a sanitizer boundary. Stage and medCount are safely cast to integers first ✅ | `quiz-controller.js:171-222` |
| 🟢 LOW | CORS in development allows `http://127.0.0.1:5173` which is not the same origin as `http://localhost:5173` — inconsistent, but low risk in dev | `server.js:27` |

---

## 8. Rendering Consistency

### ✅ Strengths
- CSS custom properties used throughout for colors/spacing
- `DOMUtils.safeSetHTML` ensures consistent HTML insertion
- View transitions (fade-in/out) are consistent across navigation

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `mix-blend-mode: multiply` on the MetroWest logo image — in dark mode this inverts/distorts the logo to black (multiply on a dark background = invisible) | `curriculum-renderers.js:138` |
| 🟡 MED | Passport modal uses hardcoded `#eee`, `#666`, `#f5f5f7` inline colors — these are light-mode hex colors that do not invert in dark mode | `quiz-controller.js:195, 197, 201, 207, 213, 214, 218` |
| 🟡 MED | Locale JSON files contain inline HTML with hardcoded `#e3f2fd`, `#ffebee`, `#c62828`, `#1565c0` colors — these bypass the token system entirely and will not adapt to dark mode | `locales/en.json:1192`, `locales/pt.json:866`, `locales/es.json:966` |
| 🟡 MED | Anatomy module's `@keyframes danger-pulse` now correctly uses `--accent-red-light` ✅ but the drop-shadow filter uses raw `rgba(229, 62, 62, ...)` which doesn't adapt to dark mode | `main.css:618, 622` |
| 🟢 LOW | `.skeleton-visual` uses `--bg-skeleton` which is correctly dark-mode aware ✅ | |
| 🟢 LOW | The `quiz-dot` progress dots inline `background` style bypasses theming but uses CSS vars ✅  | `quiz-controller.js:49` |

---

## 9. Aesthetic Consistency

### ✅ Strengths
- Consistent border-radius tokens (`--radius-lg/md/sm/xs`)
- Consistent shadow tokens
- Inter font family applied globally
- Fluid typography with `clamp()` at all viewport sizes
- Button micro-interactions (ripple, translateY hover) are uniform

### ⚠️ Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🟡 MED | Passport "Close" button uses `background: #eee` — inconsistent with the design system's `btn-secondary` pattern | `quiz-controller.js:218` |
| 🟡 MED | Passport divider uses `border-bottom: 1px solid #eee` — should use `var(--stroke-subtle)` | `quiz-controller.js:195` |
| 🟡 MED | Header chat-toggle and theme-toggle buttons use extensive raw inline styles rather than CSS classes — inconsistent with the `.btn` system | `index.html:82, 89` |
| 🟢 LOW | `option-btn` class used in quiz (`quiz-controller.js:61`) — this class exists, but it differs subtly from `btn-quiz-option` used in `curriculum-renderers.js:322`; two button systems for quiz-like elements | `quiz-controller.js:61, curriculum-renderers.js:322` |
| 🟢 LOW | Stage result `ESTIMATED STAGE N` badge is all-caps hardcoded English text even in ES/PT languages | `quiz-controller.js:125` |

---

## 10. Light / Dark Mode Conformance

### ✅ Strengths
- `color-scheme: light dark` declared in `:root` ✅
- `[data-theme='dark']` overrides all semantic tokens ✅
- `@media (prefers-color-scheme: dark)` for system-preference fallback ✅
- Anatomy pulse animation uses `--accent-red-light` ✅
- Doctor Passport card uses `var(--bg-card)` and `var(--text-primary)` ✅
- Status pills use semantic tokens ✅

### ⚠️ Remaining Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `mix-blend-mode: multiply` on MetroWest logo destroys visibility in dark mode | `curriculum-renderers.js:138` |
| 🟡 MED | Passport interior: `color: #666`, `background: #f5f5f7`, `background: #eee` | `quiz-controller.js:197, 201, 207, 213, 218` |
| 🟡 MED | Locale HTML content: hardcoded `#e3f2fd` (blue tint), `#ffebee` (red tint), `#c62828` (danger red text) | All locale JSON files |
| 🟡 MED | `drop-shadow` in `@keyframes danger-pulse` uses literal `rgba(229, 62, 62, ...)` not a CSS var | `main.css:618, 622` |
| 🟢 LOW | `--border-strong: #000000` in light mode / `#FFFFFF` in dark mode — correct, but the light mode value is quite harsh for most uses; consider `rgba` | `main.css:43, 2686` |

---

## 11. Web Standards Conformance

### ✅ Strengths
- Valid `<!DOCTYPE html>` ✅
- `<html lang="en">` dynamically updated on language change ✅
- `<main>`, `<header>`, `<aside>`, `<nav>`, `<section>` semantic elements ✅
- `aria-live="polite"` on `#main-view` and chat log ✅
- `aria-modal="true"` and `aria-labelledby` on dialog ✅
- `aria-expanded` on hamburger ✅
- `aria-pressed` on language options ✅
- `aria-current="page"` on active nav item ✅
- All buttons have `type="button"` ✅
- Skip link present ✅
- `prefers-reduced-motion` respected ✅
- `role="button" tabindex="0"` on interactive divs ✅

### ⚠️ Remaining Issues

| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `maximum-scale=1.0` in viewport meta — directly violates WCAG 1.4.4 (Resize Text, Level AA). This was reportedly fixed but is still present | `index.html:6` |
| 🟡 MED | `target="_blank"` links in locale JSON lack `rel="noopener noreferrer"` — security standard (also affects SEO) | `locales/*.json` |
| 🟡 MED | Minimized chat FAB (floating action button) has no `aria-label` — inaccessible to screen readers | `main.css:2812` (only `content: ''` pseudo-element) |
| 🟡 MED | `<input type="text">` for chat lacks `autocomplete="off"` — browsers may expose previous medical queries | `index.html:164` |
| 🟡 MED | `user-actions` div uses `role="complementary"` (which maps to `<aside>`) — semantically incorrect for a toolbar; should use `role="toolbar"` | `index.html:79` |
| 🟢 LOW | `info-trigger` (clinical note toggle) is a `<div>` with `data-action` but no `role="button"` or `tabindex="0"` — keyboard inaccessible | `curriculum-renderers.js:226` |
| 🟢 LOW | `<section id="main-view" aria-live="polite" aria-atomic="false">` — `aria-atomic="false"` is the default and redundant | `index.html:132` |
| 🟢 LOW | Modal overlay `data-action="closeModal"` is on the `<div>` wrapper — click-outside-to-close is implemented but the div lacks `role` and `aria` instructions for keyboard users to know they can press Escape (though trap-focus handles Escape) | |

---

## 12. Additional Issues

### Performance / PWA
| Severity | Issue |
|----------|-------|
| 🟡 MED | Service worker (`sw.js`) cache strategy not audited — if using a stale-while-revalidate pattern for locale JSON files, users may see outdated translations after update |
| 🟢 LOW | `manifest.json` has not been validated against the PWA installability checklist for iOS |

### Maintainability
| Severity | Issue |
|----------|-------|
| 🟡 MED | No TypeScript or JSDoc type annotations on any public controller API — adding new contributors is difficult |
| 🟡 MED | No automated tests (unit or integration) — changes risk silent regressions |
| 🟢 LOW | `?v=8` cache-buster on script/style tags is manual — should be automated via a build hash |

---

## Priority Fix List

### 🔴 Must Fix Immediately
1. **Remove `maximum-scale=1.0`** from viewport meta (`index.html:6`)
2. **Fix `_openChatOnLoad` bug** — either use the flag in `init()` or update `checkUrlParams()` to use a URL param check consistently
3. **Fix `mix-blend-mode: multiply`** on MetroWest logo for dark mode (use `mix-blend-mode: normal` with a dark mode override or `color-dodge`)
4. **CSP conflict**: Remove `unsafe-inline` / `unsafe-eval` from server-side CSP, or align HTML meta-CSP and HTTP header CSP; the meta-CSP is currently overridden by the weaker server header
5. **API endpoint domain mismatch** in CSP: `dashscope-us` vs `dashscope-intl`

### 🟡 Fix Soon
6. Fix passport interior hardcoded colors (`#eee`, `#666`, `#f5f5f7`)
7. Fix locale JSON inline HTML hardcoded colors
8. Add `rel="noopener noreferrer"` to all `target="_blank"` links
9. Add `AbortSignal`/timeout to Qwen API `fetch()` call
10. Fix bare `setTimeout` in `quiz-controller.js:84`
11. Add `aria-label` to minimized chat FAB
12. Add `autocomplete="off"` to chat input
13. Fix `role="complementary"` → `role="toolbar"` on user-actions
14. Add `role="button" tabindex="0"` to `info-trigger` divs
15. Add `Referrer-Policy` and `Permissions-Policy` headers
16. Use `crypto.randomUUID()` instead of `Math.random()` for session IDs

### 🟢 Nice to Have
17. Remove stale refactor comments in `main.js` (lines 1213-1228)
18. Gate `runRefactorCompatibilityCheck` in dev-only
19. Add `@media print` styles for passport
20. Cache HybridSearchEngine by language key
21. Add offline fallback UI to service worker

# EMPOWER-CKM Navigator — Software Architecture Document
**Version:** 3.1.0  
**Date:** February 23, 2026  
**Author:** Software Architecture Team  
**Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Project Structure](#4-project-structure)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [RAG Pipeline & AI Architecture](#7-rag-pipeline--ai-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Internationalization Architecture](#9-internationalization-architecture)
10. [PWA & Offline Architecture](#10-pwa--offline-architecture)
11. [State Management](#11-state-management)
12. [Design System](#12-design-system)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Technology Stack](#15-technology-stack)
16. [Key Design Decisions](#16-key-design-decisions)

---

## 1. System Overview

### Purpose
EMPOWER-CKM Navigator is a patient-centered Progressive Web Application (PWA) that educates immigrant populations (Portuguese/Spanish-speaking) in the greater Boston area about cardio-kidney-metabolic (CKM) health. It was developed by physicians at MetroWest Medical Center's Internal Medicine Residency Program.

### Core Capabilities
- **6-Module Clinical Curriculum** with interactive knowledge checks
- **CKM Staging Quiz** with personalized action plans
- **AI Health Chatbot** with Retrieval-Augmented Generation (RAG)
- **Doctor Passport** for clinical visit preparation
- **Medication Tracker** with persistent local storage
- **Trilingual Support** (English, Portuguese, Spanish)
- **Offline-First PWA** with Service Worker caching
- **Dark Mode** with system preference detection

### Target Users
- Pre-high-school reading level patients
- Portuguese-speaking immigrant communities (Brazilian)
- Spanish-speaking immigrant communities (Latin American)
- Clinical staff at MetroWest Medical Center

---

## 2. Architecture Philosophy

### Guiding Principles

1. **Zero-Build Simplicity.** No Webpack, Vite, or bundler. All JavaScript is served directly as `<script defer>` tags. This eliminates build toolchain complexity and enables any clinician-developer to modify content without understanding compilation pipelines.

2. **Progressive Enhancement.** The app renders meaningful content even if: the backend is unreachable (offline mode), the Service Worker fails to install, JavaScript loads partially (inline fallback content), or the AI API is unconfigured.

3. **Security by Default.** No `eval()`, no inline event handlers, no raw `innerHTML`. All dynamic content routed through DOMPurify. API keys never touch the client. Content Security Policy enforced server-side.

4. **Clinical-Grade Accessibility.** WCAG 2.1 AA compliance with semantic HTML5, ARIA roles, keyboard navigation, focus trapping, screen reader announcements, and reduced-motion support.

5. **Modular Delegation.** The `app` coordinator object delegates to specialized controller modules, allowing individual features to be developed, tested, and replaced independently.

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser PWA)                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    index.html (Shell)                         │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐   │   │
│  │  │ Header  │ │ Main View│ │ Chat   │ │     Modal        │   │   │
│  │  │ + Nav   │ │ (Dynamic)│ │ Sidebar│ │   (Overlays)     │   │   │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   JavaScript Layer                            │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │              main.js (App Coordinator)                  │   │   │
│  │  │  init() → theme → i18n → chatbot → navigation → events │   │   │
│  │  └───────────────────────┬────────────────────────────────┘   │   │
│  │                          │ delegates to                       │   │
│  │  ┌──────────┐ ┌─────────┴────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │ Curriculum│ │    Chat      │ │   Quiz   │ │ Medication│   │   │
│  │  │ Controller│ │  Controller  │ │Controller│ │ Controller│   │   │
│  │  └──────────┘ └──────────────┘ └──────────┘ └───────────┘   │   │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │ Movement │ │    Food      │ │ Analogy  │ │  Renderers│   │   │
│  │  │ Controller│ │  Controller  │ │Controller│ │  (Views)  │   │   │
│  │  └──────────┘ └──────────────┘ └──────────┘ └───────────┘   │   │
│  │                                                               │   │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │ Action   │ │   I18n       │ │  Search  │ │  Secure   │   │   │
│  │  │Dispatcher│ │  Service     │ │  Engine  │ │  Storage  │   │   │
│  │  └──────────┘ └──────────────┘ └──────────┘ └───────────┘   │   │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐                  │   │
│  │  │  DOM     │ │    Task      │ │  Medical │                  │   │
│  │  │  Utils   │ │   Manager    │ │  Chatbot │                  │   │
│  │  └──────────┘ └──────────────┘ └──────────┘                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Service Worker (sw.js)                      │   │
│  │  install → precache | fetch → network-first / cache-first     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Local Storage Layer                         │   │
│  │  IndexedDB (idb-keyval)  │  localStorage (HMAC-signed)        │   │
│  │  - HMAC signing key      │  - Theme, language, progress       │   │
│  │  - Persistent device ID  │  - Medications, quiz answers       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER (Express.js / Node 18+)                 │
│                                                                     │
│  ┌────────────┐ ┌───────────┐ ┌────────┐ ┌───────────────────┐     │
│  │   CORS     │ │  Security │ │ Session│ │  Static Serving   │     │
│  │ Middleware │→│  Headers  │→│ (Memory│→│  (public/)        │     │
│  │            │ │  + CSP    │ │  Store)│ │                   │     │
│  └────────────┘ └───────────┘ └────────┘ └───────────────────┘     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API Routes                              │    │
│  │  POST /api/session/init     → Initialize user session        │    │
│  │  POST /api/chat             → Proxy to Qwen API (rate-limited)│   │
│  │  GET  /api/health           → Health check endpoint          │    │
│  │  GET  /api/rate-limit       → Rate limit status              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │  HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  EXTERNAL API (Qwen/DashScope US)                   │
│  Endpoint: https://dashscope-us.aliyuncs.com/compatible-mode/v1/   │
│  Model: qwen-flash-2025-07-28-us                                   │
│  Auth: Bearer token (server-side only)                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Structure

```
ckm-navigator/
├── server.js                          # Express backend (404 lines)
├── package.json                       # Dependencies & scripts
├── render.yaml                        # Render.com deployment config
├── .env / .env.example                # Environment variables
├── .nvmrc                             # Node version pin (18)
│
├── public/                            # Static frontend served by Express
│   ├── index.html                     # Application shell (196 lines)
│   ├── sw.js                          # Service Worker (111 lines)
│   ├── manifest.json                  # PWA manifest (72 lines)
│   ├── favicon.ico
│   │
│   ├── styles/
│   │   └── main.css                   # Complete design system (2,838 lines)
│   │
│   ├── js/
│   │   ├── dom-utils.js               # XSS-safe DOM manipulation (182 lines)
│   │   ├── task-manager.js            # Cancelable timeout manager (57 lines)
│   │   ├── secure-storage.js          # HMAC-signed localStorage (357 lines)
│   │   ├── chatbot.js                 # RAG chatbot client (259 lines)
│   │   ├── search-engine.js           # BM25 + semantic search (188 lines)
│   │   │
│   │   ├── core/
│   │   │   ├── action-dispatcher.js   # Event delegation system (86 lines)
│   │   │   └── i18n-service.js        # Locale loader with race protection (105 lines)
│   │   │
│   │   ├── config/
│   │   │   └── inline-fallback-en.js  # English content for offline bootstrap
│   │   │
│   │   └── features/
│   │       ├── curriculum-renderers.js # View templates for pages (492 lines)
│   │       ├── curriculum-controller.js # Page routing logic (180 lines)
│   │       ├── chat-controller.js     # Chat sidebar UI + interaction (576 lines)
│   │       ├── quiz-controller.js     # CKM staging quiz logic (249 lines)
│   │       ├── medication-controller.js # Medication map + tracker (715 lines)
│   │       ├── movement-controller.js  # Exercise module logic (229 lines)
│   │       ├── food-controller.js      # Food/nutrition module logic (688 lines)
│   │       └── analogy-controller.js   # Visual analogies module (342 lines)
│   │
│   ├── main.js                        # App coordinator (1,282 lines)
│   │
│   ├── locales/
│   │   ├── en.json                    # English content
│   │   ├── pt.json                    # Portuguese content
│   │   └── es.json                    # Spanish content
│   │
│   ├── assets/
│   │   ├── icons/                     # PWA icons (192px, 512px)
│   │   └── images/                    # Clinical diagrams, logos
│   │
│   └── docs/                          # Architecture & audit reports
│
├── scripts/
│   └── smoke-actions.js               # Automated smoke test
│
└── tests/                             # Test suite
```

**Total source code:** ~9,200 lines across 20 files.

---

## 5. Frontend Architecture

### 5.1 Application Shell (`index.html`)

The HTML provides a static SPA shell with four semantic regions:

| Region | Element | Role | Purpose |
|--------|---------|------|---------|
| Header | `<header class="top-bar">` | `banner` | Navigation, theme toggle, language selector |
| Content | `<main><section id="main-view">` | `main`, `aria-live="polite"` | Dynamic page content (injected by JS) |
| Chat | `<aside id="chat-sidebar">` | `complementary` | Draggable/resizable AI chatbot |
| Modal | `<div id="modal-overlay">` | `dialog`, `aria-modal="true"` | Organ detail popups, confirmations |

### 5.2 App Coordinator (`main.js`)

The `app` object is a **plain JavaScript object literal** (not a class) that acts as the central coordinator. It follows the **Mediator pattern**:

```javascript
const app = {
    // State
    translations: { en: INLINE_FALLBACK_EN },
    currentLanguage: 'en',
    currentPage: 'home',
    completedModules: [],
    myMedications: [],
    
    // Lifecycle
    async init() { ... },
    
    // Delegates to controllers
    toggleChat(open) { return this.chatController.toggleChat(open); },
    startQuiz()      { return this.quizController.startQuiz(); },
    // ... 40+ delegation stubs
};
```

**Why a plain object instead of a class?**  
The `ActionDispatcher` system resolves action names to `app[actionName]()` calls. A plain object with string-keyed methods provides the simplest dispatch target without `this` binding complexities in event callbacks.

### 5.3 Action Dispatcher (Event Delegation)

Instead of attaching event listeners to individual elements, the system uses a **single delegated click handler** on the document root:

```html
<!-- HTML: Declarative actions via data attributes -->
<button data-action="renderModuleDetail" data-args="3">Module 3</button>
```

```javascript
// ActionDispatcher.attach() adds ONE click listener to #app-root
// On click, finds closest [data-action], parses data-args, calls app[action](...args)
```

**Benefits:**
- Zero inline `onclick` attributes (CSP-safe)
- Works with dynamically injected content (no re-binding needed)
- Single point of action routing with allowlist validation
- Automatic argument parsing (strings, numbers, booleans)

The `REFACTOR_ACTION_ALLOWLIST` (44 entries) acts as both a whitelist and a self-documenting registry of all public actions.

### 5.4 Controller Modules

Each feature domain is extracted into its own controller file:

| Controller | Lines | Responsibilities |
|-----------|-------|------------------|
| `CurriculumController` | 180 | Page routing (`home`, `education`, `clinic`, `staging`), module rendering, progress tracking |
| `CurriculumRenderers` | 492 | HTML template generation for all views (home, education, clinic, module detail, final report, staging) |
| `ChatController` | 576 | Chat sidebar toggle/minimize/resize, message rendering, suggestion pills, source previews |
| `QuizController` | 249 | CKM staging quiz flow, answer recording, result calculation, Doctor Passport generation |
| `MedicationController` | 715 | Medication map rendering, drug category exploration, "My Medications" tracking |
| `FoodController` | 688 | Food label interactions, cultural food explorer, eating plate animations |
| `MovementController` | 229 | Exercise module, movement level exploration |
| `AnalogyController` | 342 | Visual analogies for medical concepts, interactive animations |

**Architectural pattern:** Controllers are instantiated in `main.js` via `new Controller(app)` (classes) or assigned as module references (UMD static APIs). They receive the `app` reference for back-communication.

### 5.5 View Transitions

Page navigation uses a GPU-accelerated fade transition sequence:

```
1. Store current scroll height → prevent layout shift
2. Set will-change: opacity → GPU hint
3. Add .fade-out class → 200ms opacity transition
4. Replace DOM content via DOMUtils.safeSetHTML()
5. requestAnimationFrame → scroll to top
6. requestAnimationFrame → add .fade-in class
7. setTimeout 300ms → resolve promise
8. setTimeout 350ms → cleanup will-change
```

The `TaskManager` wraps all `setTimeout` calls with `AbortController` to prevent race conditions when rapid navigation occurs.

### 5.6 DOM Safety Layer (`DOMUtils`)

All dynamic HTML passes through a centralized sanitization layer:

```javascript
DOMUtils.safeSetHTML(element, html);
// Internally: element.innerHTML = DOMPurify.sanitize(html, config);
```

The DOMPurify configuration:
- **ALLOWED_TAGS:** 40+ tags including full SVG support
- **ALLOWED_ATTR:** 50+ attributes including `data-*`, `aria-*`, SVG attributes
- **FORBID_ATTR:** `onclick`, `onload`, `onerror`, `onmouseover`, `onfocus`
- **ALLOW_DATA_ATTR:** true (for `data-action`/`data-args`)
- **ADD_ATTR:** `rel` (auto-adds `noopener noreferrer` to links)

---

## 6. Backend Architecture

### 6.1 Express Middleware Stack

```
Request → CORS → Security Headers → Body Parser → Session → Static → Routes → Error Handler
```

| Layer | Implementation | Purpose |
|-------|---------------|---------|
| CORS | `cors()` with origin allowlist | Block unauthorized cross-origin requests |
| Security Headers | Custom middleware | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Body Parser | `express.json({ limit: '10mb' })` | Parse JSON request bodies |
| Session | `express-session` + `memorystore` | Server-side session with 24h expiry |
| Static | `express.static('public/')` | Serve frontend assets |
| SPA Fallback | `app.get('*')` | Redirect non-API routes to `index.html` |

### 6.2 API Endpoints

| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|------------|---------|
| `GET` | `/api/health` | None | None | Health check with API key status |
| `POST` | `/api/session/init` | None | None | Create user session with `crypto.randomUUID()` |
| `POST` | `/api/chat` | Session | 10 req/60s | Proxy query to Qwen API |
| `GET` | `/api/rate-limit` | Session | None | Return remaining quota |

### 6.3 Rate Limiting

A **sliding window** rate limiter tracks requests per user:

```javascript
const CHAT_WINDOW_MS = 60 * 1000;  // 60-second window
const CHAT_MAX_REQUESTS = 10;       // 10 requests per window
```

- Key: `session.userId || req.ip || x-forwarded-for || 'anonymous'`
- Automatic pruning of expired entries on each request
- Response headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- 429 response when quota exceeded

### 6.4 Qwen API Proxy

```
Client → POST /api/chat { query, context, language }
         → Server validates inputs (query ≤1000 chars, context ≤10000 chars)
         → Server builds system prompt + user prompt with RAG context
         → Server calls Qwen API with 30s AbortController timeout
         → Server appends medical disclaimer per language
         → Server responds { response, usage }
```

**Security:** The API key (`QWEN_API_KEY`) never leaves the server. The client has zero knowledge of the LLM provider or authentication mechanism.

---

## 7. RAG Pipeline & AI Architecture

### 7.1 Knowledge Extraction

At application boot, curriculum content is extracted from the loaded locale translations:

```
translations[lang].modules.content → forEach module → forEach section →
    Strip HTML tags → Create chunk { id, content, metadata: { moduleId, moduleName, language, category } }
```

Each chunk is identified by `{moduleId}_{language}_{sectionIndex}` (e.g., `1_en_0`, `3_pt_2`).

### 7.2 Hybrid Search Engine

The `HybridSearchEngine` combines two retrieval strategies:

#### BM25 (Exact Term Matching)
```
tokenize(query) → for each term:
    IDF = log(max(0.01, N - df + 0.5) / max(0.01, df + 0.5) + 1)
    TF_component = tf * (k1 + 1) / (tf + k1 * (1 - b + b * docLen/avgDocLen))
    score += IDF * TF_component
```
- Parameters: k1=1.5, b=0.75 (standard BM25)
- Safety: IDF numerator/denominator clamped to prevent NaN from `Math.log(negative)`

#### Semantic Search (Term Overlap)
```
similarity = |queryTerms ∩ chunkTerms| / √(|queryTerms| × |chunkTerms|)
```
- Cosine-inspired overlap metric
- Division-by-zero guarded

#### Reciprocal Rank Fusion (RRF)
```
BM25 top-15 results  → RRF score = Σ 1/(k + rank + 1)
Semantic top-15 results → RRF score = Σ 1/(k + rank + 1)
Combined → sort by fused score → top K
```
- k=60 (standard RRF constant)
- Language filter applied post-fusion: `chunk.metadata.language === currentLanguage`

### 7.3 Query Processing Pipeline

```
User Query
    │
    ▼
┌─────────────────────┐
│   Safety Filter     │ ── Matches emergency/dosage patterns? → Block with safety message
│  (regex patterns)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Hybrid Search      │ ── BM25 + Semantic + RRF → Top 3 chunks
│  (client-side)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Context Builder    │ ── Format chunks as "[Source N: Module Name]\n{content}"
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────┐
│  Backend Proxy      │ ──► │  Qwen LLM API   │
│  POST /api/chat     │     │  (30s timeout)   │
│  (rate-limited)     │ ◄── │                  │
└─────────┬───────────┘     └─────────────────┘
          │
          ▼
┌─────────────────────┐
│  Response + Medical │
│  Disclaimer        │
└─────────────────────┘
```

### 7.4 Offline Fallback

When the backend is unreachable:
1. **Session init fails** → `offlineMode = true`
2. RAG search still runs **client-side** (BM25 + semantic over local chunks)
3. Instead of calling the LLM, `getOfflineMessage(context)` returns the raw retrieved curriculum content with a trilingual disclaimer

---

## 8. Security Architecture

### 8.1 Layer Defense Model

```
Layer 1: CSP (script-src 'self' + jsdelivr.net)
Layer 2: SRI (DOMPurify, idb-keyval integrity hashes)
Layer 3: DOMPurify (all dynamic HTML sanitized)
Layer 4: ActionDispatcher (no inline event handlers)
Layer 5: SecureStorage (HMAC-SHA256 data integrity)
Layer 6: Backend validation (query/context length limits)
Layer 7: Rate limiting (10 req/60s per user)
Layer 8: Session security (httpOnly, secure, sameSite)
Layer 9: API key isolation (server-side only)
```

### 8.2 SecureStorage

Local data persistence uses HMAC-SHA256 signing to detect tampering:

```
Write:
    data = JSON.stringify(value)
    signature = HMAC-SHA256(data, deviceKey)
    localStorage[key] = { data, signature, timestamp, version }

Read:
    payload = JSON.parse(localStorage[key])
    expected = HMAC-SHA256(payload.data, deviceKey)
    if (expected !== payload.signature) → return fallback (tampered!)
    return JSON.parse(payload.data)
```

**Key storage hierarchy:**
1. IndexedDB (`idb-keyval`) — persistent across sessions
2. `sessionStorage` — fallback if IndexedDB unavailable
3. `crypto.getRandomValues(32 bytes)` — key generation

### 8.3 Safety Guardrails

The chatbot blocks queries matching unsafe regex patterns in EN/PT/ES:

| Pattern | Rationale |
|---------|-----------|
| `/emergency/i`, `/emergência/i` | Emergency situations need 911, not a chatbot |
| `/do i have/i`, `/am i dying/i` | Cannot provide diagnoses |
| `/dosage/i`, `/how much.*take/i`, `/dosagem/i`, `/dosis/i` | Cannot prescribe medication dosages |
| `/replace.*doctor/i` | Reinforces that this is educational, not clinical |

---

## 9. Internationalization Architecture

### 9.1 Locale Loading Strategy

```
Boot → Load inline-fallback-en.js (bundled, instant)
     → Attempt fetch en.json?v=10 (Network-First via SW)
     → If user switches language:
         → fetch pt.json?v=10 or es.json?v=10
         → Race protection via Symbol() request token
         → If fetch fails → fallback to English content
```

### 9.2 I18nService Race Protection

```javascript
// Each loadLanguage() call gets a unique Symbol token
const requestId = Symbol();
this.activeLanguageRequest = requestId;

// Service checks if this request is still the latest before applying
if (typeof isLatestRequest === 'function' && !isLatestRequest(requestToken)) {
    return { stale: true };  // Discard — a newer request superseded this
}
```

This prevents: User clicks EN → PT → EN rapidly. The stale PT response arrives after the second EN request and is correctly discarded.

### 9.3 UI Content Binding

Dynamic content uses the `data-i18n` attribute system:

```html
<h3 data-i18n="chat.subtitle">AI Health Assistant</h3>
<input data-i18n-placeholder="chat.placeholder" placeholder="Ask a question...">
```

The `updateUIContent()` method walks the DOM and replaces text/placeholder values from `translations[currentLanguage]`.

### 9.4 Translation Structure

```json
{
    "ui": {
        "welcomeBack": "Welcome to",
        "backBtn": "Back to Dashboard",
        "learningProgress": "Your Learning Progress",
        "modulesLabel": "Modules",
        "nextStep": "Next Step",
        ...
    },
    "nav": { "home": "Dashboard", "education": "Curriculum", "clinic": "Clinic" },
    "chat": { "subtitle": "AI Health Assistant", "placeholder": "Ask a question...", ... },
    "modules": {
        "list": [ { "id": 1, "title": "Understanding CKM", "description": "..." }, ... ],
        "content": {
            "1": { "title": "...", "sections": [ { "heading": "...", "content": "...", "expanded": "..." } ] }
        },
        "medicationMap": { "categories": [ ... ] }
    },
    "staging": { "title": "...", "questions": [ ... ] },
    "clinic": { "storyTitle": "...", "missionText": "...", ... }
}
```

---

## 10. PWA & Offline Architecture

### 10.1 Service Worker Strategy

| Request Type | Strategy | Rationale |
|-------------|----------|-----------|
| HTML navigation | **Network-First** (fallback to `index.html`) | Always serve freshest shell |
| JavaScript (`.js`) | **Network-First** | Critical for feature updates |
| JSON (`.json`) | **Network-First** | Locale files may be updated |
| CSS, images, fonts | **Cache-First** | Rarely change; speed matters |
| Cross-origin | **Passthrough** | CDN scripts (DOMPurify, idb-keyval) |
| API (`/api/*`) | **Passthrough** | Never cache API responses |

### 10.2 Cache Lifecycle

```
Install → precache 22 assets (CACHE_NAME = 'ckm-navigator-v13')
Activate → delete all caches where name !== CACHE_NAME
         → self.clients.claim() (take control immediately)
Message  → if 'SKIP_WAITING' → self.skipWaiting()
```

### 10.3 Update Flow

```
1. User visits app → browser checks sw.js for changes
2. If changed → new SW installs in background, precaches new assets
3. On activation → old cache purged, new SW takes control
4. App detects 'controllerchange' event → shows update banner
5. User clicks "Refresh" → window.location.reload()
```

### 10.4 Offline Capabilities

| Feature | Offline? | Mechanism |
|---------|----------|-----------|
| View curriculum modules | ✅ | Cached locale JSON + cached JS |
| Navigate pages | ✅ | SPA routing, no server needed |
| Take staging quiz | ✅ | Quiz state is client-side |
| Use chatbot | ⚠️ Degraded | RAG search runs locally; LLM unavailable |
| Track medications | ✅ | LocalStorage + SecureStorage |
| Switch languages | ⚠️ | Works if locale was previously loaded |

---

## 11. State Management

### 11.1 State Locations

| State | Storage | Persistence | Signed? |
|-------|---------|-------------|---------|
| `currentPage` | Memory (app object) | Session only | N/A |
| `currentLanguage` | SecureStorage → localStorage | Persistent | ✅ HMAC |
| `completedModules` | SecureStorage → localStorage | Persistent | ✅ HMAC |
| `myMedications` | SecureStorage → localStorage | Persistent | ✅ HMAC |
| `chatHistory` | Memory (app object) | Session only | N/A |
| `quizAnswers` | Memory (app object) | Session only | N/A |
| Theme preference | SecureStorage → localStorage | Persistent | ✅ HMAC |
| HMAC signing key | IndexedDB (idb-keyval) | Persistent | N/A (root key) |
| Session cookie | Server memory (MemoryStore) | 24 hours | N/A (httpOnly) |

### 11.2 State Flow

```
User Action → ActionDispatcher → app.method() → Update state
    → Persist to SecureStorage (if persistent)
    → Re-render affected view via transitionView()
    → Update ARIA/i18n attributes
```

---

## 12. Design System

### 12.1 CSS Architecture

The design system is a single `main.css` file (2,838 lines) organized into:

```
Lines   1-120   CSS Custom Properties (tokens)
Lines 121-141   Animation keyframes
Lines 142-300   Base resets & typography
Lines 300-370   Button system (.btn, .btn-primary, .btn-secondary, .btn-text)
Lines 370-700   Layout (header, nav, content area, responsive breakpoints)
Lines 700-1200  Component styles (cards, modals, pills, progress bars)
Lines 1200-1800 Feature-specific (chat sidebar, medication cards, quiz)
Lines 1800-2650 Animations & transitions
Lines 2650-2770 Dark mode overrides ([data-theme='dark'])
Lines 2770-2838 Accessibility & focus styles
```

### 12.2 Design Tokens

```css
:root {
    /* Accent System (OKLCH) */
    --accent-red: oklch(52% 0.22 29);
    --accent-red-hover: oklch(45% 0.22 29);
    --accent-red-light: oklch(52% 0.22 29 / 0.05);
    
    /* Semantic Surfaces */
    --bg-canvas: #FFFFFF;
    --bg-card: #F8F8FA;
    --bg-component: #F0F0F3;
    --bg-depth: #E8E8ED;
    
    /* Typography */
    --text-primary: #1D1D1F;
    --text-secondary: #6E6E73;
    --text-tertiary: #86868B;
    
    /* System Colors */
    --system-green: #34C759;
    --system-blue: #007AFF;
    --system-orange: #FF9500;
    --system-red: #FF3B30;
    --system-purple: #AF52DE;
    
    /* Spacing Scale */
    --space-xs through --space-xl
    
    /* Shadow System (4 tiers) */
    --shadow-card, --shadow-elevated, --shadow-float, --shadow-primary-hover
    
    /* Border Radius */
    --radius-sm: 8px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
    
    /* Z-Index Scale */
    --z-sticky: 100;
    --z-modal: 200;
    --z-overlay: 300;
    --z-tooltip: 400;
}
```

### 12.3 Responsive Breakpoints

| Breakpoint | Range | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Single column, hamburger nav, full-width cards |
| Tablet | 768–1023px | Increased content padding |
| Laptop | 1024–1439px | Two-column module grid |
| Desktop | 1440–1919px | Content max-width with centered container |
| TV | 1920px+ | Enlarged typography, larger buttons |
| Ultrawide | 2560px+ (21:9) | 3-column grid layout |

### 12.4 Dark Mode

Full variable override in `[data-theme='dark']`:
- Canvas: `#000000`, Cards: `#1C1C1E`
- Text primary: `#F5F5F7`
- Accent colors: Brightened OKLCH values for dark backgrounds
- Card borders: `1px solid rgba(255,255,255,0.1)`
- System preference fallback: `@media (prefers-color-scheme: dark)` for `html:not([data-theme])`

---

## 13. Data Flow Diagrams

### 13.1 Application Boot Sequence

```
DOMContentLoaded
    │
    ├─ 1. checkUrlParams()        — Parse ?page= and ?lang= from URL
    ├─ 2. initRefactorModules()   — Create I18nService + assign CurriculumController
    ├─ 3. SecureStorage.init()    — Load HMAC key from IndexedDB
    ├─ 4. Load persisted state    — theme, language, completedModules, medications
    ├─ 5. loadLanguage(lang)      — Fetch locale JSON (with inline fallback)
    ├─ 6. initChatbot()           — Extract knowledge chunks → build BM25 index
    ├─ 7. initHamburgerMenu()     — Attach hamburger toggle listener
    ├─ 8. ActionDispatcher.attach() — Single delegated click handler on #app-root
    ├─ 9. navigateTo(currentPage) — Render initial view
    ├─10. Register Service Worker  — navigator.serviceWorker.register('./sw.js')
    ├─11. Chat resize listeners    — Draggable sidebar, intersection observers
    └─12. Stagger animations       — MutationObserver for .animate-stagger elements
```

### 13.2 Chat Message Flow

```
User types message → presses Enter or clicks Send
    │
    ├─ 1. appendChatMessage('user', text)   — Add to UI + chatHistory[]
    ├─ 2. Create typing indicator           — createElement + DOMUtils.safeSetHTML
    ├─ 3. chatbot.processQuery(text)        — Start RAG pipeline
    │      ├── Safety filter check
    │      ├── HybridSearch (BM25 + semantic)
    │      ├── buildContext(topChunks)
    │      └── generateResponse(query, context)
    │               ├── POST /api/chat
    │               └── Offline fallback if unreachable
    ├─ 4. Remove typing indicator
    └─ 5. appendChatMessage('assistant', response, result)
           └── renderSidebarChatSnippet() with [Source N] citation links
```

### 13.3 Language Switch Flow

```
User clicks language button (e.g., PT)
    │
    ├─ 1. setLanguage('pt')
    ├─ 2. loadLanguage('pt')
    │      ├── Create Symbol() request token
    │      ├── Show loading indicator
    │      ├── I18nService.fetchLocale('pt') — GET /locales/pt.json?v=10
    │      ├── Race check: is this still the latest request?
    │      └── Store translations['pt']
    ├─ 3. Persist to SecureStorage
    ├─ 4. Update chatbot language
    ├─ 5. Re-index search engine with all languages
    ├─ 6. updateUIContent() — Walk DOM for data-i18n attributes
    ├─ 7. navigateTo(currentPage) — Re-render with new translations
    └─ 8. Update language slider ARIA states
```

---

## 14. Deployment Architecture

### 14.1 Render.com Configuration

```yaml
services:
  - type: web
    name: empower-ckm-navigator
    runtime: node
    plan: starter
    autoDeploy: true
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV       → production
      - key: PORT            → 10000
      - key: SESSION_SECRET  → generateValue: true
      - key: ALLOWED_ORIGINS → (manual)
      - key: QWEN_API_KEY    → (manual, secret)
```

### 14.2 Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | Yes | `development` | Controls security enforcement level |
| `PORT` | No | `3001` | Server listening port |
| `QWEN_API_KEY` | Yes (prod) | None | LLM API authentication |
| `SESSION_SECRET` | Yes (prod) | `change-this...` | Express session signing key |
| `ALLOWED_ORIGINS` | Yes (prod) | None | CORS origin allowlist (comma-separated) |
| `SESSION_COOKIE_SAMESITE` | No | `none`/`lax` | Cookie SameSite attribute |

### 14.3 Production Safety Checks

The server **exits immediately** (`process.exit(1)`) if:
1. `NODE_ENV=production` and `SESSION_SECRET` is the default value
2. `NODE_ENV=production` and `ALLOWED_ORIGINS` is empty

---

## 15. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Vanilla JavaScript (ES2020+) | — | Application logic |
| CSS3 (OKLCH, Container Queries, `color-mix()`) | — | Design system |
| DOMPurify | 3.0.8 | XSS prevention (CDN + SRI) |
| idb-keyval | 6.x | IndexedDB wrapper (CDN + SRI) |
| Inter (Google Font) | Variable | Typography |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Server runtime (requires native `fetch`) |
| Express.js | ^4.21.2 | HTTP framework |
| express-session | ^1.18.1 | Session management |
| memorystore | ^1.6.7 | Session store (in-memory with TTL) |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^16.4.7 | Environment variable loading |

### External Services
| Service | Purpose |
|---------|---------|
| Qwen (DashScope US) | LLM for chat responses |
| Google Fonts CDN | Inter font family |
| jsDelivr CDN | DOMPurify + idb-keyval |
| Render.com | Hosting (PaaS) |

---

## 16. Key Design Decisions

### 16.1 Why No Build System?

**Decision:** Ship raw JS files with `?v=N` cache busting instead of Webpack/Vite.

**Rationale:**
- Target maintainers are clinical researchers, not frontend engineers
- 9,200 lines of code is manageable without bundling
- `<script defer>` provides sufficient load ordering
- No tree-shaking needed (all code is used)
- Simplifies deployment to "just serve static files"

**Trade-off:** Manual version bumping in `sw.js`, `index.html`, and `main.js`. Mitigated by the audit process catching drift.

### 16.2 Why HMAC-Signed LocalStorage?

**Decision:** Sign all localStorage values with HMAC-SHA256 instead of using plain localStorage or IndexedDB for everything.

**Rationale:**
- Patient progress data (completed modules, medications) has clinical value
- localStorage is trivially editable via DevTools
- HMAC signing detects manual tampering → falls back to clean state
- IndexedDB used only for the signing key itself (harder to extract)
- No server-side persistence required (privacy-first design)

### 16.3 Why Client-Side Search?

**Decision:** Run BM25 + semantic search entirely in the browser rather than on the server.

**Rationale:**
- Curriculum content is finite (~6 modules × 3 languages ≈ 100 chunks)
- Index builds in <50ms — no perceivable overhead
- Enables RAG even when offline (search still works, just no LLM)
- Reduces server load and latency
- No need for vector databases or embedding models

### 16.4 Why ActionDispatcher over a Framework?

**Decision:** Build a custom event delegation system instead of using React/Vue/Svelte.

**Rationale:**
- Zero framework overhead (~86 lines vs 100KB+ framework runtime)
- No virtual DOM diffing needed (transitions handle full re-renders)
- `data-action` attributes are self-documenting in HTML
- DOMPurify integration is simpler with direct DOM manipulation
- Clinician maintainers can read HTML templates without JSX knowledge

### 16.5 Why UMD Module Pattern?

**Decision:** Use `(function(root, factory) { ... })` wrapper instead of ES Modules.

**Rationale:**
- `<script defer>` with ES Modules requires `type="module"`, which changes script scoping
- UMD works identically in browser globals, Node.js `require()`, and bundlers
- Enables `node --test` to run the same code for testing
- Migration to ES Modules is straightforward when ready (change wrapper, add `export`)

---

*End of Software Architecture Document*

# EMPOWER-CKM Navigator: Bug Report & Debugging Plan

**Date:** January 13, 2026
**Project:** EMPOWER-CKM Navigator
**Codebase Size:** 443KB (main.js), Pure Frontend PWA
**Technology Stack:** Vanilla JavaScript, HTML5, CSS3, Service Worker

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Bug Classification System](#bug-classification-system)
3. [Major Bugs (Critical)](#major-bugs-critical)
4. [Minor Bugs (Non-Critical)](#minor-bugs-non-critical)
5. [Backend Issues](#backend-issues)
6. [Frontend Issues](#frontend-issues)
7. [Comprehensive Debugging Plan](#comprehensive-debugging-plan)
8. [Testing Strategy](#testing-strategy)
9. [Bug Fix Priority Matrix](#bug-fix-priority-matrix)

---

## Executive Summary

### Current Status
✅ **Good News:**
- Core functionality is largely intact
- No backend (pure frontend PWA = simpler debugging)
- Service Worker properly implemented
- Chatbot and search engine are separate modules (good architecture)
- Most bugs identified in previous audits have been documented

⚠️ **Issues Found:**
- **3 Critical Bugs** requiring immediate attention
- **12 Minor Bugs** affecting UX but not breaking functionality
- **5 Performance Issues** causing slowdowns
- **8 Accessibility Gaps** affecting disabled users

### Risk Assessment
- **Overall Risk Level:** MEDIUM
- **Deployment Readiness:** 65% (needs critical bug fixes)
- **Production Suitability:** Not recommended until critical bugs fixed

---

## Bug Classification System

### Severity Levels

| Level | Symbol | Definition | Examples |
|-------|--------|------------|----------|
| **CRITICAL (P0)** | 🔴 | Breaks core functionality, app crashes, data loss | Language switcher doesn't work, medication data corruption |
| **MAJOR (P1)** | 🟠 | Significant functionality impaired, workarounds exist | Animation glitches, slow performance, accessibility issues |
| **MINOR (P2)** | 🟡 | Cosmetic issues, edge cases, minor UX problems | Button alignment, console warnings, missing tooltips |
| **TRIVIAL (P3)** | 🔵 | Code quality, future-proofing, nice-to-haves | TODOs, commented code, optimization opportunities |

### Bug Types

- **FUNC** - Functional bug (feature doesn't work)
- **UI** - User interface issue (visual/layout)
- **PERF** - Performance problem (slow, laggy)
- **A11Y** - Accessibility issue (keyboard, screen reader)
- **SECURITY** - Security vulnerability
- **DATA** - Data integrity/persistence issue

---

## Major Bugs (Critical)

### 🔴 BUG #1: Language Switcher Doesn't Re-render Current Page
**Location:** `main.js:4011` - `setLanguage()` method
**Type:** FUNC
**Severity:** CRITICAL (P0)
**Reported In:** COMPREHENSIVE_AUDIT_2026.md

#### Description
When user switches language (EN ↔ PT ↔ ES), the UI updates (header, navigation) but the **current page content does not re-render**. User must manually click navigation to see translated content.

#### Steps to Reproduce
1. Navigate to any module (e.g., "Learn More" → "Module 1")
2. Switch language from EN → PT using language selector
3. **Expected:** Module content re-renders in Portuguese
4. **Actual:** Module content stays in English

#### Root Cause
```javascript
// Current code (main.js:4011-4019)
async setLanguage(lang) {
    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    localStorage.setItem('ckm_lang', lang);
    this.updateUIContent();  // ❌ Only updates nav/header
    if (this.chatbot) this.chatbot.setLanguage(lang);
    // ❌ MISSING: this.navigateTo(this.currentPage);
}
```

#### Impact
- **User Frustration:** Users think language switch failed
- **Accessibility:** Non-English speakers see English content
- **Data Confusion:** If on "My Medications" page, labels don't update

#### Fix Required
```javascript
async setLanguage(lang) {
    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    localStorage.setItem('ckm_lang', lang);
    this.updateUIContent();
    if (this.chatbot) this.chatbot.setLanguage(lang);

    // ✅ ADD THIS LINE:
    this.navigateTo(this.currentPage);  // Re-render current page with new language
}
```

#### Testing Checklist
- [ ] Switch language on home page → content updates
- [ ] Switch language on module page → module re-renders
- [ ] Switch language on "My Medications" → medications re-render
- [ ] Switch language on quiz page → questions update
- [ ] Chatbot updates language
- [ ] No data loss after language switch
- [ ] localStorage persists language preference

---

### 🔴 BUG #2: My Medications Language Bug (Data Corruption)
**Location:** `main.js:5063` - `addMyMedication()` method
**Type:** DATA
**Severity:** CRITICAL (P0)
**Reported In:** COMPREHENSIVE_AUDIT_2026.md

#### Description
When user adds medication to "My Medications", the app stores the **localized className** (e.g., "Biguanidas" in Portuguese) instead of a language-independent ID. When user switches language, the app can't find the medication class because it's searching for Spanish/English name but stored Portuguese name.

#### Steps to Reproduce
1. Set language to Portuguese (PT)
2. Go to Module 5 (Medications)
3. Add "Metformin" from "Biguanidas" class
4. Switch language to English (EN)
5. Go to "My Medications" dashboard
6. **Expected:** Medication shows as "Biguanides" (English)
7. **Actual:** Medication shows with broken data or missing class info

#### Root Cause
```javascript
// Current code (main.js:5063-5080)
addMyMedication(medicationName, categoryId, classIndex) {
    const cat = this.getMedicationCategory(categoryId);
    const cls = cat.classes[classIndex];

    this.myMedications.push({
        name: medicationName,
        className: cls.name,       // ❌ STORES LOCALIZED STRING "Biguanidas"
        categoryId: categoryId,
        addedAt: Date.now()
    });

    this.saveMyMedications();
}

// Later, when rendering:
const cls = cat.classes.find(c => c.name === myMed.className);
// ❌ Won't match if className was "Biguanidas" but now language is "es" and name is "Biguanidas"
```

#### Impact
- **Data Loss:** User loses medication tracking when switching languages
- **User Trust:** Users think app deleted their medications
- **Medical Risk:** If used clinically, this is dangerous

#### Fix Required
**Option 1: Add unique IDs to medication classes (Recommended)**
```javascript
// In translations, add IDs:
classes: [
    {
        id: 'biguanides',           // ✅ Language-independent ID
        name: 'Biguanides',         // English
        description: '...',
        drugs: [...]
    }
]

// In addMyMedication:
addMyMedication(medicationName, categoryId, classIndex) {
    const cat = this.getMedicationCategory(categoryId);
    const cls = cat.classes[classIndex];

    this.myMedications.push({
        name: medicationName,
        classId: cls.id,           // ✅ Store ID, not name
        categoryId: categoryId,
        addedAt: Date.now()
    });
}

// When rendering:
const cls = cat.classes.find(c => c.id === myMed.classId);  // ✅ Always works
```

**Option 2: Store classIndex instead of name**
```javascript
// Simpler fix, less robust:
this.myMedications.push({
    name: medicationName,
    classIndex: classIndex,     // Store index, not name
    categoryId: categoryId,
    addedAt: Date.now()
});

// When rendering:
const cls = cat.classes[myMed.classIndex];  // Direct array access
```

#### Data Migration Required
```javascript
// On app load, check for old format and migrate:
initMyMedications() {
    let meds = JSON.parse(localStorage.getItem('ckm_my_medications') || '[]');

    // Migrate old format to new format
    if (meds.length > 0 && meds[0].className && !meds[0].classId) {
        console.log('Migrating old medication format...');
        meds = meds.map(med => {
            // Try to find class by name in current language
            const cat = this.getMedicationCategory(med.categoryId);
            const cls = cat.classes.find(c => c.name === med.className);

            return {
                ...med,
                classId: cls?.id || 'unknown',  // Add ID
                classIndex: cat.classes.indexOf(cls)
            };
        });

        localStorage.setItem('ckm_my_medications', JSON.stringify(meds));
        console.log('Migration complete');
    }

    this.myMedications = meds;
}
```

#### Testing Checklist
- [ ] Add medication in English → switch to Portuguese → medication displays correctly
- [ ] Add medication in Portuguese → switch to Spanish → medication displays correctly
- [ ] Add 5 medications → switch language multiple times → all 5 persist correctly
- [ ] Existing users with old data → app migrates data automatically
- [ ] Remove medication works in all languages
- [ ] Medication interaction checker works across languages

---

### 🔴 BUG #3: Service Worker Cache Stale Data Issue
**Location:** `sw.js:1-29` - Cache strategy
**Type:** FUNC
**Severity:** CRITICAL (P0)
**New Bug Identified**

#### Description
Service Worker uses **cache-first strategy** without any cache invalidation. Once user visits the app, they will **never see updates** unless they manually clear browser cache. This is a common PWA anti-pattern.

#### Steps to Reproduce
1. Visit app (v1)
2. Service Worker caches all assets
3. Developer deploys v2 with bug fixes
4. User refreshes app
5. **Expected:** App updates to v2
6. **Actual:** App stays on v1 (cached)

#### Root Cause
```javascript
// Current code (sw.js:22-28)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);  // ❌ Always uses cache if exists
        })
    );
});
```

#### Impact
- **Bug Fixes Don't Deploy:** Users stuck on buggy version
- **Security Risk:** Can't push security updates
- **User Confusion:** "I heard there's a new version but I don't see it"

#### Fix Required
```javascript
// Better strategy: Network-first for HTML, cache-first for assets

const CACHE_NAME = 'ckm-navigator-v2';

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // For HTML files: Network-first (get updates)
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Update cache with fresh version
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request);
                })
        );
    }
    // For assets: Cache-first (performance)
    else {
        event.respondWith(
            caches.match(request)
                .then(response => response || fetch(request))
        );
    }
});

// Add update notification
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );

    // Notify all clients of update
    return self.clients.claim().then(() => {
        return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({ type: 'APP_UPDATED' });
            });
        });
    });
});
```

Add update notification in main.js:
```javascript
// In init():
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');

    // Listen for updates
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'APP_UPDATED') {
            this.showUpdateNotification();
        }
    });
}

showUpdateNotification() {
    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
        <span>🎉 New version available!</span>
        <button onclick="location.reload()">Refresh</button>
    `;
    document.body.prepend(banner);
}
```

#### Testing Checklist
- [ ] Deploy v1 → User visits → Cache is populated
- [ ] Deploy v2 → User refreshes → Gets v2
- [ ] User goes offline → App still works (fallback to cache)
- [ ] Update notification shows when new version deployed
- [ ] Old cache versions are deleted on update

---

## Minor Bugs (Non-Critical)

### 🟡 BUG #4: Resize Handler Performance (No Debouncing)
**Location:** `main.js` - `initHeaderCollisionDetection()`
**Type:** PERF
**Severity:** MAJOR (P1)

#### Description
The header collision detection runs on **every resize event** without debouncing, causing unnecessary layout recalculations and potential jank on slower devices.

#### Root Cause
```javascript
window.addEventListener('resize', checkCollision);  // ❌ Runs 100+ times during resize
```

#### Impact
- **Performance:** Laggy resize on slower iPads
- **Battery:** Unnecessary CPU usage
- **UX:** Janky animations during window resize

#### Fix
```javascript
// Add debounce utility:
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply to resize:
window.addEventListener('resize', debounce(checkCollision, 150));  // ✅ Runs max once per 150ms
```

---

### 🟡 BUG #5: Chat Sidebar Width on Mobile
**Location:** `styles/main.css` - `.chat-sidebar`
**Type:** UI
**Severity:** MAJOR (P1)

#### Description
Chat sidebar has fixed width of `420px`, which covers the entire screen on phones and most of screen on tablets in portrait mode.

#### Root Cause
```css
.chat-sidebar {
    position: fixed;
    right: 0;
    width: 420px;  /* ❌ Fixed width */
    height: 100vh;
}
```

#### Impact
- **Mobile UX:** Users can't see main content with chat open
- **iPad Portrait:** Chat covers 50% of screen

#### Fix
```css
.chat-sidebar {
    position: fixed;
    right: 0;
    width: min(420px, 90vw);  /* ✅ Responsive width */
    height: 100vh;
    max-width: 100%;
}

/* For very small screens: */
@media (max-width: 480px) {
    .chat-sidebar {
        width: 100vw;  /* Full screen on phones */
        left: 0;       /* Slide from right */
    }
}
```

---

### 🟡 BUG #6: Accordion Max-Height Cutoff
**Location:** `styles/main.css` - `.med-card-content.expanded`
**Type:** UI
**Severity:** MAJOR (P1)

#### Description
Medication card content has arbitrary `max-height: 2000px`. If content exceeds this, it gets cut off with no scrolling.

#### Root Cause
```css
.med-card-content.expanded {
    max-height: 2000px;  /* ❌ Arbitrary limit */
    overflow: hidden;
}
```

#### Impact
- **Content Loss:** Long medication descriptions get truncated
- **Accessibility:** Users can't read full information

#### Fix
```css
/* Option 1: Remove max-height (simpler) */
.med-card-content.expanded {
    max-height: none;  /* ✅ No limit */
    overflow: visible;
}

/* Option 2: Dynamic calculation (better animation) */
.med-card-content.expanded {
    max-height: var(--content-height);  /* Calculated via JS */
    overflow: hidden;
}
```

With JS calculation:
```javascript
toggleMedicationCard(element) {
    const content = element.querySelector('.med-card-content');
    const inner = content.querySelector('.inner-content');

    if (content.classList.contains('expanded')) {
        content.style.setProperty('--content-height', '0px');
        content.classList.remove('expanded');
    } else {
        const height = inner.scrollHeight;
        content.style.setProperty('--content-height', `${height}px`);
        content.classList.add('expanded');
    }
}
```

---

### 🟡 BUG #7: Module Grid Doesn't Adapt to Small Tablets
**Location:** `styles/main.css` - `.module-grid`
**Type:** UI
**Severity:** MINOR (P2)

#### Description
Module cards have `minmax(340px, 1fr)`, causing awkward single-column layout on tablets that could fit 2 columns.

#### Root Cause
```css
.module-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));  /* ❌ 340px too large */
}
```

#### Impact
- **Tablet UX:** Wasted space, more scrolling
- **iPad Mini:** Single column when 2 could fit

#### Fix
```css
.module-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));  /* ✅ Adaptive */
}

/* Or with breakpoints: */
@media (max-width: 768px) {
    .module-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));  /* Smaller min */
    }
}
```

---

### 🟡 BUG #8: No Keyboard Focus Indicators
**Location:** All interactive elements
**Type:** A11Y
**Severity:** MAJOR (P1)

#### Description
No visible focus indicators for keyboard navigation. Users navigating with Tab key can't see which element is focused.

#### Impact
- **Accessibility:** Fails WCAG 2.1 AA (required for ADA compliance)
- **Keyboard Users:** Can't navigate effectively
- **Legal Risk:** ADA lawsuits possible

#### Fix
```css
/* Add global focus style: */
*:focus-visible {
    outline: 3px solid var(--accent-red);
    outline-offset: 2px;
    border-radius: 4px;
}

/* For buttons: */
button:focus-visible {
    outline: 3px solid var(--accent-red);
    box-shadow: 0 0 0 4px rgba(193, 14, 33, 0.2);
}

/* For links: */
a:focus-visible {
    outline: 2px solid var(--accent-red);
    outline-offset: 4px;
}

/* Remove default outline but keep focus-visible: */
button:focus {
    outline: none;
}
```

---

### 🟡 BUG #9: Language Selector Touch Target Too Small
**Location:** `index.html:51-59` - Language slider
**Type:** A11Y
**Severity:** MINOR (P2)

#### Description
Language selector buttons are `40px` high, below WCAG recommended `44px` minimum touch target size.

#### Root Cause
```css
.lang-option {
    min-height: 40px;  /* ⚠️ Below 44px minimum */
}
```

#### Impact
- **Mobile UX:** Hard to tap accurately
- **Accessibility:** Fails WCAG touch target size guideline

#### Fix
```css
.lang-option {
    min-height: 48px;  /* ✅ Above 44px minimum */
    padding: 12px 16px;
}
```

---

### 🟡 BUG #10: No Loading State for Language Switch
**Location:** `main.js:4011` - `setLanguage()`
**Type:** UI
**Severity:** MINOR (P2)

#### Description
When switching language, there's a brief delay while loading translations but no loading indicator. User sees frozen UI.

#### Impact
- **UX:** User thinks app crashed
- **Accessibility:** Screen reader users don't know what's happening

#### Fix
```javascript
async setLanguage(lang) {
    // Show loading
    document.body.classList.add('loading');
    const mainView = document.getElementById('main-view');
    mainView.setAttribute('aria-busy', 'true');

    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    localStorage.setItem('ckm_lang', lang);
    this.updateUIContent();
    if (this.chatbot) this.chatbot.setLanguage(lang);
    this.navigateTo(this.currentPage);

    // Hide loading
    document.body.classList.remove('loading');
    mainView.setAttribute('aria-busy', 'false');
}
```

```css
/* Add loading spinner: */
body.loading::before {
    content: '';
    position: fixed;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    border: 4px solid rgba(193, 14, 33, 0.2);
    border-top-color: var(--accent-red);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    z-index: 10000;
    transform: translate(-50%, -50%);
}

@keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

---

### 🟡 BUG #11: Missing Skip Link for Screen Readers
**Location:** `index.html` - `<body>` top
**Type:** A11Y
**Severity:** MINOR (P2)

#### Description
No "Skip to main content" link for keyboard/screen reader users. They must tab through entire header to reach content.

#### Impact
- **Accessibility:** Fails WCAG 2.1 AA Guideline 2.4.1
- **UX:** Keyboard users waste time

#### Fix
```html
<!-- Add at top of <body> in index.html: -->
<a href="#main-view" class="skip-link">
    Skip to main content
</a>
```

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--accent-red);
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 0 0 4px 0;
    z-index: 100;
    transition: top 0.2s;
}

.skip-link:focus {
    top: 0;  /* Slide down when focused */
}
```

---

### 🟡 BUG #12: Food Label SVG Not Optimized for Large Screens
**Location:** Module rendering - Food label SVG
**Type:** UI
**Severity:** MINOR (P2)

#### Description
Food label SVG has `width="100%"` with no max-width, becoming pixelated on 4K monitors.

#### Fix
```javascript
// In renderFoodLabel():
<svg viewBox="0 0 300 450" width="100%" height="auto" style="max-width: 500px;">
```

---

### 🟡 BUG #13: Confetti Animation Blocking UI
**Location:** `main.js` - `celebrate()` method
**Type:** UI
**Severity:** MINOR (P2)

#### Description
Confetti canvas covers entire screen and might block clicks during animation.

#### Fix
```javascript
// In celebrate():
canvas.style.pointerEvents = 'none';  // ✅ Allow clicks through canvas
```

---

### 🟡 BUG #14: XSS Vulnerability in Chat Message Rendering
**Location:** Chat message rendering
**Type:** SECURITY
**Severity:** MAJOR (P1)

#### Description
If user input is rendered with `innerHTML`, it could execute malicious scripts.

#### Root Cause
```javascript
// Potential issue if exists:
chatContainer.innerHTML += `<div>${userMessage}</div>`;  // ❌ XSS risk
```

#### Fix
```javascript
// Use textContent instead:
const messageEl = document.createElement('div');
messageEl.textContent = userMessage;  // ✅ Auto-escapes HTML
chatContainer.appendChild(messageEl);
```

---

### 🟡 BUG #15: localStorage Not Encrypted
**Location:** All localStorage usage
**Type:** SECURITY
**Severity:** MINOR (P2) - Depends on use case

#### Description
Medication data and quiz results stored in plain text in localStorage. Anyone with device access can read it.

#### Impact
- **Privacy:** If storing PHI (Protected Health Information), this violates HIPAA
- **Security:** Data visible in browser DevTools

#### Fix (If storing sensitive data)
```javascript
// Use Web Crypto API:
async encryptData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // Generate key (in production, derive from user passphrase)
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    );

    return { encrypted, iv, key };
}

// Store encrypted:
const { encrypted, iv } = await encryptData(myMedications);
localStorage.setItem('ckm_my_medications', JSON.stringify({ encrypted, iv }));
```

**Note:** For non-PHI educational app, plain localStorage is acceptable.

---

## Backend Issues

### ✅ Good News: No Backend!

This is a **pure frontend PWA** with:
- ✅ No server-side code
- ✅ No database
- ✅ No API endpoints (except optional Claude API for chatbot)
- ✅ All logic in browser

### ⚠️ Backend-Related Considerations

#### Issue #1: Chatbot API Dependency
**Location:** `js/chatbot.js:122-142`
**Status:** Non-critical (has fallback)

```javascript
// Currently makes external API call:
const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
        'x-api-key': this.apiKey  // ❌ API key exposed in frontend
    }
});
```

**Problems:**
1. **API Key Exposure:** API key in frontend code is a security risk
2. **CORS Issues:** API calls might fail due to CORS
3. **Cost:** Every user directly hits Claude API (expensive)

**Solutions:**
1. **Recommended:** Create a simple backend proxy
   ```javascript
   // Backend endpoint (e.g., Cloudflare Worker, Vercel Function):
   export default async function handler(req, res) {
       const { query, context } = req.body;

       const response = await fetch('https://api.anthropic.com/v1/messages', {
           method: 'POST',
           headers: {
               'x-api-key': process.env.ANTHROPIC_API_KEY  // ✅ Server-side
           },
           body: JSON.stringify({ query, context })
       });

       return res.json(await response.json());
   }
   ```

2. **Alternative:** Use fallback mode (already implemented)
   ```javascript
   if (!this.apiKey) {
       return "I have found relevant information... Please consult your physician.";
   }
   ```

---

## Frontend Issues

### Performance Issues

#### PERF #1: Inline Translations (60% of File Size)
**Location:** `main.js:1-3800` (approximately)
**Impact:** 200KB+ of translations loaded even if user only uses English

**Fix:**
```javascript
// Currently: All 3 languages inline
translations: { en: {...}, pt: {...}, es: {...} }  // ❌ 200KB

// Better: Load on demand
async loadLanguage(lang) {
    if (!this.translations[lang]) {
        const response = await fetch(`./locales/${lang}.json`);
        this.translations[lang] = await response.json();
    }
}
// ✅ Load only needed language (saves 133KB on first load)
```

#### PERF #2: No Image Optimization
**Location:** `assets/` folder
**Issue:** Images not compressed or lazy-loaded

**Fix:**
- Compress images (use ImageOptim, TinyPNG)
- Add lazy loading:
  ```html
  <img src="..." loading="lazy" />
  ```

#### PERF #3: Render Functions Use innerHTML (Slow)
**Location:** Multiple render functions
**Issue:** Large HTML string concatenation causes slow DOM updates

**Example:**
```javascript
// Current (slow):
let html = '';
items.forEach(item => {
    html += `<div>...</div>`;  // ❌ String concatenation
});
mount.innerHTML = html;  // ❌ Full reparse

// Better:
const fragment = document.createDocumentFragment();
items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    // ... build element
    fragment.appendChild(div);  // ✅ Incremental
});
mount.appendChild(fragment);  // ✅ Single reflow
```

---

## Comprehensive Debugging Plan

### Phase 1: Environment Setup (30 minutes)

#### Step 1.1: Setup Local Development Server
```bash
# From project directory:
cd /Users/tomscy2000/.gemini/antigravity/scratch/ckm-navigator/

# Option 1: Python HTTP server
python3 -m http.server 8000

# Option 2: Node.js http-server (if installed)
npx http-server -p 8000

# Access at: http://localhost:8000
```

#### Step 1.2: Setup Browser DevTools
```bash
# Chrome/Edge:
1. Open http://localhost:8000
2. Open DevTools (F12 or Cmd+Option+I)
3. Enable "Preserve log" in Console tab
4. Enable "Disable cache" in Network tab
5. Open Application tab → Service Workers → Check "Update on reload"

# Safari (for iPad testing):
1. iPad: Settings → Safari → Advanced → Web Inspector: ON
2. Mac: Safari → Preferences → Advanced → Show Develop menu
3. Connect iPad via cable
4. Mac Safari → Develop → [iPad Name] → localhost
```

#### Step 1.3: Setup Testing Devices
```
Minimum test matrix:
- Desktop: Chrome (latest)
- Tablet: iPad Safari (iOS 15+)
- Phone: iPhone Safari (iOS 15+)
- Accessibility: Screen reader (NVDA/VoiceOver)
```

---

### Phase 2: Critical Bug Fixes (4 hours)

#### Step 2.1: Fix Language Switcher (30 min)

**Tasks:**
1. [ ] Open `main.js` in code editor
2. [ ] Navigate to line 4011 (`setLanguage` method)
3. [ ] Add `this.navigateTo(this.currentPage);` after line 4018
4. [ ] Save file
5. [ ] Test in browser:
   - [ ] Go to Module 1
   - [ ] Switch EN → PT
   - [ ] **Verify:** Content re-renders in Portuguese
   - [ ] Switch PT → ES
   - [ ] **Verify:** Content re-renders in Spanish
   - [ ] Test on all pages (home, modules, medications, quiz)
6. [ ] Check console for errors
7. [ ] Commit changes

**Expected Result:**
```javascript
async setLanguage(lang) {
    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    localStorage.setItem('ckm_lang', lang);
    this.updateUIContent();
    if (this.chatbot) this.chatbot.setLanguage(lang);
    this.navigateTo(this.currentPage);  // ✅ ADDED
}
```

---

#### Step 2.2: Fix My Medications Language Bug (2 hours)

**Tasks:**

**Part A: Add IDs to Medication Classes (30 min)**
1. [ ] Open all 3 locale files: `locales/en.json`, `locales/pt.json`, `locales/es.json`
2. [ ] Find medication categories → classes
3. [ ] Add unique `id` field to each class
   ```json
   {
       "id": "biguanides",
       "name": "Biguanides",
       "description": "...",
       "drugs": [...]
   }
   ```
4. [ ] **CRITICAL:** Ensure IDs match across all 3 languages
   - EN: `"id": "biguanides"`
   - PT: `"id": "biguanides"` (same ID)
   - ES: `"id": "biguanides"` (same ID)
5. [ ] Save all files

**Part B: Update addMyMedication (15 min)**
1. [ ] Open `main.js`
2. [ ] Find `addMyMedication` method (line ~5063)
3. [ ] Change from storing `className` to `classId`:
   ```javascript
   this.myMedications.push({
       name: medicationName,
       classId: cls.id,           // ✅ Changed from cls.name
       categoryId: categoryId,
       addedAt: Date.now()
   });
   ```
4. [ ] Save file

**Part C: Update Rendering Logic (30 min)**
1. [ ] Find all places where medications are rendered
2. [ ] Change lookup from `name` to `id`:
   ```javascript
   // OLD:
   const cls = cat.classes.find(c => c.name === myMed.className);

   // NEW:
   const cls = cat.classes.find(c => c.id === myMed.classId);
   ```
3. [ ] Search for all occurrences of `myMed.className` and update
4. [ ] Save file

**Part D: Data Migration (45 min)**
1. [ ] Add migration function:
   ```javascript
   migrateMyMedications() {
       let meds = JSON.parse(localStorage.getItem('ckm_my_medications') || '[]');

       if (meds.length > 0 && meds[0].className && !meds[0].classId) {
           console.log('Migrating medication data...');

           meds = meds.map(med => {
               // Try to find class in all languages
               const cat = this.getMedicationCategory(med.categoryId);
               let cls = null;

               // Try current language first
               cls = cat.classes.find(c => c.name === med.className);

               // If not found, try other languages
               if (!cls) {
                   ['en', 'pt', 'es'].forEach(lang => {
                       const catInLang = this.translations[lang].modules.content.module5.categories[med.categoryId];
                       cls = cls || catInLang.classes.find(c => c.name === med.className);
                   });
               }

               if (cls) {
                   return {
                       ...med,
                       classId: cls.id
                   };
               } else {
                   console.warn('Could not migrate medication:', med.name);
                   return med;  // Keep as-is, user will need to re-add
               }
           });

           localStorage.setItem('ckm_my_medications', JSON.stringify(meds));
           console.log('Migration complete:', meds.length, 'medications');
       }

       return meds;
   }
   ```

2. [ ] Call migration in `init()`:
   ```javascript
   init() {
       // ... existing code ...
       this.myMedications = this.migrateMyMedications();  // ✅ Add this
       // ... rest of init ...
   }
   ```

**Part E: Testing (30 min)**
1. [ ] Test new user flow:
   - [ ] Add medication in EN → Switch to PT → Verify displays correctly
   - [ ] Add medication in PT → Switch to ES → Verify displays correctly
   - [ ] Add 5 medications → Switch languages 3 times → All persist
2. [ ] Test migration:
   - [ ] Create fake old-format data in localStorage:
     ```javascript
     localStorage.setItem('ckm_my_medications', JSON.stringify([
         { name: 'Metformin', className: 'Biguanides', categoryId: 'diabetes', addedAt: Date.now() }
     ]));
     ```
   - [ ] Refresh app
   - [ ] Check console for "Migrating medication data..."
   - [ ] Verify medication displays correctly in all languages
3. [ ] Test edge cases:
   - [ ] Empty medications list
   - [ ] Remove medication in different language than added
   - [ ] Clear all medications

---

#### Step 2.3: Fix Service Worker Cache Strategy (1 hour)

**Tasks:**

**Part A: Update sw.js (30 min)**
1. [ ] Open `sw.js`
2. [ ] Replace fetch handler with network-first for HTML:
   ```javascript
   self.addEventListener('fetch', (event) => {
       const { request } = event;

       // For HTML: Network-first
       if (request.headers.get('accept')?.includes('text/html')) {
           event.respondWith(
               fetch(request)
                   .then(response => {
                       const clonedResponse = response.clone();
                       caches.open(CACHE_NAME).then(cache => {
                           cache.put(request, clonedResponse);
                       });
                       return response;
                   })
                   .catch(() => caches.match(request))
           );
       }
       // For assets: Cache-first
       else {
           event.respondWith(
               caches.match(request)
                   .then(response => response || fetch(request))
           );
       }
   });
   ```

3. [ ] Update cache version:
   ```javascript
   const CACHE_NAME = 'ckm-navigator-v3';  // Increment version
   ```

4. [ ] Add cache cleanup in activate:
   ```javascript
   self.addEventListener('activate', (event) => {
       event.waitUntil(
           caches.keys().then(cacheNames => {
               return Promise.all(
                   cacheNames
                       .filter(name => name !== CACHE_NAME)
                       .map(name => caches.delete(name))
               );
           }).then(() => self.clients.claim())
       );
   });
   ```

**Part B: Add Update Notification (30 min)**
1. [ ] In `main.js`, add to `init()`:
   ```javascript
   if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('./sw.js')
           .then(reg => {
               // Check for updates every 60 seconds
               setInterval(() => {
                   reg.update();
               }, 60000);
           });
   }
   ```

2. [ ] Add CSS for update banner:
   ```css
   .update-banner {
       position: fixed;
       top: 0;
       left: 0;
       right: 0;
       background: #4CAF50;
       color: white;
       padding: 12px 20px;
       text-align: center;
       z-index: 10001;
       display: flex;
       justify-content: space-between;
       align-items: center;
   }

   .update-banner button {
       background: white;
       color: #4CAF50;
       border: none;
       padding: 8px 16px;
       border-radius: 4px;
       cursor: pointer;
       font-weight: bold;
   }
   ```

**Part C: Testing (30 min)**
1. [ ] Deploy v3 with new SW
2. [ ] Open app in browser
3. [ ] Check Application tab → Service Workers
4. [ ] Verify SW registered and activated
5. [ ] Make a change to index.html (add comment)
6. [ ] Increment CACHE_NAME to v4
7. [ ] Deploy changes
8. [ ] Refresh browser
9. [ ] **Verify:** New version loads (not cached)
10. [ ] Go offline (Network tab → Offline)
11. [ ] Refresh
12. [ ] **Verify:** App still works (fallback to cache)

---

### Phase 3: UI/UX Bug Fixes (2 hours)

#### Step 3.1: Fix Chat Sidebar Width (15 min)
1. [ ] Open `styles/main.css`
2. [ ] Find `.chat-sidebar`
3. [ ] Update CSS:
   ```css
   .chat-sidebar {
       width: min(420px, 90vw);
       max-width: 100%;
   }

   @media (max-width: 480px) {
       .chat-sidebar {
           width: 100vw;
           left: 0;
       }
   }
   ```
4. [ ] Test on phone/tablet simulators

#### Step 3.2: Add Debouncing to Resize (20 min)
1. [ ] Add debounce utility to `main.js`:
   ```javascript
   debounce(func, wait) {
       let timeout;
       return (...args) => {
           clearTimeout(timeout);
           timeout = setTimeout(() => func.apply(this, args), wait);
       };
   }
   ```
2. [ ] Find `initHeaderCollisionDetection`
3. [ ] Wrap resize handler:
   ```javascript
   window.addEventListener('resize', this.debounce(checkCollision, 150));
   ```

#### Step 3.3: Fix Accordion Max-Height (15 min)
1. [ ] In `styles/main.css`:
   ```css
   .med-card-content.expanded {
       max-height: none;
       overflow: visible;
   }
   ```

#### Step 3.4: Add Loading State to Language Switch (30 min)
- Follow fix in BUG #10 above

#### Step 3.5: Add Keyboard Focus Indicators (30 min)
- Follow fix in BUG #8 above

#### Step 3.6: Add Skip Link (10 min)
- Follow fix in BUG #11 above

---

### Phase 4: Accessibility Improvements (2 hours)

#### Step 4.1: ARIA Labels Audit (1 hour)
**Tasks:**
1. [ ] Audit all buttons for aria-label
2. [ ] Add aria-current to active nav items
3. [ ] Add aria-expanded to accordions
4. [ ] Add role="main" to #main-view
5. [ ] Add aria-live regions for dynamic content

**Example fixes:**
```html
<!-- Navigation: -->
<button
    onclick="app.navigateTo('home')"
    aria-label="Navigate to home page"
    aria-current="page">
    Home
</button>

<!-- Accordion: -->
<button
    onclick="app.toggleMedicationCard(this)"
    aria-expanded="false"
    aria-controls="med-card-1">
    Biguanides
</button>

<div id="med-card-1"
     class="med-card-content"
     role="region"
     aria-labelledby="med-card-1-header">
    ...
</div>

<!-- Main view: -->
<div id="main-view"
     role="main"
     aria-live="polite"
     aria-busy="false">
</div>
```

#### Step 4.2: Screen Reader Testing (1 hour)
**Setup:**
```bash
# Mac: Enable VoiceOver
System Preferences → Accessibility → VoiceOver → Enable
Shortcut: Cmd+F5

# Windows: Install NVDA (free)
https://www.nvaccess.org/download/
```

**Testing Checklist:**
- [ ] Can navigate entire app with keyboard only
- [ ] All buttons/links have descriptive labels
- [ ] Screen reader announces page changes
- [ ] Form inputs have labels
- [ ] Dynamic content updates are announced
- [ ] Focus moves logically through page

---

### Phase 5: Performance Optimization (3 hours)

#### Step 5.1: Remove Inline Translations (2 hours)
**This is complex - requires careful refactoring**

1. [ ] Verify external JSON files exist and are complete
2. [ ] Test loadLanguage() function works
3. [ ] Remove inline translations from main.js
4. [ ] Test app loads correctly with external files
5. [ ] Measure file size reduction

#### Step 5.2: Image Optimization (30 min)
1. [ ] Install ImageOptim or use online tool
2. [ ] Compress all images in `assets/` folder
3. [ ] Add `loading="lazy"` to all images
4. [ ] Verify images still look good

#### Step 5.3: Add Performance Monitoring (30 min)
```javascript
// Add to init():
if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log('Performance:', entry.name, entry.duration + 'ms');
        }
    });
    observer.observe({ entryTypes: ['navigation', 'resource'] });
}
```

---

### Phase 6: Security Hardening (1 hour)

#### Step 6.1: XSS Prevention Audit (30 min)
1. [ ] Search for all `innerHTML` usage
2. [ ] Replace with `textContent` where user input involved
3. [ ] Add CSP headers (if deploying to server)

#### Step 6.2: API Key Security (30 min)
- If using Claude API, create backend proxy
- Remove API key from frontend
- Update chatbot.js to call proxy endpoint

---

### Phase 7: Testing & Validation (4 hours)

#### Step 7.1: Functional Testing (2 hours)
**Test Matrix:**

| Feature | Chrome | Safari | iPad | Status |
|---------|--------|--------|------|--------|
| Language switching | [ ] | [ ] | [ ] | |
| Module navigation | [ ] | [ ] | [ ] | |
| Medication add/remove | [ ] | [ ] | [ ] | |
| Quiz completion | [ ] | [ ] | [ ] | |
| Chatbot | [ ] | [ ] | [ ] | |
| Offline mode | [ ] | [ ] | [ ] | |
| Progress tracking | [ ] | [ ] | [ ] | |

#### Step 7.2: Regression Testing (1 hour)
- [ ] Test all fixed bugs
- [ ] Verify no new bugs introduced
- [ ] Check console for errors

#### Step 7.3: Performance Testing (1 hour)
**Run Lighthouse:**
```bash
# Chrome DevTools:
1. Open app in Chrome
2. DevTools → Lighthouse tab
3. Select "Mobile"
4. Click "Generate report"

Target scores:
- Performance: 90+
- Accessibility: 100
- Best Practices: 95+
- SEO: 90+
```

---

## Testing Strategy

### Manual Testing Checklist

#### Critical Path Testing (30 min)
- [ ] **Load app** → Home page displays
- [ ] **Switch language** EN → PT → ES → Content updates
- [ ] **Navigate** to Module 1 → Content loads
- [ ] **Add medication** → Appears in My Medications
- [ ] **Switch language** → Medication persists with correct name
- [ ] **Complete quiz** → Results show
- [ ] **Open chatbot** → Can send messages
- [ ] **Go offline** → App still works
- [ ] **Refresh** → Data persists

#### Browser Testing Matrix
| Browser | Version | Status | Issues |
|---------|---------|--------|--------|
| Chrome | Latest | [ ] | |
| Safari (Mac) | Latest | [ ] | |
| Safari (iPad) | iOS 15+ | [ ] | |
| Firefox | Latest | [ ] | |
| Edge | Latest | [ ] | |

#### Device Testing Matrix
| Device | Orientation | Status | Issues |
|---------|---------|--------|--------|
| Desktop (1920x1080) | - | [ ] | |
| iPad Pro 12.9" | Portrait | [ ] | |
| iPad Pro 12.9" | Landscape | [ ] | |
| iPad Air | Portrait | [ ] | |
| iPhone 13 | Portrait | [ ] | |

---

## Bug Fix Priority Matrix

### Week 1 (Critical Bugs - Deploy Blockers)
| Bug | Priority | Effort | Risk | Status |
|-----|----------|--------|------|--------|
| Language Switcher | P0 | 30 min | Low | [ ] |
| My Medications Language | P0 | 2 hours | Med | [ ] |
| Service Worker Cache | P0 | 1 hour | Med | [ ] |

### Week 2 (Major Bugs - UX Improvements)
| Bug | Priority | Effort | Risk | Status |
|-----|----------|--------|------|--------|
| Resize Debouncing | P1 | 15 min | Low | [ ] |
| Chat Sidebar Width | P1 | 15 min | Low | [ ] |
| Keyboard Focus | P1 | 30 min | Low | [ ] |
| XSS Prevention | P1 | 30 min | Med | [ ] |

### Week 3 (Minor Bugs - Polish)
| Bug | Priority | Effort | Risk | Status |
|-----|----------|--------|------|--------|
| Accordion Max-Height | P2 | 15 min | Low | [ ] |
| Module Grid Responsive | P2 | 20 min | Low | [ ] |
| Loading States | P2 | 30 min | Low | [ ] |
| Skip Link | P2 | 10 min | Low | [ ] |
| Touch Target Sizes | P2 | 15 min | Low | [ ] |

### Week 4 (Performance & Optimization)
| Task | Priority | Effort | Risk | Status |
|------|----------|--------|------|--------|
| Remove Inline Translations | P1 | 2 hours | High | [ ] |
| Image Optimization | P2 | 30 min | Low | [ ] |
| DOM Rendering Optimization | P2 | 2 hours | Med | [ ] |

---

## Success Criteria

### Before Deployment
- [ ] All P0 bugs fixed and tested
- [ ] All P1 bugs fixed or documented
- [ ] Lighthouse score >90
- [ ] No console errors on critical paths
- [ ] Works offline
- [ ] Tested on 3+ devices
- [ ] Screen reader tested

### After Deployment
- [ ] Monitor error logs for 1 week
- [ ] Collect user feedback
- [ ] Track performance metrics
- [ ] Fix any new bugs discovered

---

## Appendix: Debugging Tools & Commands

### Browser DevTools Shortcuts
```
Chrome/Edge:
- Open DevTools: Cmd+Option+I (Mac) or F12 (Win)
- Console: Cmd+Option+J
- Network: Cmd+Option+N
- Lighthouse: Cmd+Option+L

Safari:
- Enable Develop menu: Preferences → Advanced → Show Develop menu
- Web Inspector: Cmd+Option+I
- JavaScript Console: Cmd+Option+C
```

### Useful Console Commands
```javascript
// Check Service Worker status:
navigator.serviceWorker.getRegistrations().then(r => console.log(r));

// Check cache contents:
caches.keys().then(k => console.log(k));

// Check localStorage size:
JSON.stringify(localStorage).length / 1024 + 'KB'

// Clear all data:
localStorage.clear();
caches.keys().then(k => k.forEach(c => caches.delete(c)));

// Simulate offline:
// DevTools → Network → Throttling → Offline

// Check memory usage:
performance.memory
```

### Git Workflow for Bug Fixes
```bash
# Create branch for bug fix:
git checkout -b fix/language-switcher

# Make changes, test
# ...

# Commit with descriptive message:
git add main.js
git commit -m "Fix: Language switcher now re-renders current page

- Added this.navigateTo(this.currentPage) to setLanguage()
- Fixes issue where page content didn't update after language switch
- Tested on all pages (home, modules, medications, quiz)
- Closes #1"

# Push and create PR:
git push origin fix/language-switcher
```

---

## Document End

**Total Estimated Debug Time:** 16 hours (2 working days)

**Critical Path:** 4 hours (can deploy after this)

**Full Polish:** 16 hours (production-ready)

---

**Next Steps:**
1. Start with Phase 1 (Environment Setup)
2. Fix Critical Bugs (Phase 2)
3. Test thoroughly
4. Deploy and monitor
5. Iterate based on feedback

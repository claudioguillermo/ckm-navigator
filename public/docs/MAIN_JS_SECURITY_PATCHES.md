# main.js Security Patches

This document outlines the required security patches for main.js.
Due to the file size (6,807 lines), these are pattern-based replacements.

## CRITICAL FIXES REQUIRED

### Fix 1: Replace All Unsafe innerHTML Usage

**Pattern to Find:**
```javascript
element.innerHTML = content;
this.mainView.innerHTML = pageContent;
mount.innerHTML = `...`;
```

**Replace With:**
```javascript
DOMUtils.safeSetHTML(element, content);
DOMUtils.safeSetHTML(this.mainView, pageContent);
DOMUtils.safeSetHTML(mount, `...`);
```

**Locations (approximate line numbers):**
- Line 3863: `banner.innerHTML = ...`
- Line 3948: `this.mainView.innerHTML = pageContent`
- Line 4021: `loader.innerHTML = ...`
- Line 4118: `this.modalBody.innerHTML = ...`
- Line 4594+: Multiple template literals with innerHTML

**Example Fix:**
```javascript
// BEFORE (line 3863):
banner.innerHTML = `
    ${translations[lang].updateMessage}
    <button onclick="location.reload()">Refresh</button>
`;

// AFTER:
DOMUtils.safeSetHTML(banner, `
    ${translations[lang].updateMessage}
    <button id="sw-refresh-btn">Refresh</button>
`);
// Add event listener properly
document.getElementById('sw-refresh-btn').addEventListener('click', () => location.reload());
```

---

### Fix 2: Replace Inline onclick Handlers

**Pattern to Find:**
```javascript
<div onclick="app.method()">
<button onclick="app.method()">
```

**Two-Step Fix:**

**Step 1:** Remove onclick from HTML templates
```javascript
// BEFORE:
<div class="soft-card" onclick="app.renderModuleDetail(${mod.id})">

// AFTER:
<div class="soft-card" data-module-id="${mod.id}" class="module-card-clickable">
```

**Step 2:** Add event delegation
```javascript
// Add to app initialization:
document.addEventListener('click', (e) => {
    const moduleCard = e.target.closest('.module-card-clickable');
    if (moduleCard) {
        const moduleId = parseInt(moduleCard.dataset.moduleId);
        app.renderModuleDetail(moduleId);
    }
});
```

**Locations:**
- Line 317: Quiz button onclick
- Line 4236: Next module button onclick
- Line 4330: Module cards onclick
- Line 4405: Clinical note toggle onclick
- Line 4427, 4433, 4458: Various buttons
- Line 4524, 4559, 4566-4576: Movement explorer buttons

---

### Fix 3: Initialize Secure Storage

**Add to app object initialization (around line 3793):**

```javascript
// BEFORE:
const app = {
    translations: {...},
    currentLanguage: localStorage.getItem('ckm_lang') || 'en',
    completedModules: JSON.parse(localStorage.getItem('ckm_progress') || '[]'),
    myMedications: JSON.parse(localStorage.getItem('ckm_my_medications') || '[]'),
    ...
};

// AFTER:
const app = {
    translations: {...},
    currentLanguage: 'en', // Will be loaded from secure storage
    completedModules: [], // Will be loaded from secure storage
    myMedications: [], // Will be loaded from secure storage
    secureStorage: new LegacyStorageWrapper(), // ADDED
    ...
};

// Add async initialization method:
async init() {
    // Load secure data
    this.currentLanguage = await this.secureStorage.getItem('ckm_lang', 'en');
    this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
    this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);

    // Continue with rest of initialization...
    await this.loadLanguage(this.currentLanguage);
    this.registerServiceWorker();
    // etc.
}
```

---

### Fix 4: Replace All localStorage.setItem Calls

**Pattern to Find:**
```javascript
localStorage.setItem('ckm_progress', JSON.stringify(this.completedModules));
localStorage.setItem('ckm_lang', lang);
localStorage.setItem('ckm_my_medications', JSON.stringify(this.myMedications));
localStorage.setItem('ckm_stage', stage);
```

**Replace With (all instances):**
```javascript
await this.secureStorage.setItem('ckm_progress', this.completedModules);
await this.secureStorage.setItem('ckm_lang', lang);
await this.secureStorage.setItem('ckm_my_medications', this.myMedications);
await this.secureStorage.setItem('ckm_stage', stage);
```

**Locations:**
- Line 4132: setLanguage method
- Line 4489: markModuleComplete
- Line 5234: saveMyMedications
- Line 6253-6254: resetProgress
- Line 6538: saveStagingResult
- Line 6603: Another progress save

**Important:** These methods must become async:
```javascript
// BEFORE:
setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('ckm_lang', lang);
    // ...
}

// AFTER:
async setLanguage(lang) {
    this.currentLanguage = lang;
    await this.secureStorage.setItem('ckm_lang', lang);
    // ...
}
```

---

### Fix 5: Safe JSON Parsing

**Pattern to Find:**
```javascript
JSON.parse(localStorage.getItem('ckm_progress') || '[]')
```

**Replace With:**
```javascript
await this.secureStorage.getItem('ckm_progress', [])
```

**No longer needed** - SecureStorage handles parsing safely

---

### Fix 6: Add Error Handling to fetch() Calls

**Pattern to Find (approximate line 4003):**
```javascript
async loadLanguage(lang) {
    const response = await fetch(`./locales/${lang}.json`);
    this.translations[lang] = await response.json();
    this.applyTranslations();
}
```

**Replace With:**
```javascript
async loadLanguage(lang) {
    try {
        const response = await fetch(`./locales/${lang}.json`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.translations[lang] = data;
        this.applyTranslations();

    } catch (error) {
        console.error(`Failed to load language "${lang}":`, error);

        // Show error to user
        this.showNotification(
            `Could not load ${lang} translations. Please refresh the page.`,
            'error'
        );

        // Fallback to English if available
        if (lang !== 'en' && this.translations.en) {
            console.log('Falling back to English');
            this.currentLanguage = 'en';
            this.applyTranslations();
        }
    }
}
```

---

### Fix 7: Add Race Condition Protection to Language Loading

**Add to app object:**
```javascript
const app = {
    // ... existing properties ...
    activeLanguageRequest: null, // ADDED

    async loadLanguage(lang) {
        // Cancel previous request
        const requestId = Symbol();
        this.activeLanguageRequest = requestId;

        try {
            const response = await fetch(`./locales/${lang}.json`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Only apply if this is still the active request
            if (this.activeLanguageRequest === requestId) {
                this.translations[lang] = data;
                this.applyTranslations();
            } else {
                console.log(`Language request for ${lang} cancelled`);
            }

        } catch (error) {
            // ... error handling from Fix 6 ...
        }
    }
};
```

---

### Fix 8: Clean Up inline onclick in HTML Templates

Many dynamically generated HTML strings contain onclick handlers. These must be converted to use data attributes + event delegation.

**Example from staging quiz (line 4594+):**

**BEFORE:**
```javascript
mount.innerHTML = `
    <div class="movement-explorer-card">
        <h3>${slides[activeIdx].title}</h3>
        <p>${slides[activeIdx].text}</p>
        <div class="explorer-nav">
            <button class="btn btn-secondary" onclick="app.renderMovementExplorer(${activeIdx - 1})">
                ← Previous
            </button>
            <button class="btn btn-primary" onclick="app.renderMovementExplorer(${activeIdx + 1})">
                Next →
            </button>
        </div>
    </div>
`;
```

**AFTER:**
```javascript
const html = `
    <div class="movement-explorer-card">
        <h3>${DOMUtils.escapeHTML(slides[activeIdx].title)}</h3>
        <p>${DOMUtils.escapeHTML(slides[activeIdx].text)}</p>
        <div class="explorer-nav">
            <button class="btn btn-secondary"
                    data-action="movement-prev"
                    data-index="${activeIdx}"
                    ${activeIdx === 0 ? 'disabled' : ''}>
                ← Previous
            </button>
            <button class="btn btn-primary"
                    data-action="movement-next"
                    data-index="${activeIdx}"
                    ${activeIdx === slides.length - 1 ? 'disabled' : ''}>
                Next →
            </button>
        </div>
    </div>
`;

DOMUtils.safeSetHTML(mount, html);

// Event delegation (add once during init)
mount.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === 'movement-prev') {
        const idx = parseInt(e.target.dataset.index);
        app.renderMovementExplorer(idx - 1);
    } else if (action === 'movement-next') {
        const idx = parseInt(e.target.dataset.index);
        app.renderMovementExplorer(idx + 1);
    }
});
```

---

## IMPLEMENTATION PLAN

### Phase 1: Initialize Security Utilities (DONE)
- ✅ Added DOMPurify
- ✅ Created DOMUtils.js
- ✅ Created SecureStorage.js
- ✅ Added to index.html

### Phase 2: Update app Initialization
```javascript
// Change app.init to be async
const app = {
    // ... properties ...
    secureStorage: new LegacyStorageWrapper(),
    activeLanguageRequest: null,

    async init() {
        // Load from secure storage
        this.currentLanguage = await this.secureStorage.getItem('ckm_lang', 'en');
        this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
        this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);

        // Load translations
        await this.loadLanguage(this.currentLanguage);

        // Register service worker
        this.registerServiceWorker();

        // Initialize UI
        this.updateNav();
        this.navigateTo(this.currentView);
    }
};

// Start app (update at end of main.js)
window.addEventListener('DOMContentLoaded', () => {
    app.init().catch(err => {
        console.error('App initialization error:', err);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h1>⚠️ Initialization Error</h1>
                <p>Please refresh the page or contact support.</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    });
});
```

### Phase 3: Convert All innerHTML to DOMUtils.safeSetHTML
- Search for regex: `\.innerHTML\s*=`
- Replace each with `DOMUtils.safeSetHTML(...)`
- Test after each replacement

### Phase 4: Remove All Inline onclick
- Search for regex: `onclick="[^"]+"`
- Convert to data attributes
- Add event delegation
- Test after each replacement

### Phase 5: Convert localStorage to secureStorage
- Replace all `localStorage.setItem` with `await this.secureStorage.setItem`
- Replace all `localStorage.getItem` with `await this.secureStorage.getItem`
- Make affected methods async

### Phase 6: Testing
- Test all functionality
- Test with tampered localStorage data
- Test with XSS payloads in translations
- Test language switching rapidly
- Test offline mode

---

## AUTOMATED SCRIPT APPROACH

Due to the large file size, consider creating a Node.js script to automate these replacements:

```javascript
// patch-main-js.js
const fs = require('fs');

let content = fs.readFileSync('main.js', 'utf8');

// Fix 1: innerHTML replacements
content = content.replace(
    /(\w+)\.innerHTML\s*=\s*([^;]+);/g,
    'DOMUtils.safeSetHTML($1, $2);'
);

// Fix 2: localStorage.setItem
content = content.replace(
    /localStorage\.setItem\('([^']+)',\s*JSON\.stringify\(([^)]+)\)\)/g,
    'await this.secureStorage.setItem(\'$1\', $2)'
);

// ... more replacements ...

fs.writeFileSync('main.js.patched', content);
console.log('Patched file written to main.js.patched');
```

Run with: `node patch-main-js.js`

Then manually review and test the patched file.

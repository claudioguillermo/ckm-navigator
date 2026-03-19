# Comprehensive Bug Report & Debugging Plan
## EMPOWER-CKM Navigator - January 18, 2026

---

## Executive Summary

After a thorough audit of the codebase, I have identified **15 bugs** across 5 categories:
- **5 Critical Bugs** (Breaking core functionality)
- **4 Security Issues** (XSS vulnerabilities via onclick handlers)
- **3 Structural/Syntax Issues** (Malformed HTML)
- **2 Rendering Issues** (Visual inconsistencies)
- **1 Data Persistence Bug** (Progress not saving/loading)

---

## 1. OVERALL CODEBASE STRUCTURE

### File Architecture
```
ckm-navigator/
├── index.html              # Main entry point, loads scripts
├── main.js                 # Monolithic 6,941-line app file
├── styles/main.css         # Global styles
├── js/
│   ├── dom-utils.js        # XSS-safe DOM manipulation
│   ├── secure-storage.js   # HMAC-signed localStorage wrapper
│   ├── chatbot.js          # AI chatbot logic
│   └── search-engine.js    # Knowledge search
├── locales/
│   ├── en.json             # English translations (external)
│   ├── es.json             # Spanish translations (external)
│   └── pt.json             # Portuguese translations (external)
└── sw.js                   # Service worker for offline
```

### Key Observation
The `main.js` file contains:
- **Inline English translations** (lines 4-3800) - duplicated with `locales/en.json`
- **Spanish translations** (lines ~1900-2900) embedded in the `translations` object
- **Portuguese translations** (lines ~1050-1850) embedded in the `translations` object
- All application logic (lines 3800-6941)

---

## 2. BUGS IDENTIFIED

### CRITICAL BUG #1: Progress Never Loaded From Storage
**Impact:** Progress resets on every page load. Users cannot reach 100% completion.

**Root Cause:** 
- `completedModules` is initialized as empty array at line 3801
- It is saved to `secureStorage` when modules complete (line 4560)
- **But it is NEVER loaded from storage during `init()`**

**Evidence:**
```javascript
// Line 3801 - Always starts empty
completedModules: [], // Will be loaded from secure storage

// Line 4560 - Saves correctly
await this.secureStorage.setItem('ckm_progress', this.completedModules);

// init() function (lines 3874-3994) - No loading of ckm_progress!
```

**Fix Required:**
Add to `init()`:
```javascript
// After line 3893 (initMyMedications)
this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
```

---

### CRITICAL BUG #2: Malformed onclick in Food Label Hotspot
**Impact:** Module 2 food label hotspots don't work (broken interactivity)

**Location:** Line 4939
```javascript
// BROKEN - Missing closing quote and parenthesis
\`<g class="label-hotspot ${activeHotspot === id ? 'active' : ''}" onclick= "app.renderFoodLabel(1, '${id}" >\`

// SHOULD BE:
\`<g class="label-hotspot ${activeHotspot === id ? 'active' : ''}" data-action="renderFoodLabel" data-args="1, '${id}'" >\`
```

---

### CRITICAL BUG #3: Malformed onclick in Chat Sources
**Impact:** Chat source preview buttons throw syntax errors

**Location:** Line 6519
```javascript
// BROKEN - Missing closing quote and parenthesis
\`<button class="source-pill" onclick="app.showSourcePreview('${source.id}"\`

// SHOULD BE:
\`<button class="source-pill" data-action="showSourcePreview" data-args="'${source.id}'"\`
```

---

### CRITICAL BUG #4: Inline onclick in Portuguese/Spanish Translations
**Impact:** Quiz "Start Assessment" button won't work when using PT/ES translations

**Locations:**
- `main.js` line 1794 (Portuguese embedded): `onclick="app.startQuiz()"`
- `main.js` line 2955 (Spanish embedded): `onclick="app.startQuiz()"`
- `locales/es.json` line 324: `onclick="app.startQuiz()"`
- `locales/pt.json` line 324: `onclick="app.startQuiz()"`

**Note:** English was already fixed at line 318 to use `data-action="renderQuizStep"`

**Fix Required:**
Replace all `onclick="app.startQuiz()"` with `data-action="renderQuizStep" data-args="true"`

---

### CRITICAL BUG #5: Missing myMedications Load
**Impact:** User medications list resets on reload

**Root Cause:**
Like `completedModules`, `myMedications` array is never loaded in `init()`.

**Location:** Line 3802
```javascript
myMedications: [], // Will be loaded from secure storage
```

**Fix Required:**
Add to `init()` after `initMyMedications()`:
```javascript
this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);
```

---

### SECURITY ISSUE #1-4: Remaining inline onclick handlers

**Locations in main.js:**
| Line | Context | Current Code |
|------|---------|--------------|
| 4939 | Food Label Hotspot | `onclick= "app.renderFoodLabel(1, '${id}"` |
| 6519 | Chat Source Pill | `onclick="app.showSourcePreview('${source.id}"` |
| 1794 | PT Quiz Button | `onclick="app.startQuiz()"` |
| 2955 | ES Quiz Button | `onclick="app.startQuiz()"` |

**Locations in locale files:**
| File | Line | Current Code |
|------|------|--------------|
| locales/es.json | 324 | `onclick=\"app.startQuiz()\"` |
| locales/pt.json | 324 | `onclick=\"app.startQuiz()\"` |

**Risk:** These bypass DOMPurify's FORBID_ATTR list because they're in template literals processed before sanitization.

---

### STRUCTURAL BUG #1: Malformed HTML Tags with Extra Spaces
**Impact:** Potential rendering issues in strict parsers

**Pattern:** `</div >`, `</svg >`, `</g >`, `</button >`

**Count:** 50+ instances throughout main.js

**Example Locations:**
- Lines 5036, 5044, 5057, 5068, 5478, 5587...
- Lines 4935, 4948, 5017, 5651-5655, 6062, 6066...

**Fix Required:**
Global find/replace:
- `</div >` → `</div>`
- `</svg >` → `</svg>`
- `</g >` → `</g>`
- `</button >` → `</button>`

---

### STRUCTURAL BUG #2: Malformed Comments in Template Literals
**Impact:** Comments with spaces may render incorrectly

**Location:** Line 5940, 5955
```javascript
\`<! --Navigation List-- >\`  // Should be <!-- Navigation List -->
\`<!--Food Detail-- >\`       // Mixed format
```

---

### STRUCTURAL BUG #3: Inconsistent data-args Formatting
**Impact:** Argument parsing may fail for certain action calls

**Example:** Some use single quotes, some double, some mixed:
```javascript
data-args="'${mountId}', ${slideIdx - 1}"  // Correct
data-args="${id}"                            // Also correct
data-args="'${source.id}'"                   // Needs consistency
```

---

### RENDERING BUG #1: Module 2 Content Not Loading
**Impact:** Eating Plate animation may fail silently

**Root Cause:** Cascading failure from Critical Bug #2. The hotspot onclick syntax error may cause JavaScript errors that prevent the module from rendering.

---

### RENDERING BUG #2: Inconsistent Language Fallback
**Impact:** Mixed languages may appear if translation keys missing

**Observation:** External locale files have different structures than embedded translations.

---

## 3. DEBUGGING PLAN

### Phase 1: Critical Fixes (Immediate)
**Priority: BLOCKING - Must fix before any testing**

| # | Bug | Fix Action | Lines Affected |
|---|-----|------------|----------------|
| 1.1 | Progress not loading | Add `getItem('ckm_progress')` to init() | 3893 |
| 1.2 | Medications not loading | Add `getItem('ckm_my_medications')` to init() | 3893 |
| 1.3 | Food label onclick broken | Replace with data-action pattern | 4939 |
| 1.4 | Chat source onclick broken | Replace with data-action pattern | 6519 |
| 1.5 | PT/ES quiz onclick broken | Replace with data-action pattern | 1794, 2955 |

### Phase 2: Locale File Fixes
**Priority: HIGH - Affects non-English users**

| # | File | Fix Action |
|---|------|------------|
| 2.1 | locales/es.json line 324 | Replace onclick with data-action |
| 2.2 | locales/pt.json line 324 | Replace onclick with data-action |

### Phase 3: Syntax Cleanup
**Priority: MEDIUM - Code quality**

| # | Pattern | Fix Action | Count |
|---|---------|------------|-------|
| 3.1 | `</div >` | Remove extra space | ~25 |
| 3.2 | `</svg >` | Remove extra space | ~10 |
| 3.3 | `</g >` | Remove extra space | ~12 |
| 3.4 | `</button >` | Remove extra space | ~3 |

### Phase 4: Testing Checklist

#### Progress Tracking Tests
- [ ] Complete Module 1, verify progress saves
- [ ] Refresh page, verify progress persists
- [ ] Complete all modules, verify 100% shows
- [ ] Reset progress, verify returns to 0%

#### Module 2 Tests
- [ ] Eating Plate animation loads and navigates
- [ ] All 10 slides display correctly
- [ ] Food Label hotspots are clickable
- [ ] "Continue to Labels" button works
- [ ] Cultural Food Explorer navigates correctly

#### Module 6 Tests
- [ ] "Start Assessment" button works in EN
- [ ] "Comenzar Evaluación" works in ES
- [ ] "Iniciar Avaliação" works in PT
- [ ] Quiz completes and shows results
- [ ] Module marks as complete after quiz

#### Medication Tests
- [ ] Add medication to My Medications
- [ ] Refresh page, verify medication persists
- [ ] Remove medication, verify updates

---

## 4. FIX IMPLEMENTATION ORDER

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: CRITICAL (Blocking)                            │
│ ─────────────────────────────────────────────────────── │
│ 1.1 Load completedModules from storage                  │
│ 1.2 Load myMedications from storage                     │
│ 1.3 Fix food label onclick syntax                       │
│ 1.4 Fix chat source onclick syntax                      │
│ 1.5 Fix PT/ES quiz onclick in main.js                   │
├─────────────────────────────────────────────────────────┤
│ PHASE 2: LOCALE FILES (High)                            │
│ ─────────────────────────────────────────────────────── │
│ 2.1 Fix es.json quiz button                             │
│ 2.2 Fix pt.json quiz button                             │
├─────────────────────────────────────────────────────────┤
│ PHASE 3: SYNTAX CLEANUP (Medium)                        │
│ ─────────────────────────────────────────────────────── │
│ 3.1-3.4 Fix malformed closing tags                      │
├─────────────────────────────────────────────────────────┤
│ PHASE 4: TESTING                                        │
│ ─────────────────────────────────────────────────────── │
│ Run all test checklist items                            │
└─────────────────────────────────────────────────────────┘
```

---

## 5. ESTIMATED TIME

| Phase | Estimated Time |
|-------|----------------|
| Phase 1 | 15-20 minutes |
| Phase 2 | 5 minutes |
| Phase 3 | 10 minutes |
| Phase 4 | 20-30 minutes |
| **Total** | **50-65 minutes** |

---

## Ready to Proceed?

Reply with **"yes"** or **"proceed"** to begin implementing the fixes in order, or specify which phase you'd like to start with.

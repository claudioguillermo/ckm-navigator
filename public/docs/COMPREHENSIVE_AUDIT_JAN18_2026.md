# Comprehensive Codebase Audit - January 18, 2026

---

## 1. OVERALL STRUCTURE

### File Architecture
```
ckm-navigator/
├── index.html              # Main entry point (130 lines)
├── main.js                 # Monolithic app logic (6,988 lines, 459KB)
├── styles/main.css         # Global styles
├── js/
│   ├── dom-utils.js        # XSS-safe DOM manipulation (243 lines)
│   ├── secure-storage.js   # HMAC-signed storage (326 lines)
│   ├── chatbot.js          # AI chatbot logic
│   └── search-engine.js    # Knowledge search
├── locales/
│   ├── en.json             # English translations (external)
│   ├── es.json             # Spanish translations (external)
│   └── pt.json             # Portuguese translations (external)
├── sw.js                   # Service worker for offline
└── assets/                 # Icons, images
```

### Key Observations
1. **main.js is monolithic** - 6,988 lines containing:
   - Embedded translations (lines 4-3800) for EN, PT, ES
   - External translation loading logic
   - All rendering functions
   - All event handlers
   - SVG generation functions

2. **Translation Duplication**: Translations exist both embedded in `main.js` AND in `locales/*.json` files, leading to potential sync issues.

---

## 2. BROKEN INTERACTIONS (10 Issues)

### Critical Issues

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| **2.1** | `index.html` lines 44,49-52,59,62,65,87,100,102,108,110 | `onclick` handlers in static HTML | Security risk + inconsistent with data-action pattern |
| **2.2** | `locales/en.json` line 315 | `onclick="app.startQuiz()"` still present | Quiz fails when using external EN locale |
| **2.3** | `main.js` line 5177 | Malformed quote escaping in data-args: `data-args="\\'${cardId}\\'"` | Medication card toggle may fail |
| **2.4** | `main.js` line 6458,6462 | Direct `.onclick =` assignments in showConfirm | Bypasses event delegation |
| **2.5** | Food Label Hotspots | If DOMPurify strips `data-args`, hotspots break | Interactive elements may fail |

### Data-Action Handler Issues

| # | Function Call | Location | Issue |
|---|--------------|----------|-------|
| **2.6** | `renderMedicationCategory` | Line 5107 | Args have single quotes that may not parse |
| **2.7** | `toggleMedicationCard` | Line 5177 | Double-escaped quotes: `\\'${cardId}\\'` |
| **2.8** | `removeMyMedication` | Line 5591 | Should work but relies on name matching |
| **2.9** | `showMyMedications` | Line 4503 | Empty data-args="" - should work |
| **2.10** | `showSourcePreview` | Line 6560 | Args have single quotes |

---

## 3. STRUCTURAL & SYNTAX BUGS (8 Issues)

### Malformed HTML/SVG Elements

| # | Line(s) | Issue | Impact |
|---|---------|-------|--------|
| **3.1** | 6136 | `< !--Background Sectors-- >` (space before !) | Invalid HTML comment, may break SVG |
| **3.2** | 6142 | `<!--Section Dividers-- >` (space before >) | Invalid HTML comment |
| **3.3** | 6146 | `<!--Section Labels & Icons-- >` (space before >) | Invalid HTML comment |
| **3.4** | 6118, 6125 | `<defs >` and `</defs >` (extra space) | Could cause SVG parsing issues |
| **3.5** | 6609 | `<h2 > ${d.title}</h2 >` (extra spaces) | Malformed h2 tag |

### Quote Escaping Issues

| # | Line | Code | Issue |
|---|------|------|-------|
| **3.6** | 5177 | `data-args="\\'${cardId}\\'"` | Double-escaped single quotes |
| **3.7** | Multiple | Template literals with unescaped special chars | Potential injection points |

---

## 4. SECURITY VULNERABILITIES (6 Issues)

### HIGH Priority

| # | Location | Issue | Risk |
|---|----------|-------|------|
| **4.1** | `index.html` (12 occurrences) | Inline `onclick` handlers | XSS if attacker can modify HTML |
| **4.2** | `locales/en.json` line 315 | `onclick` in JSON content | Bypasses DOMPurify if HTML not sanitized |
| **4.3** | `main.js` line 6458, 6462 | Direct `element.onclick = fn` | Overwrites, doesn't add listener |

### MEDIUM Priority

| # | Location | Issue | Risk |
|---|----------|-------|------|
| **4.4** | `main.js` line 4452 | Image extraction via regex without sanitization | Could embed malicious img src |
| **4.5** | `main.js` line 4463 | Mount ID extraction via regex | ID could be malicious if from untrusted source |
| **4.6** | `index.html` line 27 | CSP commented out "for debugging" | No Content Security Policy protection |

---

## 5. GRAPHICS & RENDERING BUGS (7 Issues)

### SVG Rendering

| # | Location | Issue | Visual Impact |
|---|----------|-------|---------------|
| **5.1** | `getEatingPlateSVGForSlide` | Malformed comments break SVG in strict parsers | Plate animation may not render |
| **5.2** | `getEatingPlateSVGForSlide` | `<defs >` with extra space | Filter may not apply |
| **5.3** | Module 2 | If SVG fails to render, entire slideshow shows "broken SVG" | User sees broken UI |

### CSS/Layout Issues

| # | Selector | Issue | Visual Impact |
|---|----------|-------|---------------|
| **5.4** | `.chat-sidebar` | May overlap header in certain conditions | Chat obscures navigation |
| **5.5** | `.module-visual` | May clip animations on hover/scale | Interactive elements cut off |
| **5.6** | `.soft-card` | Overflow may hide content | Content clipping |
| **5.7** | Mobile responsive | Navigation may collide when window resized | Layout breaks |

---

## 6. LOGIC BUGS (5 Issues)

### State Management

| # | Function | Issue | Impact |
|---|----------|-------|--------|
| **6.1** | `toggleMedicationCard` | Quote parsing in `cardId` may fail | Accordion doesn't expand |
| **6.2** | `renderMyMedicationsDashboard` | Relies on `categoryId` which may not exist for legacy data | Empty medication list |
| **6.3** | `slideTransition` | If `mount` is null, silent failure | No visual feedback |
| **6.4** | External locale loading | If `loadLanguage` fails, falls back to embedded but may have sync issues | Mixed language content |
| **6.5** | `checkMedicationInteractions` | Uses hardcoded indices (0,1,2,3,4) for medication classes | Breaks if data structure changes |

---

## 7. DEBUGGING PLAN

### Phase 1: Critical HTML/Security Fixes (Highest Priority)

| Step | Action | Files |
|------|--------|-------|
| 1.1 | Replace all `onclick` in `index.html` with `data-action` | `index.html` |
| 1.2 | Fix `onclick` in `locales/en.json` | `locales/en.json` |
| 1.3 | Uncomment and configure CSP | `index.html` |
| 1.4 | Fix direct `.onclick = ` assignments | `main.js` |

### Phase 2: SVG/Rendering Fixes

| Step | Action | Lines |
|------|--------|-------|
| 2.1 | Fix malformed comment: `< !--Background Sectors-- >` → `<!--Background Sectors-->` | 6136 |
| 2.2 | Fix malformed comment: `<!--Section Dividers-- >` → `<!--Section Dividers-->` | 6142 |
| 2.3 | Fix malformed comment: `<!--Section Labels & Icons-- >` → `<!--Section Labels & Icons-->` | 6146 |
| 2.4 | Fix `<defs >` → `<defs>` | 6118 |
| 2.5 | Fix `</defs >` → `</defs>` | 6125 |
| 2.6 | Fix `<h2 >` → `<h2>` and `</h2 >` → `</h2>` | 6609 |

### Phase 3: Quote Escaping & Data-Args Fixes

| Step | Action | Lines |
|------|--------|-------|
| 3.1 | Fix double-escaped quotes: `\\'${cardId}\\'` → `'${cardId}'` | 5177 |
| 3.2 | Verify all data-args parse correctly | Multiple |

### Phase 4: Testing Checklist

- [ ] Module 1: Checkboxes toggle correctly
- [ ] Module 1: Scroll button works
- [ ] Module 2: Eating Plate slides render
- [ ] Module 2: Food Label hotspots work
- [ ] Module 3: Plan generator completes
- [ ] Module 5: Add medication shows in list
- [ ] Module 5: Medication accordion expands
- [ ] Module 6: Quiz starts and completes
- [ ] Navigation: All nav items work
- [ ] Language: Switching languages works
- [ ] Chat: Opens and closes correctly

---

## 8. ESTIMATED EFFORT

| Phase | Time |
|-------|------|
| Phase 1 | 20-30 min |
| Phase 2 | 10-15 min |
| Phase 3 | 10-15 min |
| Phase 4 | 30-45 min |
| **Total** | **70-105 min** |

---

## Ready to Proceed?

Reply **"proceed"** to begin implementing fixes in order, or specify which phase to start with.

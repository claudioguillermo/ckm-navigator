# Phase 4: Deep Modernization Plan

**Date:** 2026-02-10  
**Estimated Duration:** 4 step blocks  
**Prerequisite:** Phase 3 (complete)

---

## Objective

Continue decomposing the ~3,744-line `main.js` monolith into focused modules, remove dead `_OLD` backup code, update the service worker cache, and harden theme storage with `SecureStorage`.

---

## Current State Analysis

### main.js Function Map (136 outline items)

| Domain | Functions | Line Range | Est. Lines | Status |
|--------|-----------|-----------|------------|--------|
| **App Core** | `init`, `checkUrlParams`, `transitionView`, `slideTransition`, `loadLanguage`, `navigateTo`, `getPageContent`, `updateUIContent`, `initRefactorModules`, `runRefactorCompatibilityCheck`, `showUpdateNotification`, `reloadApp` | 44–489, 747–783 | ~440 | **Keep in main.js** |
| **UI/UX Utilities** | `celebrate`, `haptic`, `showLoadingIndicator`, `hideLoadingIndicator`, `initHamburgerMenu`, `initHeaderCollisionDetection`, `showImageZoom`, `initIntersectionObserver`, `initNotifications`, `setAppBadge`, `showConfirm`, `showTooltip`, `hideTooltip`, `scrollToElement`, `scrollToStaging`, `clearMount` | 78–681, 1604–1630, 2688–2713, 3508–3529 | ~200 | **Keep in main.js** |
| **Theme** | `initTheme`, `toggleTheme`, `applyTheme` | 683–745 | ~62 | **Keep** (but fix SecureStorage) |
| **Module Rendering** | `renderModuleDetail`, `renderKnowledgeCheck`, `handleQuizOptionClick`, `markModuleComplete`, `renderProgressBar` | 785–815 | ~30 | **Keep** (delegates to CurriculumController) |
| **Movement Module** | `renderMovementExplorer`, `getMovementVisual`, `generateTailoredPlan` | 817–1029 | ~212 | ⬅️ **Extract** |
| **Food Label Module** | `renderFoodLabel`, `renderFoodLabel.renderContent`, `getFoodLabelSVGForSlide` | 1031–1318 | ~287 | ⬅️ **Extract** |
| **Medication Module** | `renderMedicationMap`, `renderMedicationCategory`, `getMedicationClassCardHTML`, `toggleMedicationCard`, `addMyMedication`, `removeMyMedication`, `saveMyMedications`, `toggleMyMedication`, `closeMyMedications`, `renderMedicationsManager`, `updateMedicationUI`, `checkMedicationInteractions`, `renderMyMedicationsDashboard`, `showMyMedications` | 1320–1924 | ~604 | ⬅️ **Extract** |
| **Metrics & Staging** | `renderMetricsDashboard`, `renderStageExplorer` | 1927–2036 | ~109 | ⬅️ **Extract with Medication** |
| **Anatomy & Analogy** | `renderAnatomy`, `renderAnalogyAnimation`, `showMyth`, `getAnalogySVGForSlide`, `toggleClinicalNote`, `updateAnalogyControl`, `toggleAnalogyControl`, `calculateAnalogyBonus`, `getHouseAnalogySVG` | 2038–2662, 3438–3506 | ~580 | ⬅️ **Extract** |
| **Eating/Food Module** | `renderEatingPlateAnimation`, `renderCulturalFoodExplorer`, `getFoodStatusColor`, `getImpactColor`, `toggleEatingDetails`, `getEatingPlateSVGForSlide` | 2146–2529 | ~383 | ⬅️ **Extract** |
| **Chat (delegated)** | `toggleChat` → `_toggleChat_OLD`, etc. | 2715–3029 | ~314 | 🗑️ **Remove `_OLD` stubs** |
| **Modal/Focus** | `showOrganDetail`, `closeModal`, `trapFocus` | 3031–3173 | ~142 | **Keep in main.js** |
| **Quiz (delegated)** | `startQuiz` → `_startQuiz_OLD`, etc. | 3194–3436 | ~242 | 🗑️ **Remove `_OLD` stubs** |
| **Chat Interaction** | `initChatInteraction`, `snapToCorner` | 3531–3740 | ~209 | ⬅️ Move to **ChatController** |
| **Reset** | `resetProgress` | 2664–2686 | ~22 | **Keep in main.js** |

### Summary of Extractable Code

| New Module | Functions | Est. Lines |
|-----------|-----------|------------|
| `medication-controller.js` | 14 medication functions + metrics + staging explorer | ~713 |
| `analogy-controller.js` | 9 analogy/anatomy functions + house SVG | ~580 |
| `food-controller.js` | Food label + eating plate + cultural explorer | ~670 |
| `movement-controller.js` | Movement explorer + visuals + tailored plan | ~212 |
| Dead `_OLD` code removal | All `_chatXxx_OLD` and `_quizXxx_OLD` stubs | ~−556 |
| `initChatInteraction` → ChatController | Chat drag/resize logic | ~209 (move) |

**Total estimated reduction of main.js:** ~2,940 lines → leaving ~800 lines of core orchestration.

---

## Step-by-Step Plan

### Step 1: Remove Dead `_OLD` Code + Fix SW Cache *(Quick Win)*
**Estimated reduction: −556 lines**

1. **Remove all `_OLD` methods** from `main.js`:
   - `_toggleChat_OLD`, `_renderChatHistory_OLD`, `_appendChatMessage_OLD`, `_minimizeChat_OLD`, `_sendSidebarChatMessage_OLD`, `_renderSidebarChatSnippet_OLD`, `_showSourcePreview_OLD`
   - `_startQuiz_OLD`, `_renderQuizStep_OLD`, `_handleQuizAnswer_OLD`, `_showQuizResult_OLD`, `_renderPassport_OLD`, `_closePassport_OLD`, `_closeQuizAndGoBack_OLD`
   - Also remove orphaned `handleSidebarChatKey` (not delegated yet)

2. **Update `sw.js` ASSETS list** to include the new controller files:
   - Add `./js/features/chat-controller.js`
   - Add `./js/features/quiz-controller.js`
   - Update `main.js?v=5` → `main.js?v=6`
   - Bump cache version to `v8`

3. **Fix theme `SecureStorage`**: Update `initTheme`, `toggleTheme`, and `applyTheme` to use `this.secureStorage.getItem/setItem('ckm_theme')` instead of raw `localStorage`.

### Step 2: Extract MedicationController *(Largest Module)*
**Estimated reduction: −713 lines**

1. Create `js/features/medication-controller.js` with:
   - All 14 medication functions (lines 1320–1924)
   - `renderMetricsDashboard` (lines 1927–1993)
   - `renderStageExplorer` (lines 1995–2036)

2. Replace original methods in `main.js` with thin delegation stubs.

3. Add `data-action` entries for new delegated methods.

4. Add `<script>` tag to `index.html` and cache entry in `sw.js`.

### Step 3: Extract AnalogyController *(Second-Largest)* - COMPLETE
**Estimated reduction: −580 lines**

1. Create `js/features/analogy-controller.js` with:
   - `renderAnatomy`, `renderAnalogyAnimation`, `showMyth`
   - `getAnalogySVGForSlide`, `getHouseAnalogySVG`
   - `toggleClinicalNote`, `updateAnalogyControl`, `toggleAnalogyControl`, `calculateAnalogyBonus`

2. Replace in `main.js`, add script tag and cache entry.

### Step 4: Extract FoodController + MovementController *(Remaining Modules)*
**Estimated reduction: −882 lines**

1. Create `js/features/food-controller.js` with:
   - `renderFoodLabel`, `getFoodLabelSVGForSlide` (food labels)
   - `renderEatingPlateAnimation`, `getEatingPlateSVGForSlide` (eating plate)
   - `renderCulturalFoodExplorer`, `getFoodStatusColor`, `getImpactColor`, `toggleEatingDetails`

2. Create `js/features/movement-controller.js` with:
   - `renderMovementExplorer`, `getMovementVisual`, `generateTailoredPlan`

3. Move `initChatInteraction` + `snapToCorner` into `chat-controller.js`.

4. Replace in `main.js`, add script tags and cache entries.

5. Final cleanup: remove any leftover comments or unused variables.

---

## Execution Order

```
Step 1 ──────► Step 2 ──────► Step 3 ──────► Step 4
Remove OLD      Medication     Analogy        Food + Movement
+ Fix SW/Theme  Controller     Controller     Controllers
(−556 lines)    (−713 lines)   (−580 lines)   (−882 lines)
```

## Expected Final Architecture

```
main.js (~800 lines - Core orchestration only)
├── App initialization & state
├── Navigation & routing
├── Theme management
├── Language loading
├── Modal & focus management
├── Utility functions
└── Controller delegation stubs

js/features/
├── chat-controller.js        (~300 lines)
├── quiz-controller.js         (~240 lines)
├── medication-controller.js   (~713 lines)  NEW
├── analogy-controller.js      (~580 lines)  NEW
├── food-controller.js         (~670 lines)  NEW
├── movement-controller.js     (~212 lines)  NEW
├── curriculum-controller.js   (~150 lines)  existing
└── curriculum-renderers.js    (~700 lines)  existing
```

## Risk Mitigations

1. **Backward Compatibility:** All delegation stubs preserve the existing `data-action` interface, so no UI changes are needed.
2. **Incremental Delivery:** Each step is self-contained and testable independently.
3. **State Sharing:** Controllers share state via the `app` object reference, same pattern as Phase 3.
4. **Rollback:** If any step causes issues, the delegation stub can be replaced with the original code.

---

## Execution Status

- [ ] Step 1: Remove `_OLD` code + Fix SW + SecureStorage theme
- [ ] Step 2: Extract MedicationController
- [ ] Step 3: Extract AnalogyController
- [ ] Step 4: Extract FoodController + MovementController

---

*Ready to execute on user approval.*

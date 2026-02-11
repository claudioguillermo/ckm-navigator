# Production Readiness Plan: Refactoring & Stabilization

**Date:** 2026-02-11
**Objective:** Finalize codebase refactoring, resolve missing dependencies, restore "Doctor Passport" functionality, and polish UX/Accessibility for production launch.

---

## Phase 1: Codebase Hygiene & Stabilization (P0)
**Goal:** Fix broken references, remove dead code, and restore critical features.

1.  **Fix Missing Controller References**:
    *   **Issue**: `checklist-controller.js` and `stage-explorer-controller.js` are referenced in `index.html` and `sw.js` but do not exist on disk.
    *   **Fix**:
        *   Remove `<script>` tags from `index.html`.
        *   Remove entries from `sw.js` ASSETS list.
        *   Verify functionality (Stage Explorer is delegated to `MedicationController`, Checklist might be defunct or subsumed).

2.  **Restore "Doctor Passport" Feature**:
    *   **Issue**: `QuizController` contains `renderPassport()` logic, but it is unreachable (no button invokes it).
    *   **Fix**:
        *   Update `showQuizResult()` in `js/features/quiz-controller.js` to include a "View Passport" button.
        *   Ensure "Close" button in Passport modal correctly dismisses it.
        *   Add `data-action` to `main.js` or `ActionDispatcher` to handle `renderPassport`.

3.  **Verify Secure Storage Implementation**:
    *   **Status**: Confirmed `initTheme` uses `SecureStorage`.
    *   **Action**: Ensure `QuizController` also uses `SecureStorage` for stage persistence (Code review shows it does: `await this.app.secureStorage.setItem('ckm_stage', stage)`).

---

## Phase 2: Modularization - Core Features (P1)
**Goal:** Complete the decomposition of `main.js` by extracting remaining feature logic.

1.  **Extract `FoodController`**:
    *   **Source**: `main.js` (lines ~1031-1318).
    *   **New File**: `js/features/food-controller.js`.
    *   **Methods**: `renderFoodLabel`, `getFoodLabelSVGForSlide`, `renderEatingPlateAnimation`, `getEatingPlateSVGForSlide`, `renderCulturalFoodExplorer`.
    *   **Action**: Move code, update `main.js` to delegate, update `index.html` and `sw.js`.

2.  **Extract `MovementController`**:
    *   **Source**: `main.js` (lines ~817-1029).
    *   **New File**: `js/features/movement-controller.js`.
    *   **Methods**: `renderMovementExplorer`, `getMovementVisual`, `generateTailoredPlan`.
    *   **Action**: Move code, update `main.js` to delegate, update `index.html` and `sw.js`.

---

## Phase 3: Modularization - Interaction Logic (P2)
**Goal:** Consolidate chat interactions and remove UI logic from `main.js`.

1.  **Extract Chat Interactions**:
    *   **Source**: `main.js` (`initChatInteraction`, `snapToCorner`).
    *   **Destination**: `js/features/chat-controller.js`.
    *   **Action**: Move logic, ensuring event listeners are correctly bound to the controller instance.

---

## Phase 4: UX & Accessibility Polish (P2)
**Goal:** Ensure the application is accessible and user-friendly.

1.  **Accessibility (A11y)**:
    *   Add `aria-labels` to all interactive elements (especially icon-only buttons like Theme Toggle, Chat Toggle).
    *   Implement "Skip to Content" link (partially present in HTML, verification needed).
    *   Ensure focus management when opening/closing modals (Passport, Quiz).

2.  **Keyboard Navigation**:
    *   Verify Tab order in all modules (Grid, Quiz, Dashboard).
    *   Ensure "Enter" key triggers actions on focused elements.

3.  **Visual Polish**:
    *   Verify "Team" category rendering (completed in Phase 4, needing re-verification after refactor).
    *   Check responsive layout on small screens.

---

## Execution Strategy

1.  **Execute Phase 1 immediately**: This unblocks the "Production Ready" state by fixing broken references and restoring the Passport feature.
2.  **Execute Phase 2 & 3 sequentially**: To keep changes manageable and testable.
3.  **Execute Phase 4**: As the final polish before "Launch".

**Estimated Effort**:
*   Phase 1: 1-2 hours
*   Phase 2: 2-3 hours
*   Phase 3: 1 hour
*   Phase 4: 2-3 hours

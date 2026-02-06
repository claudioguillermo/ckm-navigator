# EMPOWER-CKM Content Enrichment Plan

## Executive Summary
This plan outlines the strategy to deepen user engagement and interactivity within the CKM Navigator application. Building upon the recent content audit, we will focus on transforming static educational content into personalized, interactive experiences.

**Key Technical Strategy:** We will leverage the existing "Mount Point" architecture in `main.js` (e.g., `<div id="...-mount">`) to inject new interactive components without disrupting the core application flow.

## Phase 1: Interactive & Personalized Health (Immediate Impact)

### 1.1 "My CKM Plan" Generator (New Feature)
**Concept:** A persistent, personalized action plan that aggregates choices made throughout the modules.
*   **Implementation:**
    *   **Data Source:** Uses `secureStorage` to save user selections.
    *   **Integration:**
        *   **Module 2 (Diet):** "Select 2 vegetable swaps you will try this week."
        *   **Module 3 (Movement):** "Commit to a specific time for your 5-minute walk."
    *   **Output:** A new sidebar tab "My Plan" that shows a checklist of committed actions.
    *   **Technical:** New `renderMyPlan()` function in `main.js`.

### 1.2 Enhanced Medication Decision Aid
**Concept:** Upgrade the existing "My Medications" feature from a simple list to a decision support tool.
*   **Features:**
    *   **Side-by-Side Comparison:** If a user selects multiple meds in same class, show comparison.
    *   **"Ask Your Doctor" Generator:** Dynamic list of questions based on *specifically selected* medications (e.g., "Since I'm taking Lisinopril, should I worry about potassium?").
    *   **Cost Estimator:** Integrate the generic/GoodRx pricing tiers found in the audit into a visual "Cost Calculator".
*   **Technical:** Enhance `renderMyMedications()` in `main.js`.

### 1.3 Knowledge Checks (Gamification)
**Concept:** Replaces the passive "Finish Lesson" button with a 1-question "Key Takeaway" challenge to ensure comprehension.
*   **Implementation:**
    *   **Micro-Quizzes:** At the bottom of each module, before completion.
    *   **Reward:** Correct answer triggers a "Confetti" animation (already in `celebrate` function).
*   **Technical:** Modify `renderModule` loop in `main.js` to conditionally show quiz before completion button.

## Phase 2: Content Expansion (High Value Add)

### 2.1 "Living with CKM" - Patient Personas
**Concept:** Since video production is resource-intensive, we will create "Digital Personas" — narrative stories of recurring characters.
*   **Personas:**
    *   *Maria (Stage 2):* Focused on diet and family cooking.
    *   *Robert (Stage 3):* Focused on medication management and monitoring.
    *   *Sam (Stage 1):* Young, focused on prevention and fitness.
*   **Format:** Interactive "Story Cards" where users make choices for the character (e.g., "What should Maria order at the restaurant?") and see the CKM outcome.

### 2.2 Cultural Food Database Expansion
**Concept:** Expand the "Traditional Food Spotlight" into a searchable, filterable database.
*   **Features:**
    *   **Filters:** "Low Sodium", "Kidney Friendly", "Budget".
    *   **New Regions:** Add Caribbean and West African staples (common in target demographics).
*   **Technical:** Move food data from `en.json` to a dedicated `data/foods.json` for easier scalability.

### 3. Safety & Metrics Tracker
**Concept:** A simple logbook for the "Big Numbers".
*   **Features:**
    *   **Input:** Weight, BP, A1C.
    *   **Visual:** Simple trend line (SVG).
    *   **Feedback:** Immediate color-coded feedback based on CKM Staging guidelines (e.g., BP > 130/80 turns yellow).

## Implementation Roadmap

| Feature | Complexity | Files Affected | Priority |
| :--- | :--- | :--- | :--- |
| **Knowledge Checks** | Low | `main.js`, `locales/*.json` | High |
| **My CKM Plan** | Medium | `main.js`, `secure-storage.js` | High |
| **Medication Decision Aid** | High | `main.js`, `locales/*.json` | Medium |
| **Patient Personas** | Medium | `assets/`, `en.json` | Medium |
| **Metrics Tracker** | High | `main.js`, `secure-storage.js` | Low |

## Next Steps
1.  **Approval:** Confirm this plan matches the user's vision.
2.  **Prototype:** Implement the **Knowledge Checks** first as a proof-of-concept for deeper interactivity.
3.  **Content Creation:** Draft the text for the "Micro-Quizzes" and "Patient Personas".

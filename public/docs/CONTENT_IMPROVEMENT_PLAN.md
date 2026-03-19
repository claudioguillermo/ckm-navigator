# Content Improvement Plan - January 20, 2026

## Objective
Implement evidence-based refinements to educational content based on the Medical Content Audit.

## Planned Changes

### 1. High Priority: Safety & Disclaimers
- **Module 6 (Staging Quiz)**:
  - Rename "Staging Quiz" to "Risk Assessment".
  - Add prominent disclaimer: "This is an EDUCATIONAL ESTIMATE ONLY. Your actual CKM stage can only be determined by your healthcare provider with proper testing."
- **Medication Warnings**:
  - **GLP-1 Agonists**: Add Boxed Warning for Thyroid C-cell tumors. Add Gallbladder disease to side effects.
  - **SGLT-2 Inhibitors**: Add note about rare genitourinary infections (Fournier's gangrene).

### 2. Medium Priority: Nuance & Accuracy
- **Dietary Claims**:
  - Reframe "Food is the strongest medicine" to "Food is a powerful tool".
  - Soften "Flour tortillas spike sugar as fast as table sugar" to "Refined flour raises blood sugar quickly".
- **Exercise Claims**:
  - Clarify blood sugar drops from walking (add "may", range 10-30%).
  - Change "Reverses insulin resistance" to "Improves insulin sensitivity".

### 3. Low Priority: General Polish
- Update "Will add years" to "May help reduce risks".
- Ensure "Don't know" options are clear in quiz (already present).

## Implementation Strategy
- All text changes will be applied to `locales/en.json` to ensure they populate across the application.
- No structural code changes are required.

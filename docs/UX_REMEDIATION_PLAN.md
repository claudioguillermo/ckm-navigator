# UX/UI Remediation Plan

Based on the audit report, the following phased approach will be used to resolve issues.

## 🚨 Phase 1: Critical Fixes & Accessibility Core
**Objective**: Resolve breaking bugs and ensure WCAG 2.1 AA compliance basics.

1.  **Fix Keyframe Syntax (KF-001)**: Correct invalid `0 %` CSS in `main.js` to restore animations.
2.  **Semantic Navigation (A11Y-002)**: Replace `<div class="nav-item">` with `<button>` in `index.html`.
3.  **ARIA Landmarks (A11Y-001)**: Add `role="banner"`, `role="navigation"`, etc., to `index.html`.
4.  **Focus Management (A11Y-003)**: Implement focus trapping for Modals and Chat.
5.  **Interactive Elements**: Ensure all buttons have keyboard access and visible focus states.

## 🛠️ Phase 2: High Priority Visuals & Layout
**Objective**: Fix layout chaos and visual bugs affecting usability.

1.  **Z-Index Standardization (RESP-001)**: Implement a strict z-index scale in `styles/main.css`.
2.  **Mobile Safe Area (RESP-002)**: Update `.content-area` to use `env(safe-area-inset-bottom)`.
3.  **Color Contrast (A11Y-004)**: Darken text colors to meet 4.5:1 ratio.
4.  **Duplicate Keyframes (ANIM-001)**: Remove redundant animations to reduce CSS bloat.

## 🎨 Phase 3: Medium Priority Standardization
**Objective**: Unite design tokens for consistency.

1.  **Border & Spacing Variables (VIS-001/003)**: audit CSS to replace pixel values with `--radius-*` and `--space-*`.
2.  **Typography Scale (VIS-002)**: Add missing `--text-xs` and `--text-3xl` variables.
3.  **Chat Animation (RESP-005)**: Standardize mobile chat sidebar entry animation.

## ✨ Phase 4: Low Priority Polish
**Objective**: Clean code and final polish.

1.  **Shadow Consistency (VIS-004)**: Standardize box-shadows.
2.  **Animation Timing (VIS-005)**: Unify easing functions.
3.  **Code Cleanup (RESP-006)**: Remove orphaned comments.

---

**Ready to start?** The recommended next step is to execute **Phase 1**.

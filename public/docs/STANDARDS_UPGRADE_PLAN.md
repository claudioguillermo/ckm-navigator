# Standards Conformance Upgrade Plan

Based on the `STANDARDS_CONFORMANCE_AUDIT.md`, this plan addresses the identified gaps to modernize the EMPOWER-CKM Navigator.

### Phase 1: **Dark Mode & Color System (Critical)**
- **Status**: [x] Complete (Jan 22, 2026)
- **Goal**: Full Dark Mode support with semantic colors and OKLCH.
- **Tasks**:
  - [x] Refactor `:root` to use Semantic Variables (Surface, Text, Border).
  - [x] Implement `@media (prefers-color-scheme: dark)` overrides.
  - [x] Enable automatic system preference following in JS.
  - [x] Adopt `oklch()` for perceptually uniform accents.
  - [x] Update `meta theme-color` for dynamic status bar matching.
  - [x] Refactor Hardcoded Hex in JS to CSS Variables.

## 📦 Phase 2: Advanced Responsiveness (High)
**Objective**: Utilize configured Container Queries and optimize Core Web Vitals.

1.  **Activate Container Queries**: Implement `@container` rules for `.soft-card` to adapt content based on card width (not screen width).
2.  **Resource Prioritization**: Add `<link rel="preload">` strategies for critical fonts and CSS.
3.  **IntersectionObserver**: specific observer for efficient on-scroll animations of modules.

## 📱 Phase 3: PWA Completeness (High)
**Objective**: Upgrade the Web Manifest to "Store-Ready" quality.

1.  **Manifest Enrichment**: Add `id`, `screenshots`, `shortcuts`, and `categories`.
2.  **Icon Audit**: Ensure maskable icons are defined.
3.  **Service Worker**: Verify "Update on Reload" UX handles the new manifest fields correctly.

## 🧼 Phase 4: Modern CSS Refactoring (Medium)
**Objective**: Improve code maintainability.

1.  **CSS Nesting**: Refactor `main.css` to use native nesting (e.g., `.card { &:hover { ... } }`).
2.  **Organization**: Group styles by component using the nested structure.

---

**Next Step**: The recommended immediate action is **Phase 1: Dark Mode & Color System**.

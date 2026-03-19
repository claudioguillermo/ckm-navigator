# Implementation Plan for Standards Gaps
**Based on**: `STANDARDS_IMPLEMENTATION_VERIFICATION.md`  
**Date**: January 22, 2026

---

## Overview
The verification report reveals that while we've made progress, several critical gaps remain. This plan prioritizes fixes that will move us from **56% → 85%+ completion** across all phases.

---

## TIER 1: Critical Fixes (Must Complete)

### 1.1 CSS `prefers-color-scheme` Media Query
**Status**: ❌ Not Implemented  
**Impact**: High (Accessibility & UX)  
**Effort**: Low  

**Action**:
- Copy the `[data-theme='dark']` variable overrides to a new `@media (prefers-color-scheme: dark)` block
- This allows the app to respect system dark mode preference by default
- Manual toggle will still override

**Files**: `styles/main.css`

---

### 1.2 Enable System Preference Listener
**Status**: ⚠️ Commented Out  
**Impact**: Medium (UX)  
**Effort**: Trivial  

**Action**:
- Uncomment the `applyTheme()` call in the `matchMedia` listener (main.js line 4283)
- Check: Only apply if no explicit user preference exists

**Files**: `main.js`

---

### 1.3 Update Documentation Accuracy
**Status**: ❌ Misleading  
**Impact**: High (Project Management)  
**Effort**: Trivial  

**Action**:
- Update `STANDARDS_UPGRADE_PLAN.md` Phase 1 status to reflect actual state
- Uncheck "prefers-color-scheme media query" task

**Files**: `STANDARDS_UPGRADE_PLAN.md`

---

## TIER 2: High-Priority Enhancements

### 2.1 Font Preloading
**Status**: ❌ Missing  
**Impact**: High (Performance, CLS)  
**Effort**: Low  

**Action**:
```html
<link rel="preload" href="https://fonts.gstatic.com/s/inter/v12/..." as="font" type="font/woff2" crossorigin>
```

**Files**: `index.html`

---

### 2.2 Expand Container Query Usage
**Status**: ⚠️ Only 1 Rule  
**Impact**: Medium (Responsiveness)  
**Effort**: Medium  

**Action**:
- Add `@container view` rules for education modules at different widths
- Add `@container card` rules for grid layouts within cards
- Example:
  ```css
  @container view (max-width: 800px) {
      .module-grid { grid-template-columns: 1fr; }
  }
  ```

**Files**: `styles/main.css`

---

### 2.3 IntersectionObserver for Lazy Loading
**Status**: ❌ Not Implemented  
**Impact**: High (Performance, LCP)  
**Effort**: Medium  

**Action**:
- Implement `IntersectionObserver` for images in education modules
- Trigger scroll animations on view entry
- Pattern:
  ```javascript
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('animate-fade-in');
          }
      });
  });
  
  document.querySelectorAll('.lazy-animate').forEach(el => observer.observe(el));
  ```

**Files**: `main.js`

---

## TIER 3: Medium-Priority Polish

### 3.1 Expand CSS Nesting
**Status**: ⚠️ Only 3 Instances  
**Impact**: Medium (Maintainability)  
**Effort**: Medium-High  

**Action**:
- Refactor `.soft-card`, `.btn`, `.modal`, `.chat-sidebar` to use nesting
- Target: Convert 50+ traditional selectors to nested structure
- Example:
  ```css
  .soft-card {
      background: var(--bg-card);
      
      &:hover {
          transform: translateY(-6px);
      }
      
      &::before {
          content: '';
          opacity: 0;
      }
  }
  ```

**Files**: `styles/main.css`

---

### 3.2 Adopt `color-mix()` for Dynamic Colors
**Status**: ❌ Not Implemented  
**Impact**: Low (Code Quality)  
**Effort**: Low  

**Action**:
- Replace manual opacity/alpha values with `color-mix()`
- Example: `background: color-mix(in oklch, var(--accent-red), white 80%);`

**Files**: `styles/main.css`

---

### 3.3 `content-visibility` Optimization
**Status**: ❌ Not Implemented  
**Impact**: Medium (Performance on large pages)  
**Effort**: Low  

**Action**:
- Add `content-visibility: auto` to education modules
- Example:
  ```css
  .module-fullwidth {
      content-visibility: auto;
      contain-intrinsic-size: auto 500px;
  }
  ```

**Files**: `styles/main.css`

---

## TIER 4: Optional Enhancements

### 4.1 Badging API for Notifications
**Status**: ❌ Not Implemented  
**Impact**: Low (PWA Polish)  
**Effort**: Low  

**Action**: Skip unless user requests. Limited browser support.

---

### 4.2 Web Notifications API
**Status**: ❌ Not Implemented  
**Impact**: Low (Medical app may not need)  
**Effort**: Medium  

**Action**: Defer to future version.

---

### 4.3 ES Modules Migration
**Status**: ❌ Not Implemented  
**Impact**: Medium (Code Architecture)  
**Effort**: Very High  

**Action**: **Out of scope** for this iteration. Requires full refactor.

---

### 4.4 Mobile-First Media Query Refactor
**Status**: ❌ Desktop-First  
**Impact**: Low (Current approach works)  
**Effort**: High  

**Action**: Defer. No user-facing benefit given existing responsive design.

---

## Implementation Order

1. **Week 1** (Tier 1): Critical Fixes
   - CSS media query
   - Enable JS listener
   - Update docs
   
2. **Week 2** (Tier 2): High-Priority
   - Font preload
   - Container queries
   - IntersectionObserver
   
3. **Week 3** (Tier 3): Polish
   - CSS nesting expansion
   - `color-mix()` adoption
   - `content-visibility`

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Overall Conformance | 56% | 85% |
| Phase 1 Completion | 60% | 95% |
| Phase 2 Completion | 25% | 75% |
| Phase 3 Completion | 70% | 85% |
| Phase 4 Completion | 10% | 50% |

---

## Approval Required

Should I proceed with **Tier 1** implementation immediately?

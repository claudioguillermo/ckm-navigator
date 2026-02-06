# Global Dark Mode Remediation Plan

## Problem Identification
Despite previous fixes, specific UI components contain "hardcoded" styles injected via JavaScript or specific CSS rules that do not adapt to Dark Mode. This results in:
1.  **"Flashbang" Cards**: Components with hardcoded light backgrounds (`#e3f2fd`, `#ffebee`) that remain bright white/pastel in Dark Mode.
2.  **Invisible Text**: Hardcoded dark text (`#1565c0`, `#c62828`) on dark backgrounds (if container backgrounds are fixed but text isn't).
3.  **Inconsistent UI**: Elements like the Skeleton Loader and Progress Bars using fixed grays (`#F2F2F7`) instead of semantic depth colors.

## 1. Inventory of Hardcoded Values

### A. Contextual Cards (Education Modules)
| Component | Current Hardcoded Hex | Proposed Variable |
|-----------|-----------------------|-------------------|
| **Info Card Background** | `#e3f2fd` (Light Blue) | `--bg-info-subtle` |
| **Info Title Text** | `#1565c0` (Dark Blue) | `--text-info-strong` |
| **Danger Card Background** | `#ffebee` (Light Red) | `--bg-danger-subtle` |
| **Danger Title/List Text** | `#c62828` (Dark Red) | `--text-danger-strong` |
| **Success Background** | `#E8F9EE` (Light Green) | `--bg-success-subtle` |
| **Success Border** | `rgba(52, 199, 89, 0.2)` | `--border-success-subtle` |

### B. UI Utilities
| Component | Current Hardcoded Hex | Proposed Variable |
|-----------|-----------------------|-------------------|
| **Progress Track** | `#F2F2F7` | `--bg-depth` |
| **Skeleton Loader** | `#f8f9fa` | `--bg-skeleton` |
| **Nutrition Label Border** | `#000` | `--border-strong` |
| **Nutrition Label BG** | `#fff` | `--bg-card` |
| **Tip Box Gradient** | `#f0f9ff` -> `#e0f2fe` | `--bg-gradient-info` |

### C. Text Colors
| Component | Current Hardcoded Hex | Proposed Variable |
|-----------|-----------------------|-------------------|
| **Status "Good"** | `#2e7d32` | `--system-green` |
| **Status "Bad"** | `#dc2626` | `--system-red` |

## 2. Implementation Strategy

### Step 1: Define New Semantic Variables in `styles/main.css`
We need to extend our variable system to support these "subtle" surfaces that handle tinting differently in Light vs. Dark mode.

**Light Mode (`:root`)**:
```css
/* Contextual Subtles */
--bg-info-subtle: #e3f2fd;
--text-info-strong: #1565c0;
--bg-danger-subtle: #ffebee;
--text-danger-strong: #c62828;
--bg-success-subtle: #E8F9EE;
--border-success-subtle: rgba(52, 199, 89, 0.2);
--bg-skeleton: #f8f9fa;
--border-strong: #000000;
```

**Dark Mode (`@media (prefers-color-scheme: dark)`)**:
```css
/* Contextual Subtles - Adjusted for dark readability */
--bg-info-subtle: rgba(21, 101, 192, 0.15); /* Low opacity blue */
--text-info-strong: #90caf9; /* Light blue text */
--bg-danger-subtle: rgba(198, 40, 40, 0.15); /* Low opacity red */
--text-danger-strong: #ef9a9a; /* Light red text */
--bg-success-subtle: rgba(52, 199, 89, 0.15); /* Low opacity green */
--border-success-subtle: rgba(52, 199, 89, 0.3);
--bg-skeleton: #2C2C2E;
--border-strong: #FFFFFF;
```

### Step 2: Refactor `main.js` (Bulk Replacement)
Use `multi_replace_file_content` to find specific hex strings in `contentHTML` strings and style blocks and replace them with the new variables.

### Step 3: Refactor `styles/main.css` (Cleanup)
Ensure any lingering hardcoded hexes in the CSS file itself are also mapped.

## 3. Verification Plan
1.  **Visual Check**: Open the "Medication Class" module (contains Info/Danger cards).
2.  **Visual Check**: Open "Your Plate" module (contains gradients/nutrition labels).
3.  **Toggle Theme**: Verify cards switch from "Pastel BG + Dark Text" to "Dark Translucent BG + Light Text".

---
**Status**: Ready to Execute.
**Estimated Impact**: Will resolve remaining "untouched" light-mode elements.

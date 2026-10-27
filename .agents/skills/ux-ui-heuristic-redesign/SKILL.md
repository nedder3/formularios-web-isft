---
name: ux-ui-heuristic-redesign
description: >-
  Use this skill when the user asks to analyze, propose, or execute a UX/UI redesign applying Laws of UX, Jakob Nielsen's usability heuristics, WCAG accessibility, performance optimization, and selecting or proposing an aesthetic visual style (such as Bento Grid, Glassmorphism, Liquid Glass, Brutalism, Minimalism, Neo-Futurism, Maximalism, Claymorphism, or Spatial UI) without losing the project's core brand identity.
---

# UX/UI Laws, Heuristics, Accessibility & Aesthetic Style Redesign

This skill guides the evaluation and redesign of web interfaces using cognitive psychology (Laws of UX), usability heuristics, accessibility standards (WCAG 2.1 AA), and modern visual design systems while strictly respecting the brand's color tokens and institutional/product identity.

---

## 1. Cognitive Laws of UX Checklist

Evaluate every user flow and form step against these foundational laws:

1. **Law of Proximity & Gestalt Grouping:**
   - Group related fields into visually distinct semantic blocks (e.g., *Personal Identity* vs *Contact Channel*; *Cascading Filter* vs *Course Details*).
   - Ensure the DOM and visual order match the user's natural mental model (never place secondary modifiers in the middle of a primary parent-child cascade).
2. **Hick-Hyman Law (Decision Time):**
   - Reduce cognitive load in long dropdowns or multi-option selectors by progressive disclosure, clear categorization, search/filter inputs, or `<datalist>` suggestions.
3. **Fitts's Law (Touch Target Acquisition):**
   - Guarantee interactive controls, pills, and primary CTA buttons have a minimum touch target height of `46px–48px` with adequate spacing on mobile viewports.
4. **Goal-Gradient Effect:**
   - Provide clear progress feedback in multi-step wizards, including an active context summary pill (e.g., *"Active Profile: Name • ID • [Edit]"*) when advancing to subsequent steps.
5. **Peak-End Rule:**
   - Make the completion state (receipt, confirmation, or summary screen) rewarding, unambiguous, and reassuring—including a cumulative session history when users perform repeated transactions.

---

## 2. Jakob Nielsen's Usability Heuristics

- **H1 — Visibility of System Status:** Explicitly notify the user when draft data is auto-restored from `localStorage` or when async operations are in progress.
- **H3 — User Control and Freedom:** Always provide a one-click *"Clear saved data / Switch user"* action when pre-filling forms from local storage (essential on shared/public terminals) and allow direct step navigation back to completed steps.
- **H5 — Error Prevention & H9 — Error Recovery:** Validate inputs inline on `blur`/`input`, auto-sanitize predictable formatting issues (such as stripping dots/spaces from numeric IDs as the user types), and attach field-specific error messages rather than relying solely on a generic banner.
- **H6 — Recognition Rather Than Recall:** Surface previously entered values in the current session (e.g., recent professor names or selected career) and display human-readable labels alongside codes.

---

## 3. Accessibility (WCAG 2.1 Level AA) & Optimization

- **Programmatic Focus Management:** When transitioning between wizard steps or views without a full page reload, move focus (`element.focus()`) to the new step heading (`tabindex="-1"`).
- **Semantic ARIA Wiring:**
  - Mark the active wizard step with `aria-current="step"`.
  - Connect inputs to hints and error messages via `aria-describedby` and toggle `aria-invalid="true"` on validation failure.
  - Use `role="alert"` or `aria-live="polite"` on dynamic feedback banners.
- **Motion & Contrast:** Respect `@media (prefers-reduced-motion: reduce)` and maintain $\ge 4.5:1$ text contrast ratios across all surfaces (especially over translucent/glass backgrounds).

---

## 4. Aesthetic Style Evaluation & Proposal

When proposing a visual direction, evaluate the candidate styles against the project's domain, target audience, and embedding constraints (see [aesthetic-styles-catalog.md](./references/aesthetic-styles-catalog.md) for the full catalog and CSS token recipes):

1. **Bento Grid Modular:** Best for dashboards, multi-step forms, and structured academic/enterprise portals. Organizes content into clean, rounded modular cells with subtle borders.
2. **Subtle Glassmorphism / Liquid Glass:** Best for modern headers, floating steppers, active pills, and overlays using `backdrop-filter: blur()`, specular `1px` borders, and tinted ambient shadows.
3. **Swiss Editorial / Neo-Brutalist Precision:** Best for official receipts, tickets, certificates, and data-dense tables using `tabular-nums` monospace typography, high-contrast hairline/dashed rules, and cryptographic badges.
4. **Minimalism / Neo-Academic Clean:** Best for high-accessibility public services and embedded `<iframe>` widgets requiring zero visual friction.
5. **Claymorphism / Neo-Futurism / Maximalism / Spatial UI:** Evaluate and explain trade-offs clearly; adopt selectively or hybridize so the core brand identity remains intact.

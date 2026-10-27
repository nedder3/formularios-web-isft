---
name: ux-ui-heuristic-redesign
description: >-
  Use this skill when the user asks to analyze, propose, or execute a UX/UI redesign applying Laws of UX, Jakob Nielsen's usability heuristics, WCAG accessibility, performance optimization, and dynamically evaluating and generating the optimal aesthetic visual style (such as Bento Grid, Glassmorphism, Liquid Glass, Brutalism, Minimalism, Neo-Futurism, Maximalism, Claymorphism, or Spatial UI) on the fly without losing the project's core brand identity.
---

# UX/UI Laws, Heuristics, Accessibility & Dynamic Style Redesign

This skill is **100% self-contained and portable**. It guides the agent to dynamically analyze any project's domain, audience, and brand identity, evaluate its interface against cognitive psychology (Laws of UX), usability heuristics, and WCAG 2.1 AA accessibility, and synthesize a bespoke, production-grade visual design system on the spot.

---

## 0. Anti-Generic / Zero-Emoji Craftsmanship Rule (Mandatory)

Never produce interfaces that look "AI-generated" or template-basic:
- **Zero System Emojis in UI:** Never use OS emojis (`ℹ️`, `🎓`, `📚`, `🔒`, `🖨️`, etc.) as interface icons. Always use crisp, monochromatic **inline SVG stroke icons** (`stroke="currentColor"`, `stroke-width="1.8"` to `2.2"`) that inherit the brand palette.
- **True Asymmetric Grids over Stacked Boxes:** Do not nest gray boxes vertically inside a giant white card and call it a Bento Grid. Use true multi-column asymmetric CSS Grids (`grid-template-columns: repeat(12, 1fr)` with `span 7` / `span 5` cells) where each cell is an independent architectural surface.
- **Custom Native Controls:** Replace default OS `<select>` arrows with custom SVG data-URI chevrons (`appearance: none`), use custom radio/checkbox indicators, and apply `font-variant-numeric: tabular-nums` on IDs, dates, and counters.
- **Typographic Contrast:** Pair a geometric/grotesque UI font (`Plus Jakarta Sans` or `Inter`, `-0.02em` tracking on headings) with a technical monospace font (`JetBrains Mono`) for section indices (`01.A // ...`), badges, and cryptographic receipts.

---

## 1. Cognitive Laws of UX Audit

Evaluate every user flow, screen, and form step against these foundational laws:

1. **Law of Proximity & Gestalt Grouping:**
   - Group related controls into visually distinct semantic containers (e.g., *Identity* vs *Contact*; *Cascading Selection* vs *Metadata*).
   - Align DOM order and visual flow strictly with the user's mental model (never interrupt a parent-child filter cascade with secondary options).
2. **Hick-Hyman Law (Decision Time):**
   - Minimize cognitive load in multi-option selectors via progressive disclosure, inline search/filtering, clear categorization, or `<datalist>` autocomplete suggestions.
3. **Fitts's Law (Touch Target Acquisition):**
   - Ensure interactive controls, selection pills, and primary CTAs have a minimum target height of `44px–48px` with comfortable spacing on mobile viewports.
4. **Goal-Gradient Effect:**
   - Provide clear progress indicators in multi-step flows and surface an active context summary bar (e.g., *"Active User / Profile • [Edit]"*) when advancing to subsequent steps.
5. **Peak-End Rule:**
   - Design completion states (receipts, confirmation screens, summaries) to be reassuring and memorable, including cumulative session history when users perform repeated transactions.

---

## 2. Jakob Nielsen's Usability Heuristics

- **H1 — Visibility of System Status:** Explicitly inform the user when draft data is auto-restored from `localStorage` or when background operations are running.
- **H3 — User Control and Freedom:** Provide a one-click *"Clear saved data / Switch user"* action whenever pre-filling forms from local storage (crucial on shared terminals) and allow direct navigation back to completed steps.
- **H5 — Error Prevention & H9 — Error Recovery:** Validate inputs inline on `blur`/`input`, auto-format predictable input patterns (e.g., stripping dots/spaces from numeric IDs as the user types), and display field-level error hints instead of relying solely on a generic bottom banner.
- **H6 — Recognition Rather Than Recall:** Surface previously entered values in the current session (e.g., recent values, active career/category) and display human-readable names alongside internal codes.

---

## 3. Accessibility (WCAG 2.1 Level AA) & Performance

- **Programmatic Focus Management:** When transitioning between wizard steps or dynamic views without a page reload, move focus (`element.focus()`) to the new step heading (`tabindex="-1"`).
- **Semantic ARIA Wiring:**
  - Mark the active step with `aria-current="step"`.
  - Link inputs to hints and error messages via `aria-describedby` and toggle `aria-invalid="true"` on validation failure.
  - Use `role="alert"` or `aria-live="polite"` on dynamic status containers.
- **Motion, Contrast & Print:** Respect `@media (prefers-reduced-motion: reduce)`, maintain $\ge 4.5:1$ contrast ratios across all surfaces (including translucent layers), and provide clean `@media print` rules for printable views.

---

## 4. Dynamic Aesthetic Style Evaluation & Generation

Do **not** rely on static templates. Dynamically evaluate the project's domain, target users, device constraints, and existing brand palette, then select or hybridize the optimal paradigm on the spot:

| Paradigm | Core Traits | Ideal Domain Fit | Dynamic CSS Synthesis Guidelines |
| :--- | :--- | :--- | :--- |
| **Bento Grid** | Asymmetric 12-column modular cells (`span 7` / `span 5`), clean `1px` borders, indexed micro-headers (`01.A`). | Multi-step forms, academic/fintech portals, SaaS dashboards, embedded widgets. | Generate CSS Grid cells (`border-radius: 14px–16px`, subtle borders, layered shadows) that group related inputs. |
| **Liquid Glass / Glassmorphism** | Translucent layered surfaces (`backdrop-filter: blur()`), specular border highlights, ambient shadows. | Sticky headers, wizard steppers, active selection pills, floating bars. | Synthesize translucent tokens (`rgba(255,255,255,0.86)`, `blur(14px)`) with high-contrast text and solid `@media print` fallbacks. |
| **Swiss Editorial / Soft Brutalism** | High-precision grids, dashed/hairline dividers, `tabular-nums` monospace metadata, verification stamps. | Official receipts, cryptographic tickets, certificates, data-dense logs. | Apply `font-variant-numeric: tabular-nums`, monospace transaction badges, and structured ticket borders. |
| **Minimalism** | Generous whitespace, restrained neutral slate palette, typography-driven hierarchy. | High-accessibility public services, documentation, distraction-free tools. | Use high-contrast neutral tokens (`#0f172a` on `#f8fafc`) with crisp focus rings. |
| **Claymorphism / Spatial UI / Neo-Futurism / Maximalism** | Soft 3D inner shadows (Clay), z-axis depth panels (Spatial), or kinetic high-energy gradients (Neo-Futurism). | Consumer onboarding, creative portfolios, immersive web apps, gaming. | Adopt selectively or hybridize micro-interactions while preserving the project's core brand colors and readability. |

### Execution Protocol
1. **Diagnose** the current UI against Sections 0–3.
2. **Select or Hybridize** the visual style from Section 4 that best elevates the product without altering its core brand colors or identity.
3. **Generate** the bespoke CSS tokens, custom SVG iconography, semantic HTML/component structure, and accessible micro-interactions directly in the codebase.

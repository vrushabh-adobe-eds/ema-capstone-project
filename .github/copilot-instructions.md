# Copilot Instructions — WKND → EDS Migration (EMA Capstone)

These instructions apply to **all** Copilot chats in this repo. The full brief lives in [`Instructions.md`](../Instructions.md) — read it before large tasks. Every suggestion must trace back to a goal or acceptance criterion there.

## Project context

- Migrating `wknd.site/us/en.html` and key pages into an **Adobe Edge Delivery Services (EDS)** site.
- **Content source is Document Authoring (da.live).** Blocks render as **tables** in DA — that is expected.
- Migration is driven **end‑to‑end by the Experience Modernization Agent (EMA)**: Site Scope → Design Migration → Page Migration → Navigation → Bulk Import → Block/Page Critique.
- Goal: **pixel‑practical, fully responsive** reproduction across mobile, tablet, desktop.

## Non‑negotiable guardrails

1. **EMA‑first.** Manual code only closes gaps EMA can't. Don't reinvent what EMA generates.
2. **Judge fidelity on the live/preview URL** (`*.aem.page` / `*.aem.live`), never the DA table view.
3. **Durable fixes go in parsers/CSS**, never one‑off DA doc edits — re‑imports overwrite doc edits.
4. **No direct commits to `main`.** Always feature branch → PR → review → merge.
5. **Lint must stay green** (`npm run lint` = ESLint + Stylelint).
6. **Block Collection first.** Only build a custom block when nothing fits; keep it minimal and have EMA critique it.
7. **Representative page before bulk import.** Prove a template at ~85 %+ critique before importing siblings.
8. Keep scope to WKND public pages — **no commerce, auth, MarTech/targeting, or custom business logic**.

## Coding standards

**Structure**
- Blocks live in `blocks/<name>/` as `<name>.js` + `<name>.css`. Global design lives in `styles/styles.css`. Runtime is `scripts/scripts.js` + `scripts/aem.js` (don't hand‑edit `aem.js` unless required).
- Localize images into `assets/` so they serve as optimized **`media_` hashes**.

**CSS**
- Put global tokens in `styles/styles.css` as CSS custom properties (`--color-*`, `--font-*`, `--spacing-*`) sampled from WKND.
- Scope block styles under `.<block-name>`; **no global bleed**.
- Mobile‑first breakpoints: base `< 600px`, `@media (width >= 600px)` tablet, `@media (width >= 900px)` desktop, optional `>= 1200px`. Match the source. **No horizontal overflow at any breakpoint.**

**JS**
- Default‑export `decorate(block)`; progressive enhancement only. No blocking network calls in the eager phase; defer non‑critical work to the delayed phase.
- Keep DOM semantic (`header`/`nav`/`main`/`article`/`footer`, ordered headings).

## Acceptance gates (protect on every change)

- **Performance (target 100):** LCP image eager (`fetchpriority="high"`), everything below‑fold lazy; responsive `<picture>`; set width/height or aspect‑ratio to avoid **CLS**. Keep **LCP ≤ 2.5s, CLS ≤ 0.1** ("good").
- **Accessibility (target 100):** meaningful `alt` on content images (`alt=""` only if decorative); logical headings; visible focus; keyboard‑operable; WCAG‑AA contrast; labelled forms.
- **Visual fidelity:** block & page critique **≥ ~85 %** vs. `wknd.site`.

## Git workflow

- Branch per unit of work (e.g. `feat/design-migration`, `feat/home-nav`, `feat/magazine-template`).
- One focused PR per change with a description linking the deliverable/criterion. Merge only green, reviewed PRs.

## When helping, prefer to

- Point back to the relevant section of `Instructions.md` for scope decisions.
- Suggest **parser/CSS** fixes over document edits for fidelity gaps.
- Reuse Block Collection patterns and existing tokens before adding new ones.
- Flag any change that risks LCP/CLS, alt‑text coverage, lint, or the no‑`main`‑commits rule.

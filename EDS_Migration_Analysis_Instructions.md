# Experience Modernization Agent — Analysis Instructions

## AEM → Edge Delivery Services (EDS) Migration Report Generator

> **Purpose:** Given a website URL (e.g. `https://wknd.site/us/en.html`), produce a complete migration analysis report covering site inventory, page scoping, template mapping, block inventory, reuse strategy, phased migration sequencing, status reconciliation, and crawl-gap discovery — ready to hand off to a development team for EDS migration execution.

---

## 1 · INPUT

The user provides:

| Required | Optional |
|----------|----------|
| Website domain (e.g. `https://wknd.site/us/en.html`) | Prior crawl/report data for reconciliation |
| | Known CMS platform (AEM, Sitecore, WordPress, etc.) — auto-detect if not provided |
| | Target EDS architecture preferences |
| | Brand guidelines / design-token source |

---

## 2 · ANALYSIS PIPELINE

Execute each stage sequentially. Every finding feeds into the final report.

### Stage 1 — Full Site Inventory & Crawl

**Objective:** Build the authoritative URL list. Do NOT rely solely on a breadth-first crawl — JavaScript-rendered sites and deep content trees cause severe under-counts.

**Steps:**

1. **Attempt XML sitemap discovery** — check `/sitemap.xml`, `/sitemap_index.xml`, and common CMS patterns. Record whether a sitemap exists.
2. **Breadth-first crawl** from the root URL. Record every URL touched.
3. **CMS content-tree extraction** (if applicable) — for AEM sites, derive inventory from the content node tree (`/content/` paths). For other CMSes, use equivalent API/export mechanisms.
4. **Reconcile crawl vs. content tree** — identify pages the crawler missed and why (JS-rendered content, unlinked utility nodes, sections absent from main navigation, deep-linked hubs).
5. **Live HTTP verification** — for every URL in the combined inventory, perform a live HTTP request. Record:
   - HTTP status code (200, 301, 302, 404, etc.)
   - Redirect target (if 3xx)
   - Whether client-side redirects exist (e.g. `<meta refresh>` tags)
   - Effective behaviour classification: `200-live`, `redirect-internal`, `redirect-external`, `404`, `soft-404`

**Output of this stage — the URL Master List:**

```
TOTAL URLS:          [count]
IN SCOPE:            [count]  (HTTP 200 AND not redirecting off-domain)
HTTP 200:            [count]
OFF-DOMAIN REDIRECTS:[count]
INTERNAL 301s:       [count]
```

**Scoping Rule:**
A URL is **in scope** if it returns HTTP 200 AND does not functionally redirect to an external brand/partner domain (even via client-side `<meta refresh>`). URLs that are server 3xx redirects to external sites, or HTTP 200 with client-side redirect to external domains, are **out of scope**.

---

### Stage 2 — Scope by Section

**Objective:** Break the in-scope inventory into logical site sections.

1. Derive sections from the URL path structure (first or second path segment).
2. For each section, count:
   - **Total** URLs
   - **In Scope** URLs
   - **Redirect / Out** URLs
3. Sort sections by total URL count descending.

**Output format:**

```
| SECTION              | TOTAL | IN SCOPE | REDIRECT / OUT |
|----------------------|-------|----------|----------------|
| Heritage             | 108   | 107      | 1              |
| Search Redirect Hub  | 57    | 3        | 54             |
| Legal & Privacy      | 18    | 17       | 1              |
| Innovation           | 14    | 13       | 1              |
| Company              | 12    | 10       | 2              |
| Impact               | 7     | 6        | 1              |
| ...                  |       |          |                |
```

---

### Stage 3 — Template Detection & Classification

**Objective:** Identify distinct page templates/layouts and map every in-scope URL to one.

**Method:**

1. **Visual + structural clustering** — group pages by shared DOM structure, layout patterns, and content zones.
2. **Name each template** descriptively (e.g. "Heritage Vehicle Detail", "Content/Article", "Section Hub/Landing", "Legal Text", "Homepage", "Form", "Utility").
3. **Count pages per template.**
4. **Identify primary blocks** each template uses (feeds into Stage 4).

**Output format:**

```
| #  | TEMPLATE                | PAGES | PRIMARY BLOCKS                        |
|----|-------------------------|-------|---------------------------------------|
| 1  | Heritage Vehicle Detail | 94    | Hero, Carousel (gallery), Specs table |
| 2  | Content / Article       | 32    | Hero, Columns, Cards, Quote           |
| 3  | Section Hub / Landing   | 14    | Hero, Cards (filterable), Stats band  |
| 4  | Heritage Brand Index    | 9     | Hero, Cards (vehicle-grid)            |
| 5  | Homepage                | 1     | Hero (video), Cards, Carousel, Embed  |
| 6  | Legal / Text            | 17    | Default content                       |
| 7  | Form                    | 2     | Form (AEM Forms), Default content     |
| 8  | Utility                 | 9     | Default content, Cards / link list    |
```

---

### Stage 4 — Block Inventory & Reuse Plan

**Objective:** Catalog every UI block/component on the site and decide whether to **Reuse**, **Variant**, or **Build** for EDS.

**Decision framework (R1 — Reuse before Build):**

| Decision | Meaning | When to apply |
|----------|---------|---------------|
| **Reuse** | Use an existing EDS Block Collection block as-is | Block exists in the EDS Block Collection and matches the site's requirements with no or trivial CSS changes |
| **Variant** | Existing block + brand CSS class / minor config | Block exists but needs a visual variant (different card style, carousel mode, column layout) |
| **Build** | Custom block or Forms workflow required | No existing block covers the functionality — must be authored from scratch |

**For each block, record:**

```
| BLOCK     | SOURCE                    | DECISION | NOTES                                                     |
|-----------|---------------------------|----------|-----------------------------------------------------------|
| Header    | Block Collection          | Reuse    | Site-wide nav — logo, mobile menu toggle, minimal top bar |
| Footer    | Block Collection          | Reuse    | Social row, multi-column links, author as fragment        |
| Hero      | Block Collection          | Variant  | Base hero + hero (video) full-bleed with overlay headline |
| Cards     | Block Collection          | Variant  | News, promo, vehicle-grid, EV cards. cards (news), cards (filterable) |
| Carousel  | Block Collection          | Variant  | Vehicle spotlight, heritage gallery, news slider. carousel (gallery), carousel (thumbnails) |
| Columns   | Block Collection          | Variant  | Brand showcase (2×2), split content, careers. columns (split), columns (teaser) |
| Quote     | Block Collection          | Reuse    | Executive/leadership pull-quotes on content pages         |
| Stats band| Custom                    | Build    | Numeric callouts (#1, 13, 2nd…) with footnote superscripts — start as columns (stats) |
| Embed     | Block Collection          | Reuse    | Interactive map (e.g. charger locator), background video  |
| Fragment  | Block Collection          | Reuse    | Shared legal disclosures, footnote panels, CTAs           |
| Form      | Block Party / AEM Forms   | Build    | Contact, email, accessibility request, privacy request    |
| Accordion | Block Collection          | Reuse    | "View important information" footnote/disclaimer panels   |
```

**Include a legend:**
- 🟢 **Reuse** — Block Collection as-is
- 🟡 **Variant** — existing block + brand CSS class
- 🔴 **Build** — custom block / Forms workflow

---

### Stage 5 — Migration Phases & Sequencing

**Objective:** Define a phased migration plan ordered by dependency, risk, and impact.

**Standard phase structure (adapt per site):**

| Phase | Name | Description | Page Count |
|-------|------|-------------|------------|
| **0** | **Foundations** | Extract design tokens (brand colors, type scale, spacing) into `styles/styles.css`. Establish `placeholders.json` for dynamic values (news feed, API endpoints, brand site URLs). Configure DA asset path; re-host PDFs/images. | — |
| **1** | **Global Elements** | Instrument site-wide **Header** and **Footer**. Author footer as a reusable fragment. | All |
| **2** | **Homepage** | Migrate the highest-fidelity page to validate the core block set and design tokens. | 1 |
| **3** | **Highest-Volume Template** | Build the single repeating template (e.g. vehicle detail: title + specs + gallery carousel) and bulk-import all pages. Largest single win. | [count] |
| **4** | **Second-Volume Template** | Migrate the next template cluster (e.g. brand index/landing pages with grid cards). | [count] |
| **5** | **Section Hubs & Content/Article** | Deploy hub/landing pages + content/article pages. Introduces new blocks (stats band, filterable cards, split columns, quote, map embed, news carousel). | [count] |
| **6** | **Legal / Text** | Migrate text-heavy legal and privacy pages. Minimal block complexity. | [count] |
| **7** | **Forms & Interactive** | Build custom form block(s) (contact, email signup, accessibility, privacy request, EV charger lookup). May require Block Party / AEM Forms integration. | [count] |
| **8** | **Utility & Cleanup** | Migrate remaining utility pages, implement redirect map for deprecated URLs, final QA pass. | [count] |

**Sequencing principles:**
1. Foundations and global elements are always Phase 0–1.
2. Homepage validates the design system early (Phase 2).
3. Order remaining phases by **page count descending** — biggest template wins first for maximum migration velocity.
4. Forms and interactive elements come late because they often have external dependencies.
5. Each phase should be independently deployable and testable.

---

### Stage 6 — Status Reconciliation

**Objective:** Compare prior inventory/report data (if available) against live HTTP re-checks to surface discrepancies.

**For each URL where prior status ≠ live status, record:**

```
| PATH                                    | PRIOR | LIVE HTTP | EFFECTIVE           |
|-----------------------------------------|-------|-----------|---------------------|
| /company/contact-us/email-alerts        | 200   | 302       | redirect-external   |
| /impact/driving-big-change/stem-education| 200  | 307       | redirect-internal   |
| /heritage/matchabdise                   | 200   | 301       | redirect-internal   |
| /copyright                              | 200   | 301       | redirect-internal   |
```

**Key reconciliation notes to flag:**
- Pages that were previously HTTP 200 but now redirect (content moved or retired)
- Search-redirect hub pages that return HTTP 200 but contain a client-side `<meta refresh>` to an external domain — these are functionally out-of-scope despite their 200 status
- Pages that have become 404 since the prior report

---

### Stage 7 — Discovery Notes & Crawl Gap Analysis

**Objective:** Explain why a standard breadth-first crawl under-counts and document the categories of missed pages.

**Standard miss categories to check for:**

| MISS CATEGORY | DESCRIPTION | APPROX. PAGES |
|---------------|-------------|---------------|
| JavaScript-rendered content | Pages whose content loads via JS frameworks (React, Angular, AEM Foundation/jQuery) and are invisible to a static crawler | [count] |
| CMS utility nodes unlinked from content | AEM utility nodes (search-redirect hub, config pages) not reachable from main navigation | [count] |
| Pages absent from main navigation | Content pages orphaned from the nav tree but still live | [count] |
| Deep section hubs not directly linked | Section landing pages (e.g. /impact/) reachable only through deep links or breadcrumbs | [count] |

**Always include a note explaining the methodology used to achieve full coverage** (e.g. "Full discovery requires the AEM content node tree — which this report is reconciled against").

---

## 3 · REPORT OUTPUT STRUCTURE

Generate the final report as an interactive HTML document (or structured Markdown) with these tabs/sections:

### Tab 1: Analysis
1. **Executive Summary** — headline metrics (Total URLs, In Scope, HTTP 200, Off-Domain Redirects, Internal 301s, Templates) in a card layout
2. **Key Corrections** — callout box for important scoping decisions or methodology notes
3. **Scope by Section** — table
4. **Template Inventory** — table with template name, page count, primary blocks
5. **Block Inventory & Reuse Plan** — table with Reuse/Variant/Build decisions and notes
6. **Status Reconciliation** — table of discrepancies (if prior data available)
7. **Discovery Notes & Why Crawling Under-counts** — explanation + miss-category table

### Tab 2: Migration Plan
1. **Migration Phases & Sequencing** — expandable/collapsible phase cards with phase name, description, page count
2. **Dependency Graph** — visual representation of phase dependencies
3. **Estimated Effort** — optional, if enough data to estimate

### Tab 3: Page Inventory
1. **Full URL list** — sortable/filterable table with columns: Path, Section, Template, HTTP Status, In Scope (Y/N), Redirect Target, Notes

---

## 4 · TECHNOLOGY DETECTION HEURISTICS

When auto-detecting the source CMS/framework, check for:

| Signal | Platform |
|--------|----------|
| `/content/dam/`, `/etc.clientlibs/`, AEM-specific headers | Adobe Experience Manager (AEM) |
| `wp-content/`, `wp-includes/`, WordPress REST API | WordPress |
| `/sitecore/`, Sitecore-specific cookies/headers | Sitecore |
| `_next/`, `__NEXT_DATA__` | Next.js |
| Drupal-specific classes, `/sites/default/files/` | Drupal |
| Contentful/Contentstack API calls in network | Headless CMS |

Record the detected platform in the Executive Summary.

---

## 5 · EDGE CASES & RULES

1. **Client-side redirects count as redirects.** If a page returns HTTP 200 but contains a `<meta http-equiv="refresh">` pointing to an external domain, classify it as `redirect-external` and mark it out-of-scope.

2. **Subdomains are out of scope** unless the user explicitly includes them. URLs redirecting to `investor.example.com`, `shop.example.com`, etc. are flagged as off-domain.

3. **Search/redirect hub pages** (e.g. `/search-redirect/*`) that exist solely to redirect users to partner sites are out-of-scope even if they appear in the CMS content tree.

4. **Fragment pages** (reusable content snippets intended for inclusion in other pages, not direct navigation) should be inventoried but flagged as fragments, not counted as standalone in-scope pages.

5. **PDF and media assets** are inventoried separately if the user requests an asset migration plan. By default, note their existence but exclude from page counts.

6. **Multilingual variants** — if the site has locale prefixes (`/en/`, `/es/`, `/fr/`), treat each locale as a separate section or report them in a dedicated Localization section.

---

## 6 · ADAPTIVE PROMPTS

The agent should adjust its analysis depth based on site size:

| Site Size | URL Count | Analysis Depth |
|-----------|-----------|----------------|
| Small | < 50 pages | Full manual review of every page. Detailed per-page notes. |
| Medium | 50–500 pages | Template-based clustering. Sample 3–5 pages per template for block identification. |
| Large | 500–5,000 pages | Automated clustering + statistical sampling. Focus on top 5 templates covering 80%+ of pages. |
| Enterprise | 5,000+ pages | Section-level analysis with deep-dives into top 3 sections. Recommend phased discovery. |

---

## 7 · EXAMPLE EXECUTIVE SUMMARY OUTPUT

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│   240   │  │   177   │  │   227   │  │    52   │  │    11   │  │     8   │
│TOTAL URLs│  │IN SCOPE │  │HTTP 200 │  │OFF-DOM  │  │INTERNAL │  │TEMPLATES│
│         │  │         │  │         │  │REDIRECTS│  │  301s   │  │         │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘

[site] is a [JS framework]-rendered [CMS platform] site with [XML sitemap status].
A breadth-first crawl reaches only ~[N] pages (~[X]% miss rate), so the
authoritative inventory is derived from [source]. This report takes the full
[total]-URL inventory and re-verifies every HTTP status live. Of these, [200s]
return HTTP 200 and [3xx] are server 3xx redirects. Applying the "200 and not
redirecting off-domain" rule leaves [in-scope] in-scope pages for migration —
dominated by the repeating [top template] template.
```

---

## 8 · AGENT BEHAVIOR GUIDELINES

1. **Always verify live.** Never trust cached or prior status codes. Hit every URL.
2. **Explain methodology.** The report must state how the inventory was derived and why the number differs from a naive crawl.
3. **Reuse-first mindset.** Default to Reuse, justify Variant, and only mark Build when no existing block fits.
4. **Phase for velocity.** Largest template cluster ships first (after foundations) for maximum migration throughput.
5. **Be opinionated on sequencing** but flexible on scope. The phases should reflect a recommended order; the user can adjust.
6. **Flag risks.** If forms require external integrations, if the site uses heavy JS that may not port cleanly, or if a section has no clear template — call it out explicitly.
7. **Produce machine-readable output.** Alongside the human-readable report, generate a JSON manifest of all URLs with their classifications for downstream tooling.

---

## 9 · QUICK-START PROMPT

Use this as the trigger prompt when the user provides a website:

```
Analyze [WEBSITE_URL] for AEM → Edge Delivery Services migration.

Perform the full 7-stage analysis pipeline:
1. Build complete site inventory (crawl + CMS tree + live HTTP verification)
2. Scope by site section
3. Detect and classify page templates
4. Inventory all UI blocks with Reuse/Variant/Build decisions
5. Define phased migration sequence
6. Reconcile against any prior data
7. Document crawl gaps and discovery methodology

Output a structured migration report with Executive Summary, Scope by Section,
Template Inventory, Block Inventory & Reuse Plan, Migration Phases, Status
Reconciliation, and Discovery Notes.
```

---

*Version 1.0 — Experience Modernization Agent · Analysis Module*
*Aligned with Adobe Edge Delivery Services (EDS) migration methodology*

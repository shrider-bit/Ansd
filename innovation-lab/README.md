# مختبر الابتكار في تخطيط القوى العاملة · Workforce Planning Innovation Lab

An autonomous innovation assignment for a government manpower-planning department:
24 project ideas, an evaluation, three working interactive prototypes, one bonus tool
that works on real files, a showcase and a recommendation paper.

**Everything is a self-contained HTML file. Double-click `index.html` — no install, no server, no internet.**

> All figures, entities and employees inside the prototypes are **synthetic demonstration data**
> generated in the browser from a fixed seed. Entity names are deliberately neutral
> («جهة الصحة (أ)»). Nothing here is a real government statistic.

## What to open

| # | File | What it is |
|---|------|------------|
| 05 | `index.html` | **Showcase** — start here. Introduces the prototypes and links to everything. |
| 01 | `01-innovation-portfolio.html` | **Innovation portfolio** — 24 ideas (Arabic + English names, problem, users, innovation, value, data feasibility, expansion) with an interactive scoring committee: change the criterion weights and the ranking updates; a robustness test shows how stable the top three are across 2,000 random weightings. |
| 02 | `02-ufuq-policy-wind-tunnel.html` | **أُفُق / Ufuq** — workforce policy wind tunnel. Cohort simulation to 2040 with uncertainty bands, policy levers, and an inverse mode that searches for policies that reach a stated goal. |
| 03 | `03-jusoor-talent-bridges.html` | **جسور / Jusoor** — cross-government talent redeployment optimiser. Surplus/shortage map, exact assignment optimisation with donor protection, arc diagram, move cards, rotation plan. |
| 04 | `04-bayyina-evidence-desk.html` | **بيّنة / Bayyina** — evidence desk for staffing requests. Eight evidence checks per request, an evidence waterfall from "requested" to "recommended", decisions with mandatory reasons, generated reply memo, portfolio ceiling. |
| 06 | `06-recommendation.html` | **Recommendation** — why Bayyina should be developed first, the organisational problem, an adjustable value calculator, data and integrations, delivery phases, risks, and a management pitch kit. |
| 07 | `07-misfat-data-clinic.html` | **مِصفاة / Misfat (bonus)** — offline data clinic that works on your own files: paste from Excel or load a CSV, get a diagnosis, one-click safe fixes with a change log, a printable quality passport and a disclosure-safety check. Nothing leaves the browser. |

Each prototype has a «جولة العرض» (guided tour) button that walks through the demo story,
and a «المنهجية» (methodology) panel that states its rules and assumptions.

## What is real and what is not

- **Real, computed in your browser:** the cohort simulation and Monte Carlo runs (Ufuq), the
  Hungarian assignment solver (Jusoor), the evidence rule set and allocation (Bayyina), the
  parsing, validation and treatment rules (Misfat), the weighting and robustness maths (portfolio).
- **Synthetic:** all data, and all parameters (attrition rates, costs, standards). They are
  plausible placeholders, not measurements.
- **Not present:** any integration with a government system; any AI. Rule-based, simulated and
  optimised features are named as such in the interface.

## Assumptions made without asking

- Entities are fictional and neutral on purpose; using real ministry names next to invented
  numbers would be misleading in a management demo.
- Grade bands, retirement age (60) and the 60% Qatarisation benchmark follow the department's
  own reference notes. «التقطير» is used for nationalisation.
- Western digits (0–9) are used throughout; formal documents show Gregorian and Hijri dates.
- The synthetic government has 24 entities in 8 sectors, 12 job families and 88,410 employees.
  This total is invented and intentionally does not match any real figure.
- Source systems are described generically in the recommendation paper ("the central government
  HR system"); the actual sources are to be confirmed in a discovery phase.

Prototype-specific modelling assumptions are listed in each prototype's methodology panel and
summarised in `ASSUMPTIONS.md`.

## Viewing notes

- Works offline in any current browser (Chrome, Edge, Safari, Firefox). Fonts are embedded.
- Download and print buttons work when the file is opened locally. Inside an embedded
  preview frame that blocks downloads and printing, use the «نسخ» (copy) button in each export dialog.
- State is kept in memory only; reloading a prototype resets it.

## Rebuilding (optional)

The delivered HTML files are build outputs. Sources live in `_src/<page>/` and are bundled into
one file each by a ~40-line script with no dependencies:

```bash
python3 _src/build.py            # rebuild every page
```

```bash
python3 _src/build.py bayyina    # rebuild one page
```

```bash
node _src/check.js 04-bayyina-evidence-desk.html /tmp   # smoke check (needs Playwright)
```

- `_src/_shared/roster.js` — the shared synthetic roster and formatting helpers.
- `_src/_fonts/*.css` — embedded fonts (Zain, Alexandria, Readex Pro, Noto Kufi Arabic,
  Noto Naskh Arabic, IBM Plex Sans Arabic, IBM Plex Mono), all under the SIL Open Font License.
  `gen_fonts.py` regenerates them from the `@fontsource` npm packages.

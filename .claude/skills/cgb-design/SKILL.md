---
name: cgb-design
description: "This skill should be used when the user explicitly says 'CGB style', 'CGB design', '/cgb-design', 'بهوية الديوان', or directly asks to use/apply the CGB design system. NEVER trigger automatically for generic UI or design tasks."
version: 1.0.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# cgb-design

You are a senior product designer working in the CGB visual identity. When this skill is active, every UI decision follows this design language. It was generated with the hue skill from the rules already fixed in the existing CGB skills (cgb-design-polish, cgb-html-report, dashboard-html-cgb). `design-model.yaml` is the single source of truth; every value below comes from it.

**Before starting any design work, declare which fonts are required and how to load them** (see `references/platform-mapping.md`). Lusail+ is the brand face and is not on Google Fonts; Tajawal is the web fallback. Never assume Lusail+ is installed.

**Working rules that win over everything else here** (from cgb-design-polish): report before changing an existing file, keep an approved design's identity, take every number only from the latest data file and name that file and its date, and never present invented figures, names or entities as real.

---

## 1. DESIGN PHILOSOPHY

Official and calm. A white page, one maroon voice, Arabic first. The lineage is the printed government report: a ruled page, a clear title, a table you can trust. Maroon (`#8E1837`) is the only colour allowed to speak for the brand; gold, navy and pink each have one narrow job. The tension that gives the language its character is a strong, formal colour held back by a lot of white space. When in doubt, remove something.

### Principles

1. **One maroon voice.** Maroon marks the primary action, the header band, the selected state and the Qatari series. If two maroon things compete on one screen, one of them is wrong.
2. **Colour is data, not decoration.** Qatari is maroon and non-Qatari is gold, always. Status colours mean status and nothing else.
3. **Type carries the hierarchy.** Size and weight separate levels. Colour, icons and boxes do not.
4. **Arabic sets the rules.** Right to left, no letter-spacing, no italics, generous line height. Latin runs are guests and are isolated.
5. **A border or a shadow, never both.** Cards sit flat on a 1px line. Only floating layers get a shadow.
6. **Every number has a source.** A figure without its file name and data date under it is not finished.
7. **Motion reports a change.** 150 to 250ms, ease-out, on state change only.

---

## 2. CRAFT RULES: HOW TO COMPOSE

### Pick the mode first

| Mode | Surfaces | What is allowed |
|------|----------|-----------------|
| **Operate** | Dashboards, task system, forms | White page, maroon sidebar or header band, standard controls. Accent only on the primary action, selection and state. |
| **Read** | HTML reports, briefs | White page, maroon total banner, panels in a tidy grid, honest charts, source line under each. |
| **Persuade** | Launch pages, brag pages, slides | A solid deep-maroon field (`#7B1436`) with white type is allowed. One strong idea per screen, one authored entrance. |

Write the mode on the first line of your plan.

### Hierarchy layers

| Layer | Treatment | Example |
|-------|-----------|---------|
| 1. Title | `--display` or `--heading`, weight 700, `--text1` (white on maroon) | Page title, report total |
| 2. Section | `--subheading`, weight 700 | Panel title |
| 3. Content | `--body`, weight 400, `--text1` | Paragraphs, table cells |
| 4. Support | `--body-sm` or `--caption`, `--text2` | Descriptions, source lines |
| 5. Meta | `--label`, weight 500, `--text3` | Column headers, timestamps |

Squint test: with eyes half closed you should see one title, then the panels, then one maroon action. If you see several maroon patches of equal weight, cut.

### Typography discipline

- One family (Lusail+, fallback Tajawal) for headings, labels, body and data. Mono (IBM Plex Mono) only for Latin codes: SAP field names, file names, entity codes.
- `letter-spacing: 0` on everything Arabic. No italics. Emphasis by weight or size.
- Line height 1.3 to 1.4 for headings, 1.6 to 1.9 for body. Body measure 60 to 75 characters.
- Western digits 0-9 throughout, with `font-variant-numeric: tabular-nums` on every data cell.
- Wrap Latin runs (SAP, KPI, emails, codes) in `<bdi>` or `dir="ltr"`.

### Layout

- `dir="rtl"` and `lang="ar"` on every page. Logical CSS only: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`.
- 8px spacing grid. Tight inside a group, generous between groups, more space above a heading than below it.
- Cards are not the default container. Never a card inside a card.
- Tables: first column on the right, numeric columns aligned the same way in every table, sticky header on long tables.
- Nothing overflows at 390px. Wide tables scroll inside their own container.

### Colour strategy

- White page, `--surface1` panels, `--border` lines. Maroon on at most one large area per screen (sidebar, header band or hero) plus the primary action.
- Gold is a fill for data and "in progress". It is never text on white; use `--warning-text` for that.
- Navy is the secondary data colour and the "new" status. Pink is a small highlight in light mode and the readable accent in dark mode.
- On a maroon ground, secondary text is a tint of white (`--on-accent-soft`), never grey.

### Charts

- Every chart answers one question and its title states the finding the data supports.
- Bars start at zero and are sorted by value unless order carries meaning. Direct labels over legends.
- In RTL the first category is on the right and the legend follows the same order.
- One small line under each chart or table: source file and data date.

---

## 3. ANTI-PATTERNS: WHAT TO NEVER DO

- No `letter-spacing` on Arabic text, and no italic Arabic.
- No small kicker label above every heading. Let the heading speak.
- No section numbers (01 / 02 / 03) unless the sequence itself matters.
- No gradient text, and no gradients as page backgrounds.
- No coloured side stripe wider than 1px on cards, alerts or list items.
- No hard offset shadows (`4px 4px 0`), no zero-offset coloured glows, and no border plus shadow on the same card.
- No glass or blur as decoration on new work.
- No emoji or Unicode glyphs as icons. One icon kit (Tabler outline), one stroke weight.
- No violet or lavender accents, no striped or grid backgrounds.
- No sparklines, progress rings or gauges standing in for real content, and no wall of big-number tiles. KPI tiles are for the 3 to 5 numbers leadership reads, each with its comparison.
- No 3D charts, no pie or donut past 5 slices, no dual axes unless asked.
- No fade-in on every section, no scroll-jacking, no parallax on text.
- No modal for a task that does not need to interrupt, and no spinner in the middle of content (use skeletons).
- No gold or maroon on any series other than non-Qatari and Qatari in a nationality chart.
- No drawn or look-alike CGB logo, cover or closing image. Official files only.
- No invented figures, testimonials or entity names presented as real. Mark sample data as sample.

---

## 4. WORKFLOW

1. **State the mode** (Operate, Read or Persuade) on the first line of the plan.
2. **Declare fonts**: check `references/platform-mapping.md` for loading instructions.
3. **Set tokens**: apply variables from `references/tokens.md`.
4. **Build components**: use specs from `references/components.md`.
5. **Check hierarchy**: squint test. One title, one maroon action.
6. **Verify both modes**: light and dark must both feel intentional.
7. **Test extremes**: long Arabic entity names, zero and empty values, very large numbers, 390px width, print.
8. **Trace every number** to its file and date, and add the source line.
9. **Look at it rendered** at 1440 and 390 before showing it.

---

## 5. REFERENCE FILES

| File | Contains |
|------|----------|
| `design-model.yaml` | Single source of truth for every value |
| `references/tokens.md` | Fonts, type scale, colour system (light and dark), spacing, radii, elevation, motion, iconography |
| `references/components.md` | Buttons, cards, banner, inputs, tables, navigation, badges, overlays, state patterns |
| `references/platform-mapping.md` | HTML/CSS, Tailwind and SwiftUI code, font loading |
| `preview.html` | The language in use: a workforce overview board |
| `component-library.html` | Every component with its states and exact values |
| `landing-page.html` | A persuade page on the maroon field |
| `app-screen.html` | The team task system, caught mid-use |

All four previews use clearly marked sample data. None of the figures or names in them are real.

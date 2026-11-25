# cgb-design: Tokens

Every value here comes from `design-model.yaml`. "Fixed" marks a value already set by an existing CGB skill; the rest are steps added between the fixed values.

## 0. PRIMITIVES

### Colour Ramps

**Neutral** (maroon-tinted greys)

| Step | Hex | Use |
|------|-----|-----|
| 0 | `#FFFFFF` | Page (fixed) |
| 50 | `#F8F5F6` | Panels (fixed) |
| 100 | `#F5F0F2` | Text on the dark page (fixed) |
| 150 | `#EFE8EA` | Grouped surfaces |
| 200 | `#E6DDE0` | Lines, dividers (fixed) |
| 300 | `#D3C6CA` | Input borders |
| 400 | `#A8999E` | Disabled text |
| 500 | `#7A6B70` | Placeholders, timestamps |
| 600 | `#6B6B6B` | Muted text (fixed) |
| 700 | `#4A3840` | Strong borders (dark) |
| 750 | `#3A2830` | Lines and grouped surfaces (dark) |
| 800 | `#2A1A1F` | Dark panels (fixed) |
| 900 | `#1F1F1F` | Text (fixed) |
| 950 | `#1A1014` | Dark page (fixed) |

**Brand** (CGB maroon)

| Step | Hex |
|------|-----|
| 50 | `#FBF0F3` |
| 100 | `#F5D9E1` |
| 200 | `#E8A9BC` |
| 300 | `#D4708E` |
| 400 | `#B4345A` |
| 500 | `#8E1837` primary (fixed) |
| 600 | `#7B1436` deep maroon (fixed) |
| 700 | `#651029` |
| 800 | `#4A0E1E` dark sidebar (fixed) |
| 900 | `#360A16` |
| 950 | `#22060E` |

**Supporting and status colours**

| Colour | Tint (light bg) | Fill | Text-safe | Dark tint | Fixed job |
|--------|-----------------|------|-----------|-----------|-----------|
| Pink | `#FDECF1` | `#DF456D` | `#DF456D` | `#5C1228` | Highlight; accent in dark mode |
| Navy | `#EAF0FA` | `#002C77` | `#002C77` (dark: `#8FAEE6`) | `#001A47` | Secondary data; status "new" |
| Gold | `#FCF6E4` | `#E9C56B` | `#8A6A14` (dark: `#E9C56B`) | `#4A3A0C` | Non-Qatari; status "in progress" |
| Green | `#E6F7EE` | `#00B050` | `#0A7A3D` (dark: `#00B050`) | `#0B3D22` | Status "done" |
| Red | `#FBEAEA` | `#C00000` | `#C00000` (dark: `#F08A8A`) | `#4A0E0E` | Status "late" |
| Grey | n/a | `#A6A6A6` | use `--text2` | n/a | Status "on hold" |

### Spacing Primitives

`0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96`

### Radii Primitives

`6, 10, 14, 16, 999`

---

## 1. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Weight | Use |
|------|------|----------|--------|-----|
| **Display** | `"Lusail+"` | `"Tajawal", "Cairo", Arial, sans-serif` | 700 | Page titles, report totals |
| **Body / UI** | `"Lusail+"` | `"Tajawal", "Cairo", Arial, sans-serif` | 400, 500 | Body, labels, data |
| **Mono / Code** | `"IBM Plex Mono"` | `ui-monospace, Consolas, monospace` | 400 | Latin codes only |

Lusail+ (not Lusail) is the brand face and must be installed or self-hosted. It is not on Google Fonts. Tajawal loads from Google Fonts when Lusail+ is missing.

### Mono Font Rules

**`mono_for_code`: true** · **`mono_for_metrics`: false**

Mono is for Latin technical strings only: SAP field names, file names, entity codes. Every figure (headcounts, percentages, dates) stays in the brand face with `font-variant-numeric: tabular-nums`, because numbers in a CGB report are content, not code.

### Type Scale

Letter spacing is 0 on every size. Arabic is a joined script and is never tracked.

| Token | Size | Line Height | Letter Spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--display` | 40px | 1.3 | 0 | 700 | Page title, report total |
| `--heading` | 28px | 1.35 | 0 | 700 | Section headings |
| `--subheading` | 20px | 1.4 | 0 | 700 | Panel and card titles |
| `--body` | 16px | 1.75 | 0 | 400 | Body text, table cells |
| `--body-sm` | 14px | 1.7 | 0 | 400 | Descriptions, notes |
| `--caption` | 13px | 1.6 | 0 | 400 | Source lines, timestamps |
| `--label` | 12px | 1.5 | 0 | 500 | Column headers, badges |

On persuade pages the hero title may go beyond the scale: `clamp(38px, 7vw, 76px)`, line height 1.3.

### Typographic Rules

- No `letter-spacing`, no italics, no `text-transform` on Arabic.
- Emphasis by weight (500, 700) or size, never by colour alone.
- Body measure 60 to 75 characters.
- Western digits 0-9 in every deliverable. Never mix with Arabic-Indic digits.
- Isolate Latin runs with `<bdi>` or `dir="ltr"`; check the position of % and minus signs.

---

## 2. COLOUR SYSTEM (Semantic Tokens)

Components use semantic tokens, never primitives directly.

### Primary Mode (Light)

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.0}` | `#FFFFFF` | Page background |
| `--bg` | alias | `var(--background)` | Shorthand alias |
| `--surface1` | `{neutral.50}` | `#F8F5F6` | Panels, table header |
| `--surface2` | `{neutral.150}` | `#EFE8EA` | Grouped areas, selected row |
| `--surface3` | `{neutral.200}` | `#E6DDE0` | Wells, bar tracks |
| `--border` | `{neutral.200}` | `#E6DDE0` | Card edges, dividers |
| `--border-visible` | `{neutral.300}` | `#D3C6CA` | Inputs, secondary buttons |
| `--text1` | `{neutral.900}` | `#1F1F1F` | Headings, body |
| `--text2` | `{neutral.600}` | `#6B6B6B` | Descriptions, source lines |
| `--text3` | `{neutral.500}` | `#7A6B70` | Placeholders, timestamps |
| `--text4` | `{neutral.400}` | `#A8999E` | Disabled text |
| `--accent` | `{brand.500}` | `#8E1837` | Links, selection, focus |
| `--accent-fill` | `{brand.500}` | `#8E1837` | Primary button, header band, sidebar |
| `--accent-fill-hover` | `{brand.600}` | `#7B1436` | Hover and pressed fill; persuade hero field |
| `--on-accent` | `{neutral.0}` | `#FFFFFF` | Text on maroon |
| `--on-accent-soft` | white 72% | `#FFFFFFB8` | Secondary text on maroon |
| `--accent-subtle` | `{brand.50}` | `#FBF0F3` | Focus ring, accent badge |
| `--info` | `{navy.500}` | `#002C77` | Secondary data, "new" |
| `--highlight` | `{pink.500}` | `#DF456D` | Small highlight |
| `--success` | `{green.500}` | `#00B050` | Fill: done |
| `--warning` | `{gold.500}` | `#E9C56B` | Fill: in progress, non-Qatari |
| `--error` | `{red.500}` | `#C00000` | Fill: late |
| `--success-text` | `{green.700}` | `#0A7A3D` | Status text on light |
| `--warning-text` | `{gold.700}` | `#8A6A14` | Status text on light |
| `--error-text` | `{red.500}` | `#C00000` | Status text on light |

### Secondary Mode (Dark)

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.950}` | `#1A1014` | Page background |
| `--bg` | alias | `var(--background)` | Shorthand alias |
| `--surface1` | `{neutral.800}` | `#2A1A1F` | Panels |
| `--surface2` | `{neutral.750}` | `#3A2830` | Grouped areas, selected row |
| `--surface3` | `{neutral.700}` | `#4A3840` | Wells, bar tracks |
| `--border` | `{neutral.750}` | `#3A2830` | Card edges, dividers |
| `--border-visible` | `{neutral.700}` | `#4A3840` | Inputs, secondary buttons |
| `--text1` | `{neutral.100}` | `#F5F0F2` | Primary text |
| `--text2` | `{neutral.300}` | `#D3C6CA` | Secondary text |
| `--text3` | `{neutral.400}` | `#A8999E` | Tertiary text |
| `--text4` | `{neutral.500}` | `#7A6B70` | Disabled text |
| `--accent` | `{pink.500}` | `#DF456D` | Links, selection, focus |
| `--accent-fill` | `{brand.400}` | `#B4345A` | Primary button |
| `--accent-fill-hover` | `{brand.500}` | `#8E1837` | Hover and pressed fill |
| `--on-accent` | `{neutral.0}` | `#FFFFFF` | Text on maroon |
| `--on-accent-soft` | white 72% | `#FFFFFFB8` | Secondary text on maroon |
| `--accent-subtle` | `{brand.900}` | `#360A16` | Focus ring, accent badge |
| `--info` | `{navy.300}` | `#8FAEE6` | Secondary data, "new" |
| `--highlight` | `{pink.500}` | `#DF456D` | Small highlight |
| `--success` | `{green.500}` | `#00B050` | Fill: done |
| `--warning` | `{gold.500}` | `#E9C56B` | Fill: in progress, non-Qatari |
| `--error` | `{red.500}` | `#C00000` | Fill: late |
| `--success-text` | `{green.500}` | `#00B050` | Status text on dark |
| `--warning-text` | `{gold.500}` | `#E9C56B` | Status text on dark |
| `--error-text` | `{red.300}` | `#F08A8A` | Status text on dark |

The sidebar and the persuade hero stay maroon in dark mode: sidebar `#4A0E1E`, hero `#7B1436`.

### Accent & Status Tints

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent-subtle` | `#FBF0F3` | `#360A16` | Focus ring, accent badge |
| `--info-bg` | `#EAF0FA` | `#001A47` | "New" badge, info alert |
| `--success-bg` | `#E6F7EE` | `#0B3D22` | "Done" badge, success alert |
| `--warning-bg` | `#FCF6E4` | `#4A3A0C` | "In progress" badge, warning alert |
| `--error-bg` | `#FBEAEA` | `#4A0E0E` | "Late" badge, error alert |

### Fixed data colours

| Meaning | Token | Light | Dark |
|---------|-------|-------|------|
| Qatari (قطري) | `--chart-qatari` | `#8E1837` | `#B4345A` |
| Non-Qatari (غير قطري) | `--chart-non-qatari` | `#E9C56B` | `#E9C56B` |
| لم تبدأ | `--info` | `#002C77` | `#8FAEE6` |
| قيد التنفيذ | `--warning` | `#E9C56B` | `#E9C56B` |
| مكتمل | `--success` | `#00B050` | `#00B050` |
| متأخر | `--error` | `#C00000` | `#C00000` |
| موقوف | `--status-hold` | `#A6A6A6` | `#A6A6A6` |

### Colour Usage Rules

- Maroon covers at most one large area per screen, plus the primary action.
- Gold is a fill. As text on a light ground use `--warning-text`.
- Never use `--accent-subtle` for hover or selected backgrounds; use `--surface1` and `--surface2`.
- Contrast: body text at least 4.5:1, large text 3:1. All text tokens above meet this on their own background.
- Theme the browser too: selection `--accent-fill` with white text, focus ring `--accent`.

---

## 3. SPACING

### Scale (8px base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2px | Optical adjustments only |
| `--space-xs` | 4px | Icon-to-label gaps |
| `--space-sm` | 8px | Inside small controls |
| `--space-md` | 16px | Standard padding, phone gutters |
| `--space-lg` | 24px | Card padding, gaps in a grid |
| `--space-xl` | 32px | Between groups |
| `--space-2xl` | 48px | Between sections |
| `--space-3xl` | 64px | Page section breaks |
| `--space-4xl` | 96px | Persuade page sections |

---

## 4. BORDERS & RADII

### Radii Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-element` | 6px | Checkboxes, small icon buttons |
| `--radius-control` | 10px | Buttons, inputs, selects |
| `--radius-component` | 14px | Cards, panels, tables, banner |
| `--radius-container` | 16px | Modals, sheets |
| `--radius-pill` | 999px | Badges, tags, segmented control only |

### Border Treatment

| Element | Border |
|---------|--------|
| Cards / Panels | `1px solid var(--border)`, no shadow |
| Primary button | none |
| Secondary button | `1px solid var(--border-visible)` |
| Inputs | `1px solid var(--border-visible)`; focus `var(--accent)` plus 3px `var(--accent-subtle)` ring |
| Badges | none; tinted background |
| Modals / Menus | none; shadow only |

Soft corners, not round ones. Pills are for small controls only; a pill-shaped card or button is off-brand.

---

## 5. ELEVATION & SHADOWS

| Level | Light Mode | Dark Mode | Use |
|-------|-----------|----------|-----|
| **0** | None | None | Page, inline elements |
| **1** | None (1px border) | None (1px border) | Cards, panels |
| **2** | `0 8px 24px -12px rgba(31, 31, 31, 0.18)` | `0 8px 24px -12px rgba(0, 0, 0, 0.6)` | Menus, popovers, toasts |
| **3** | `0 24px 48px -20px rgba(31, 31, 31, 0.28)` | `0 24px 48px -20px rgba(0, 0, 0, 0.7)` | Modals |

Strategy: flat. A card has a border and no shadow. A floating layer has a shadow and no border. Never both, never a coloured glow, never a hard offset.

---

## 6. MOTION & INTERACTION

### Personality

Mechanical. Precise, no overshoot, no bounce. Motion reports a state change and then stops.

### Timing

| Type | Duration | Easing | Use |
|------|----------|--------|-----|
| **Micro** | 150ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Hover, press, toggle |
| **Standard** | 200ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Menu open, row expand |
| **Emphasis** | 250ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Modal, the one authored entrance on a persuade page |

Under `prefers-reduced-motion: reduce`, show the final state with no transition.

### Interaction States

Every interactive element defines default, hover, focus-visible, active, disabled, loading and error. Focus is a 2px `var(--accent)` outline with 2px offset (white on maroon grounds). Disabled uses `--text4` on `--surface1`. Loading uses skeletons.

---

## 7. ICONOGRAPHY

> **Fallback disclosure.** Icons come from the freely licensed Tabler kit. They are not official CGB artwork.

### Observed style

| Attribute | Value |
|-----------|-------|
| Description | Not observed. The existing CGB pages carry almost no icons; the design guide only requires one real icon set at one stroke weight and no emoji. |
| Stroke weight | regular |
| Corner treatment | soft |
| Fill style | outline |
| Form language | geometric |
| Visual density | balanced |

### Fallback kit

- **Kit:** Tabler Icons
- **Weight / variant:** outline, 2px stroke on a 24px grid
- **Match score:** medium (nothing observed to match against)
- **Why this kit:** breadth for data tools (charts, tables, filters, people, calendars) and a plain outline that stays neutral beside Arabic type. Lucide was second choice.
- **CDN:** `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.41.1/dist/tabler-icons.min.css`
- **Usage:** `<i class="ti ti-users"></i>`, or inline SVG copied from `@tabler/icons` so the page works offline (the previews do this).

### Sizes

| Context | Size |
|---------|------|
| Inline with body text | 18px |
| Buttons | 18px |
| Navigation | 20px |

### Colour rule

Icons take `currentColor`. They are never coloured on their own, except a status icon that takes its status text colour.

### Don't

- Never use emoji or Unicode glyphs as icons, and never mix kits or stroke weights.
- Mirror directional icons (arrows, chevrons, back and next) in RTL. Never mirror search, clock, check or calendar.
- Never claim these are official CGB icons.

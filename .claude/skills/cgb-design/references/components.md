# cgb-design: Components

All values are tokens from `references/tokens.md`. "Observed" means the component already exists in an approved CGB page; "derived" means it was reasoned from the rules.

Shared rules for every component:

- Logical properties only (`padding-inline`, `margin-inline-start`, `inset-inline-end`). The layout must flip with `dir`.
- Labels are a verb plus an object: "تصدير التقرير", "إضافة مهمة".
- Focus-visible: `outline: 2px solid var(--accent); outline-offset: 2px` (white outline on maroon grounds).
- Transitions: 150ms `cubic-bezier(0.22, 1, 0.36, 1)` on colour, background and border only.

## 1. BUTTONS

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| Primary | `--accent-fill` | `--on-accent` | none | The one main action on a screen |
| Secondary | transparent | `--text1` | `1px solid --border-visible` | Other actions |
| Ghost | transparent | `--accent` | none | Low-emphasis actions in toolbars and rows |
| Destructive | `--error` | `#FFFFFF` | none | Delete, with a confirm step |
| On maroon (primary) | `--on-accent` | `--accent-fill` (light value) | none | Main action on a maroon ground |
| On maroon (secondary) | transparent | `--on-accent` | `1px solid` white 22% | Other action on a maroon ground |

| Size | Height | Padding inline | Font | Radius |
|------|--------|----------------|------|--------|
| sm | 36px | 14px | 14px / 500 | `--radius-control` |
| md | 44px | 20px | 16px / 500 | `--radius-control` |
| lg | 52px | 28px | 16px / 500 | `--radius-control` |

| State | Change |
|-------|--------|
| Hover | Primary: `--accent-fill-hover`. Secondary and ghost: `--surface1` background. |
| Active | `transform: scale(0.98)` |
| Disabled | `--surface1` background, `--text4` text, no border, `cursor: not-allowed` |
| Loading | Label stays; a 16px ring spinner in `currentColor` sits before it; button is inert |

One primary button per screen. Icons sit before the label with an 8px gap; directional icons are mirrored.

## 2. CARDS / PANELS (observed: cgb-html-report)

| Property | Value |
|----------|-------|
| Background | `--background` (on a `--surface1` page area) or `--surface1` (on the page) |
| Border | `1px solid --border` |
| Radius | `--radius-component` |
| Padding | `--space-lg` |
| Shadow | none |
| Title | `--subheading`, weight 700, `--text1` |
| Footer | Source line: `--caption`, `--text2`, file name in mono, then the data date |

No card inside a card. No coloured side stripe. An interactive card changes its border to `--border-visible` on hover; it does not lift.

## 3. TOTAL BANNER (observed: cgb-html-report)

A full-width band at the top of a report: scope name and the headline total.

| Property | Value |
|----------|-------|
| Background | `--accent-fill` |
| Text | `--on-accent`; scope line in `--on-accent-soft` |
| Radius | `--radius-component` |
| Padding | `--space-lg` to `--space-xl` |
| Total | `--display`, weight 700, tabular numerals |

One banner per page. It is the only large maroon area on a Read page.

## 4. KPI TILE

For the 3 to 5 numbers leadership reads. Each tile: label (`--body-sm`, `--text2`), value (`--heading`, 700, tabular), comparison line (`--caption`: vs last period or vs target, in `--success-text` or `--error-text` with an arrow icon). No sparkline, no ring, no icon badge. If there is no comparison in the data, leave the line out; do not invent one.

## 5. INPUTS

| Property | Value |
|----------|-------|
| Height | 44px (textarea: min 96px) |
| Background | `--background` |
| Border | `1px solid --border-visible` |
| Radius | `--radius-control` |
| Padding inline | 14px |
| Text | `--body`, `--text1`; placeholder `--text3` |
| Label | Above the field, `--body-sm`, weight 500, `--text1`, 6px gap |
| Help / error text | Below, `--caption`; help `--text2`, error `--error-text` |

| State | Change |
|-------|--------|
| Hover | Border `--text3` |
| Focus | Border `--accent`, ring `0 0 0 3px --accent-subtle` |
| Error | Border `--error`; message says the problem and the fix |
| Disabled | `--surface1` background, `--text4` text |

Select uses the same box with a chevron at the inline end. Search puts the search icon at the inline start (not mirrored). Fields that hold Latin data (email, SAP codes) set `dir="ltr"` and `text-align: end`.

## 6. CHECKBOX, RADIO, SWITCH

| Control | Size | Off | On |
|---------|------|-----|----|
| Checkbox | 20px, `--radius-element` | `1px solid --border-visible` | `--accent-fill` fill, white check drawn with CSS borders |
| Radio | 20px, round | `1px solid --border-visible` | `--accent-fill` ring with an 8px dot |
| Switch | 44 x 24px, pill | `--surface3` track, white 18px thumb at inline start | `--accent-fill` track, thumb at inline end |

Label sits after the control (to its left in RTL) with an 8px gap. Never use a Unicode tick.

## 7. STATUS BADGE (observed: dashboard-html-cgb)

`display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; line-height: 1; border-radius: --radius-pill; font: --label / 500; white-space: nowrap`. An 8px dot in the fill colour sits before the text.

| Status | Dot | Background | Text |
|--------|-----|------------|------|
| لم تبدأ | `--info` | `--info-bg` | `--info` |
| قيد التنفيذ | `--warning` | `--warning-bg` | `--warning-text` |
| مكتمل | `--success` | `--success-bg` | `--success-text` |
| متأخر | `--error` | `--error-bg` | `--error-text` |
| موقوف | `--status-hold` | `--surface2` | `--text2` |

One label, one colour, everywhere. Priority (عالية / متوسطة / منخفضة) is plain text with weight, not another colour set.

## 8. DATA TABLE

| Part | Value |
|------|-------|
| Container | `1px solid --border`, `--radius-component`, `overflow-x: auto` |
| Header row | `--surface1` background, `--label` 500, `--text2`, sticky on long tables |
| Body row | 48px min height, `--body-sm`, divider `1px solid --border` |
| Cell padding | 12px block, 16px inline |
| Text columns | `text-align: start` (first column is on the right) |
| Numeric columns | `text-align: end`, tabular numerals, same alignment in every table |
| Hover | `--surface1` |
| Selected | `--surface2` |
| Empty cell | A dash in `--text4`, never a blank |
| Footer | Source line under the table |

## 9. NAVIGATION

**Sidebar (observed: dashboard-html-cgb).** 248px, at the inline start (right side in RTL). Background `--sidebar` (`#8E1837` light, `#4A0E1E` dark), text `--on-accent-soft`, active item text `--on-accent` on white 12%, radius `--radius-control`, 40px items, 20px icons.

**Header band.** 64px, `--background`, bottom border `1px solid --border`; page title in `--subheading`.

**Tabs.** Underline style: 44px tall, `--body-sm` 500, inactive `--text2`, active `--text1` with a 2px `--accent` line under it.

**Segmented control.** Pill track `--surface2` with 4px padding; selected segment `--background` with `--text1`; others `--text2`.

**Breadcrumb.** `--body-sm`, `--text2`, mirrored chevron separators, current page `--text1`.

**Pagination.** 36px square buttons, `--radius-control`; current page `--accent-fill` with white text; previous and next arrows mirrored.

## 10. CHARTS

| Mark | Value |
|------|-------|
| Qatari series | `--chart-qatari` |
| Non-Qatari series | `--chart-non-qatari` |
| Other series | `--info`, then `--text3`; never a second maroon or gold |
| Bar | 6px radius at the value end, starts at zero |
| Track | `--surface3` |
| Value label | Direct, `--body-sm` 500, tabular numerals |
| Axis and category labels | `--caption`, `--text2`, Arabic |
| Order | First category on the right; bars grow from the right |
| Title | States the finding the data supports |
| Source | One line under the chart: file name and data date |

## 11. FEEDBACK

**Alert.** `--radius-component`, 16px padding, tinted background (`--info-bg`, `--success-bg`, `--warning-bg`, `--error-bg`), a status icon in the status text colour, title 500 and one line of body. No side stripe.

**Toast.** `--background`, shadow level 2, `--radius-component`, status icon, one line, one optional action. Appears at the bottom inline-start corner and leaves after 5 seconds.

**Progress bar.** 8px track `--surface3`, fill `--accent-fill` (or a status fill), pill radius, with the value as text beside it. A bar never appears without its number.

**Skeleton.** `--surface2` blocks with `--radius-element`, matching the shape of the content they replace. Used for all loading.

**Empty state.** A 32px icon in `--text3`, one sentence saying what belongs here, and one action that fixes it. Never "لا توجد بيانات" alone.

## 12. OVERLAYS

| Overlay | Background | Radius | Shadow | Notes |
|---------|------------|--------|--------|-------|
| Dropdown menu | `--background` | `--radius-component` | level 2 | 40px items, hover `--surface1`, opens from the trigger's inline-start edge |
| Popover | `--background` | `--radius-component` | level 2 | 16px padding |
| Tooltip | `--text1` | `--radius-element` | none | `--background` text, `--caption`, 6px 10px padding |
| Modal | `--background` | `--radius-container` | level 3 | Max 560px, 24px padding, backdrop black 50%; actions at the inline end with the primary last |

Use a modal only when the task must interrupt. Otherwise use an inline panel.

## 13. STATE PATTERNS

| State | Treatment |
|-------|-----------|
| Empty | Empty state component with a next step |
| Loading | Skeletons in the shape of the content |
| Error | Alert with the problem and the fix; keep the user's input |
| Disabled | `--text4` on `--surface1`; explain why in a tooltip if it is not obvious |
| Long Arabic names | Wrap to two lines, then truncate with a title attribute; never shrink the font |
| Missing value | A dash in `--text4`; never zero, never an estimate |

# cgb-design: Platform Mapping

## 1. HTML / CSS / WEB

### Page shell

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
```

### Font Loading

Lusail+ is the brand face. It is not on Google Fonts: install it, or self-host the licensed files with `@font-face`. Tajawal is loaded as the fallback so the page still looks right without it.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Custom Properties: Light (primary)

```css
:root,
[data-theme="light"] {
  /* Colours */
  --background: #FFFFFF;
  --bg: var(--background);
  --surface1: #F8F5F6;
  --surface2: #EFE8EA;
  --surface3: #E6DDE0;
  --border: #E6DDE0;
  --border-visible: #D3C6CA;
  --text1: #1F1F1F;
  --text2: #6B6B6B;
  --text3: #7A6B70;
  --text4: #A8999E;
  --accent: #8E1837;
  --accent-fill: #8E1837;
  --accent-fill-hover: #7B1436;
  --on-accent: #FFFFFF;
  --on-accent-soft: #FFFFFFB8;
  --accent-subtle: #FBF0F3;
  --info: #002C77;
  --info-bg: #EAF0FA;
  --highlight: #DF456D;
  --success: #00B050;
  --success-text: #0A7A3D;
  --success-bg: #E6F7EE;
  --warning: #E9C56B;
  --warning-text: #8A6A14;
  --warning-bg: #FCF6E4;
  --error: #C00000;
  --error-text: #C00000;
  --error-bg: #FBEAEA;
  --status-hold: #A6A6A6;
  --chart-qatari: #8E1837;
  --chart-non-qatari: #E9C56B;
  --sidebar: #8E1837;
  --hero-field: #7B1436;

  /* Fonts */
  --font-display: "Lusail+", "Tajawal", "Cairo", Arial, sans-serif;
  --font-body: "Lusail+", "Tajawal", "Cairo", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;

  /* Type scale */
  --text-display: 40px;
  --text-heading: 28px;
  --text-subheading: 20px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-caption: 13px;
  --text-label: 12px;

  /* Spacing */
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;

  /* Radii */
  --radius-element: 6px;
  --radius-control: 10px;
  --radius-component: 14px;
  --radius-container: 16px;
  --radius-pill: 999px;

  /* Motion */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-medium: 200ms;
  --duration-slow: 250ms;

  /* Shadows (floating layers only) */
  --shadow-1: none;
  --shadow-2: 0 8px 24px -12px rgba(31, 31, 31, 0.18);
  --shadow-3: 0 24px 48px -20px rgba(31, 31, 31, 0.28);
}
```

### Dark (secondary)

```css
[data-theme="dark"] {
  --background: #1A1014;
  --bg: var(--background);
  --surface1: #2A1A1F;
  --surface2: #3A2830;
  --surface3: #4A3840;
  --border: #3A2830;
  --border-visible: #4A3840;
  --text1: #F5F0F2;
  --text2: #D3C6CA;
  --text3: #A8999E;
  --text4: #7A6B70;
  --accent: #DF456D;
  --accent-fill: #B4345A;
  --accent-fill-hover: #8E1837;
  --on-accent: #FFFFFF;
  --on-accent-soft: #FFFFFFB8;
  --accent-subtle: #360A16;
  --info: #8FAEE6;
  --info-bg: #001A47;
  --highlight: #DF456D;
  --success: #00B050;
  --success-text: #00B050;
  --success-bg: #0B3D22;
  --warning: #E9C56B;
  --warning-text: #E9C56B;
  --warning-bg: #4A3A0C;
  --error: #C00000;
  --error-text: #F08A8A;
  --error-bg: #4A0E0E;
  --status-hold: #A6A6A6;
  --chart-qatari: #B4345A;
  --chart-non-qatari: #E9C56B;
  --sidebar: #4A0E1E;
  --hero-field: #7B1436;
  --shadow-2: 0 8px 24px -12px rgba(0, 0, 0, 0.6);
  --shadow-3: 0 24px 48px -20px rgba(0, 0, 0, 0.7);
}

/* Follow the system when no theme is set on <html> */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { color-scheme: dark; }
}
```

To follow the system setting without a toggle, copy the dark block into `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`.

### Base

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; }
html { font-family: var(--font-body); font-size: var(--text-body); line-height: 1.75; }
body { background: var(--background); color: var(--text1); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { line-height: 1.35; font-weight: 700; letter-spacing: 0; }
::selection { background: var(--accent-fill); color: var(--on-accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.num, td.num { font-variant-numeric: tabular-nums; text-align: end; }
bdi, [dir="ltr"] { unicode-bidi: isolate; }
code, .code { font-family: var(--font-mono); font-size: 0.875em; direction: ltr; unicode-bidi: isolate; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
```

---

## 2. REACT / TAILWIND

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: { 1: 'var(--surface1)', 2: 'var(--surface2)', 3: 'var(--surface3)' },
        border: { DEFAULT: 'var(--border)', visible: 'var(--border-visible)' },
        text: { 1: 'var(--text1)', 2: 'var(--text2)', 3: 'var(--text3)', 4: 'var(--text4)' },
        accent: {
          DEFAULT: 'var(--accent)',
          fill: 'var(--accent-fill)',
          'fill-hover': 'var(--accent-fill-hover)',
          subtle: 'var(--accent-subtle)',
          on: 'var(--on-accent)',
        },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)' },
        success: { DEFAULT: 'var(--success)', text: 'var(--success-text)', bg: 'var(--success-bg)' },
        warning: { DEFAULT: 'var(--warning)', text: 'var(--warning-text)', bg: 'var(--warning-bg)' },
        error: { DEFAULT: 'var(--error)', text: 'var(--error-text)', bg: 'var(--error-bg)' },
        chart: { qatari: 'var(--chart-qatari)', 'non-qatari': 'var(--chart-non-qatari)' },
        cgb: { maroon: '#8E1837', 'maroon-deep': '#7B1436', pink: '#DF456D', navy: '#002C77', gold: '#E9C56B' },
      },
      fontFamily: {
        display: ['"Lusail+"', 'Tajawal', 'Cairo', 'Arial', 'sans-serif'],
        body: ['"Lusail+"', 'Tajawal', 'Cairo', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '1.3', fontWeight: '700' }],
        heading: ['28px', { lineHeight: '1.35', fontWeight: '700' }],
        subheading: ['20px', { lineHeight: '1.4', fontWeight: '700' }],
        body: ['16px', { lineHeight: '1.75' }],
        'body-sm': ['14px', { lineHeight: '1.7' }],
        caption: ['13px', { lineHeight: '1.6' }],
        label: ['12px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: { '2xs': '2px', xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px', '3xl': '64px', '4xl': '96px' },
      borderRadius: { element: '6px', control: '10px', component: '14px', container: '16px', pill: '999px' },
      boxShadow: { float: 'var(--shadow-2)', modal: 'var(--shadow-3)' },
      transitionTimingFunction: { cgb: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      transitionDuration: { fast: '150ms', medium: '200ms', slow: '250ms' },
    },
  },
};
```

Use Tailwind's logical utilities so the layout follows `dir="rtl"`: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `text-end`. Do not use `pl-*`, `pr-*`, `left-*` or `right-*`. Never use `tracking-*` on Arabic text.

---

## 3. SWIFTUI / iOS

Lusail+ must be bundled with the app and listed under `UIAppFonts`. Set `.environment(\.layoutDirection, .rightToLeft)` at the root.

```swift
import SwiftUI

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: alpha)
    }

    static let cgbMaroon     = Color(hex: 0x8E1837)
    static let cgbMaroonDeep = Color(hex: 0x7B1436)
    static let cgbPink       = Color(hex: 0xDF456D)
    static let cgbNavy       = Color(hex: 0x002C77)
    static let cgbGold       = Color(hex: 0xE9C56B)
    static let cgbPanel      = Color(hex: 0xF8F5F6)
    static let cgbLine       = Color(hex: 0xE6DDE0)
    static let cgbText       = Color(hex: 0x1F1F1F)
    static let cgbMuted      = Color(hex: 0x6B6B6B)
    static let cgbDone       = Color(hex: 0x00B050)
    static let cgbLate       = Color(hex: 0xC00000)
    static let cgbHold       = Color(hex: 0xA6A6A6)

    static let chartQatari    = Color.cgbMaroon
    static let chartNonQatari = Color.cgbGold
}

extension Font {
    static func cgb(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Lusail+", size: size).weight(weight)
    }
    static let cgbDisplay    = Font.cgb(40, weight: .bold)
    static let cgbHeading    = Font.cgb(28, weight: .bold)
    static let cgbSubheading = Font.cgb(20, weight: .bold)
    static let cgbBody       = Font.cgb(16)
    static let cgbBodySm     = Font.cgb(14)
    static let cgbCaption    = Font.cgb(13)
    static let cgbLabel      = Font.cgb(12, weight: .medium)
}

enum CGBSpace {
    static let xs: CGFloat = 4, sm: CGFloat = 8, md: CGFloat = 16
    static let lg: CGFloat = 24, xl: CGFloat = 32, xxl: CGFloat = 48
}

enum CGBRadius {
    static let element: CGFloat = 6, control: CGFloat = 10
    static let component: CGFloat = 14, container: CGFloat = 16
}
```

Use `RoundedRectangle(cornerRadius: CGBRadius.component, style: .continuous)` for cards, and `.monospacedDigit()` on every figure.

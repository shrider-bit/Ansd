---
name: motion-pack
description: Build one of 15 polished landing-page animations (hero, social proof, product demo, stats, logos, steps, AI chat, testimonials, before/after, feature grids, pricing, comparison, CTA) as a self-contained component. Use when the user asks for a word swap / rotating headline, live order feed, ghost cursor demo, number roll / count-up stats, logo marquee, path draw steps, AI chat reply mock, review deck, glow-up / before-after slider, spotlight cards, bento snap grid, price flip toggle, win / comparison table, blur-in hero, confetti click, or says "motion pack" or names one by number (01-15).
---

# Motion Pack

Fifteen landing-page animations, one prompt each. Pick the one the user named (by name or number), read its prompt under **The 15**, adapt the bracketed copy to the user's product, and build it.

## Ground rules (apply to every animation)

- **Stack.** Match the project: React + Tailwind (with Framer Motion if it is already a dependency, otherwise plain CSS/WAAPI) or a single self-contained HTML file when there is no project. Never add a heavy library for one effect.
- **Animate only `transform`, `opacity` and `filter`.** No layout-thrashing properties (`top`, `width`, `height`) in loops.
- **Easing.** Default `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) for entrances, `cubic-bezier(0.65, 0, 0.35, 1)` for state changes. Springs only where the prompt says so.
- **Trigger on view.** Use IntersectionObserver (threshold ~0.3) so entrance animations start when the section scrolls in, once.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, show the final state immediately; keep loops paused.
- **Accessibility.** Rotating or typed text keeps a stable accessible label (`aria-label` with the full sentence, animated parts `aria-hidden`). Interactive parts are keyboard reachable with visible focus.
- **Tabular numbers.** Every counter uses `font-variant-numeric: tabular-nums` so digits do not jitter.
- **Light and dark.** Use CSS variables for colours; support both unless the prompt fixes one.
- **Pause off-screen.** Infinite loops stop when the section leaves the viewport or the tab is hidden.
- **Check it.** Render it in a browser (Playwright is available), screenshot the start, middle and end state, and fix anything that pops, overlaps or shifts layout before showing the user.

## The 15

### 01 · Word swap — hero
*Use it for:* a hero that speaks to every kind of visitor.

> Build a dark hero section with a centred three-line headline: "We build" / [rotating word] / "that convert." The middle line is a pill with an orange (#F97316) background and white bold text that cycles through [landing pages, dashboards, portfolios, SaaS apps] every 2.2 s. On each swap the old word slides up 100% and fades out while the new word slides in from below (400 ms, ease-out-quint), and the pill smoothly resizes its width to fit the new word (measure each word, animate width with a transform-friendly approach or a 300 ms width transition on the pill only). The third line is muted grey. Below the headline, show small progress dots, one per word, with the active dot elongated. Respect reduced motion by showing the first word statically.

### 02 · Live order feed — social proof
*Use it for:* social proof on a store or SaaS page.

> Build a "live sales" card: on the left a phone mockup (rounded 40 px, dark, big clock "9:41") whose lock screen receives a new notification every 1.8 s ("New order · [Product] · $[amount]"), sliding down from the top and pushing older ones down, max 5 visible, oldest fading out. On the right, two stat cards: "Today's revenue" counting up to the new total with each order (roll the digits over 600 ms, tabular nums) with a small green "+18% vs yesterday" tag and a sparkline that extends one point per order; and "Live visitors" ticking between nearby values. Orders and amounts come from a small seeded array so the loop is deterministic. Pause when off-screen.

### 03 · Ghost cursor — product demo
*Use it for:* product demos without a screen recording.

> Build a fake app window (sidebar with Projects, Templates, Team, Settings; main area titled "Projects" with two project cards) and animate a ghost cursor (an SVG arrow with a soft shadow) that performs a scripted flow on loop: glide to "+ New project" (curved path, 900 ms), press (button scales to 0.96 and a ripple), a modal opens with a backdrop dim, the cursor clicks the name field and the text "[Launch site]" types in at ~60 ms per character with a blinking caret, the cursor moves to "Create" and clicks, the modal closes and a new gradient project card animates into the grid (scale 0.9 → 1, opacity 0 → 1), then a 2 s pause and reset. Drive the script with an async timeline of steps so it is easy to edit. The cursor never teleports; every move is eased.

### 04 · Number roll — results
*Use it for:* a results section that earns trust.

> Build a results panel with: a donut ring that fills from 0 to [82]% with the percentage counting up in the centre; a big revenue figure counting from $0.0M to $[1.2]M; a rating counting to [4.9] with five stars filling left to right; and a full-width area chart labelled "Conversion rate · last 30 days" whose line draws left to right (stroke-dashoffset) while the gradient fill fades in beneath it, finishing with a small "+38% conversion" badge popping in at the end point. Everything starts when the panel scrolls into view and finishes together within 1.6 s, ease-out. Counters use tabular nums and format with the right decimals throughout the count.

### 05 · Logo marquee — trust
*Use it for:* the "trusted by" row under your hero.

> Build a "Loved by fast-moving teams" section with the subline "2,000+ startups ship with it" and two infinite logo rows: the top row scrolls left, the bottom row scrolls right, at slightly different speeds (40 s and 50 s per loop). Each logo is an icon plus wordmark in muted grey ([Orbitly, Halcyon, Kitefly, Vertex, Pinecone, Quanta] as placeholders). Duplicate each row's content so the loop is seamless (translateX from 0 to -50%). Fade both edges with a mask-image gradient. Hovering a row pauses it and brings the hovered logo to full colour. Below, a small pill: "Join them in under 5 minutes".

### 06 · Path draw — how it works
*Use it for:* the "how it works" section.

> Build a dark "How it works" section with three steps in a row: [Brief], [Design], [Launch], each a circle node above a short title and description. A glowing green (#22C55E) SVG path connects the nodes with gentle S-curves. On scroll into view, the path draws itself left to right (stroke-dashoffset, 1.8 s) with a bright dot riding the leading edge and a blurred duplicate path underneath for glow. As the line reaches each node, that node fills green, shows a check icon and scales 1 → 1.12 → 1, and its text brightens from 40% to 100% opacity. After the last node, a CTA pill "[Start your brief]" fades up. On mobile, stack vertically and draw the path downward.

### 07 · AI chat reply — AI product
*Use it for:* showing what your AI product actually does.

> Build a chat window titled "Assistant". On loop: a user bubble slides in on the right ("[Make my pricing section feel premium.]"), then the assistant shows a three-dot typing indicator for 900 ms, then streams its reply word by word ("Done. I added a yearly toggle, a highlighted Pro plan and a soft glow on hover.") at a natural uneven pace, then renders an inline mini pricing preview inside the reply: three small cards ($15, $39 highlighted in orange, $79) that stagger in (80 ms apart, rise 8 px). Hold 2.5 s, fade the conversation out and restart. Include a disabled input bar at the bottom with a placeholder and send button. Text streaming must not shift layout: reserve the reply height once the text is known.

### 08 · Review deck — testimonials
*Use it for:* testimonials without a boring grid.

> Build a testimonial deck on a dark background: a stack of white review cards slightly offset and rotated (-3°, 2°, -1°) like a deck. Each card shows five stars, a short quote, avatar, name and role. Every 3 s the top card flicks off (translateX 120%, rotate 12°, fade) and returns to the bottom of the stack, while the cards beneath step forward (scale and offset animate to the next slot). Users can also drag the top card horizontally to throw it; past 30% of its width it flies off, otherwise it springs back. Under the deck: "★ 4.9 average from 1,200+ reviews". Use [four placeholder reviews].

### 09 · Glow-up slider — before/after
*Use it for:* redesign case studies and portfolio posts.

> Build a before/after comparison of the same website: the "before" is a deliberately dated page (Times New Roman, centred "WELCOME TO [BRAND].COM!!!", blue underlined links, a grey image placeholder, a yellow marquee banner), the "after" is a modern redesign (clean sans headline, product image on an orange gradient, a "+42%" result chip). Stack them and clip the "after" with `clip-path: inset(0 0 0 X%)`. A vertical handle with a round grip divides them; drag it with pointer or arrow keys (role="slider", aria-valuenow). On scroll into view, auto-sweep the handle from 85% to 15% and settle at 50% to show the reveal, then hand control to the user. Label corners "Before" and "After".

### 10 · Spotlight cards — features
*Use it for:* feature grids that react to the mouse.

> Build a dark 3×2 feature grid ([Instant deploys, Built-in security, Global edge, Live analytics, Team roles, Version history]), each card with an icon, title and one-line description. A soft radial spotlight (blue-violet, ~250 px) follows the cursor across the whole grid: set `--x`/`--y` on the grid from pointermove and give each card a background `radial-gradient(250px at var(--x) var(--y), rgba(99,102,241,.25), transparent)` positioned relative to the card, plus a 1 px border that brightens near the cursor using the same trick on a mask. The spotlight fades out when the pointer leaves. On touch devices, highlight the tapped card instead. Throttle with requestAnimationFrame.

### 11 · Bento snap — features
*Use it for:* a features section that isn't a list.

> Build a bento grid of 5–6 tiles of different sizes: a "[Fresh beans, roasted Monday, at your door by Friday]" text tile, a counter tile counting to [1,840], a tile with colourful avatar chips, a dark-mode toggle tile that flips on, a "200+ integrations" icon tile and a wide line-chart tile that draws itself. On scroll into view, each tile flies in from a different direction and slight rotation, then snaps into its cell with a spring (stiffness ~260, damping ~20), staggered 70 ms. After each tile lands, its inner content animates (counter rolls, toggle flips, chart draws). Light theme, rounded 20 px, subtle borders.

### 12 · Price flip — pricing
*Use it for:* making the yearly plan feel like a win.

> Build a three-tier pricing section (Starter, Pro, Team) with a Monthly / Yearly segmented toggle and a green "Save 20%" badge beside Yearly. The middle "Pro" card is dark and highlighted with a "Popular" tag. Switching the toggle slides the active pill and rolls each price like an odometer: each digit is a vertical strip 0–9 that translates to its new digit (500 ms, staggered 40 ms per digit, slight overshoot), e.g. $19 → $15, $49 → $39, $99 → $79. "/mo" changes to "/mo, billed yearly" with a crossfade. Each card lists 4–5 features with check icons and a CTA button. Keyboard operable toggle (role="radiogroup").

### 13 · Win table — comparison
*Use it for:* the comparison right before pricing.

> Build a dark comparison table: rows of criteria ([Live in 7 days, Unlimited revisions, Built with Claude, One fixed monthly price, Source files included]), a muted "Others" column with greys and crosses, and a highlighted "Us" column wrapped in an orange glowing border. On scroll into view, rows reveal top to bottom (120 ms stagger): the criterion text brightens, the "Others" cell shows a grey ✕, and the "Us" cell pops an orange check (scale 0 → 1.15 → 1) while the orange column border grows downward to that row. After the last row, a pill CTA "[Switch in 2 minutes →]" fades up under the table.

### 14 · Blur-in hero — hero
*Use it for:* the first three seconds of your landing page.

> Build a light hero: a small pill badge "Built with Claude" at the top, then a two-line headline "[Ship a site] / [people remember.]" with the second line in pink-to-orange gradient text. Words enter one by one: each starts at `filter: blur(12px)`, opacity 0, translateY 12 px and resolves to sharp in 600 ms, staggered 90 ms. Then the subline fades in, then two buttons ("Start free", "Watch demo") rise in, then a small card with a live counter "[12,437] sites shipped" that keeps ticking up every few seconds next to a soft gradient chip. Total intro under 1.8 s. Split the headline into word spans in code, keep the full sentence as the accessible label.

### 15 · Confetti click — conversion
*Use it for:* the last click on your page.

> Build a centred CTA: a black pill button "[Start free →]". On click, the button morphs (width and radius) into a circle, shows a spinner for 700 ms, then becomes an orange circle with a white check that draws itself (stroke-dashoffset), while a confetti burst of ~80 small rectangles and dots in brand colours shoots out from the button with randomised angle, velocity, spin and gravity on a canvas (requestAnimationFrame, ~1.6 s, then cleared). Below, "You're in!" and "Check your inbox for the next step." fade up. Clicking again resets. No confetti under reduced motion; just the check.

## When the user names several

Build them as separate sections on one page in the order the user gave, sharing one set of CSS variables, and keep each in its own component or clearly marked block.

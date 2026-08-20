# Handoff: Dietty — retro-terminal dashboard redesign (v1)

## Overview

Restyle and re-architect the Dietty dashboard (`dietty` Cloudflare Worker, live from Notion)
into a green-phosphor retro-terminal interface: monochrome green on near-black, monospace
type, square corners, segmented tick-arc progress rings.

Two things change at once:

1. **Visual system** — a full reskin, dark only.
2. **Information architecture** — the single long scrolling page becomes four tabbed
   screens behind a left rail; the landing screen leads with *calories remaining* and
   *protein remaining*; the deficit chart is re-zeroed on the 400 kcal target; a new
   all-time-vs-7-day deficit comparison and a weekly averages strip are added.

**Nothing was removed.** Every panel, metric, and chart from the current `src/page.js`
survives — it is redistributed across tabs.

## About the design files

`Dietty Terminal.dc.html` in this bundle is a **design reference created in HTML**, not
production code to copy. It is a self-contained streaming prototype with a mocked data
payload shaped exactly like the real `GET /api/data` response.

The target is the existing repo: a single Cloudflare Worker where the whole UI lives in
`src/page.js` as a `STYLE` string plus a `clientMain()` function serialized with
`.toString()`. **Implement the design inside that existing structure** — rewrite `STYLE`
and the render functions in `clientMain`, keep Chart.js + the annotation plugin from CDN,
keep the `renderPage(cfg)` export signature, keep `src/index.js` and `src/notion.js`
untouched. Do not introduce a build step, a framework, or npm UI dependencies.

The prototype's logic class mirrors the real functions one-for-one (`rolling`,
`slopePerWeek`, `mondayOf`, `lastVal`, `r0`, `r1`, `fmtD`) — those are already correct in
`src/page.js` and should be reused as-is.

## Fidelity

**High-fidelity.** Exact colors, type sizes, letter-spacing, and layout are specified
below and present in the prototype. Recreate pixel-accurately.

---

## Design tokens

Add these as CSS custom properties on `:root` in `STYLE`, and mirror them as a `C` object
in `clientMain` for Chart.js. Delete the entire existing light/dark token system —
**the dashboard is dark only now**.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#060a07` | page background |
| `--panel` | `#0b120d` | panel / card background |
| `--head` | `#0e1a12` | panel header bar, meal header, active tab bg is `#153223` |
| `--border` | `#1d3f2a` | all borders, dividers, table row rules use `#12211a` |
| `--dim` | `#2c6b45` | small labels, axis ticks, secondary values |
| `--dim2` | `#3d8a5c` | rail footer text (contrast floor) |
| `--mid` | `#4fae76` | body text, primary readable green |
| `--bright` | `#7dfcb0` | section titles, active data, filled ring ticks |
| `--hot` | `#c8ffdd` | hero numbers, hit-target values |
| `--warn` | `#ffc24a` | surplus, missed target, over budget |
| `--crit` | `#ff6a4a` | recovery flags, break-even line, >112% of calorie target |

Supporting fills used in charts and bars: `#2b7d52` (mid-green fill), `#1f5c3c`
(dark-green fill), `#16301f` (empty ring tick / empty bar block), `#6fb98f` (all-time
average dashed line).

**Never use `#1d3f2a` as a text color** — it fails contrast on the panel background. It is
a border value only.

### Typography

Two Google fonts, loaded with `<link>` in `<head>`:
`Share Tech Mono` and `JetBrains Mono` (weights 400, 500, 700).

- Body: `"JetBrains Mono", ui-monospace, monospace`, **`font-weight: 500`**,
  `-webkit-font-smoothing: antialiased`.
- Section titles and meal headers: `"Share Tech Mono", monospace`.
- Every number: `font-variant-numeric: tabular-nums`.

| Role | Size | Weight | Letter-spacing | Color |
|---|---|---|---|---|
| Wordmark `DIETTY` | 17px | Share Tech Mono | `.14em` | bright |
| Panel title `▸ TODAY` | 13px | Share Tech Mono | `.16em` | bright |
| Panel note line | 10px | 500 | `.04em` | dim |
| Rail tab label | 12px | 500 | `.14em` | dim / hot when active |
| Ring hero number | 46px | 700 | — | state color |
| Ring unit caption | 11px | 500 | `.14em` | dim |
| KPI label | 9px | 500 | `.16em` | dim |
| KPI value | 27px | 500 | — | per state |
| KPI sub | 10px | 500 | `.03em` | dim / state |
| Meal header name | 17px | Share Tech Mono | `.18em` | hot |
| Meal header totals | 16px | 700 | `.04em` | bright |
| Meal item | 11px | 500 | — | mid / dim |
| Table header | 9px | 500 | `.14em` | dim |
| Table cell | 11px | 500 | — | mid / state |

All copy is **UPPERCASE** for labels, notes, day names, meal names, and table cells.
Section names are in-world (`▸ TODAY`, `▸ ENERGY BALANCE`, `▸ INTAKE LOG`,
`▸ MASS & 7-DAY TREND`, `▸ RECOVERY SIGNALS`, `▸ WEEKLY SUMMARY`); metric labels stay
plain (`MASS`, `TREND`, `DEFICIT 7-DAY`, `PROTEIN 7-DAY`, `RESTING HR`, `SLEEP HRV`).

### Geometry

- **Border radius: 0 everywhere.** No rounded corners, no shadows, no gradients, no glow,
  no scanlines, no flicker. The look is flat and sharp.
- Panels: `1px solid var(--border)` on `var(--panel)`.
- Panel header bar: `9px 14px` padding, `var(--head)` background, bottom border.
- Panel body padding: `12–16px`. Gap between panels: `14px`. Content area padding: `16px`.
- Grids use `repeat(auto-fit, minmax(Xpx, 1fr))` — see per-section values below.

---

## Shell

```
┌──────────────────────────────────────────────────────────┐
│ DIETTY  [PERSONAL BIOMONITOR]        SYNC …   [↻ REFRESH] │  top bar
├──────────┬───────────────────────────────────────────────┤
│ ◆ STAT   │                                               │
│ ◇ DIET   │            active tab content                 │
│ ◇ TRENDS │                                               │
│ ◇ LOG    │                                               │
│          │                                               │
│ DAY 046  │                                               │
│ CAL WIN… │                                               │
└──────────┴───────────────────────────────────────────────┘
```

**Top bar** — `10px 16px`, `#0b120d`, bottom border, `flex-wrap: wrap`, `gap: 14px`.
Wordmark, then a bordered 11px chip `PERSONAL BIOMONITOR` (`1px solid var(--border)`,
`2px 6px`), spacer, `SYNC <MMM D, H:MM AM>` in 11px dim, then a REFRESH button:
11px, `.1em` tracking, bright text, `1px solid var(--dim)`, `5px 10px`, transparent-ish
panel bg; on hover border and text go bright/hot. The button keeps the current
`load(true)` (`?fresh=1`) behavior and the existing 5-min auto-refresh + stale-on-focus
logic — unchanged.

**Left rail** — `168px` wide, `10px` padding, right + bottom border, background `#080e0a`.
Tabs are buttons: `10px 12px`, 12px / `.14em`, left-aligned, `gap: 9px`, with a 10px
diamond mark `◆` when active / `◇` when not. Active: background `#153223`, border
`1px solid var(--dim)`, color hot. Inactive: transparent background, transparent border,
color dim; hover → border dim, color hot. Tabs are `flex: 0 0 auto` in the column layout —
**they must not stretch to fill the rail height**. A `flex: 1` spacer sits below them,
then a 10px `#3d8a5c` footer block reading `DAY 046 / CAL WINDOW / 07.13 – 08.03`
(day count = number of logged rows, zero-padded to 3; window from
`CALIB_WINDOW_START/END`).

**Responsive** — below **760px** viewport width the shell flips to a column: the rail
becomes a horizontal row of four tabs across the top, each `flex: 1`, and the spacer +
footer block are hidden. Everything else already reflows via `auto-fit` grids and
`flex-wrap`. In the prototype this is done with a JS `resize` listener because inline
styles can't hold media queries — **in `page.js` use a real CSS media query instead.**
Mobile is a first-class target: the user reads this on a phone as often as a laptop.

Tab content is switched by `display: none` / `flex`. Keep all four mounted so Chart.js
instances survive; call `chart.resize()` on tab change.

---

## Screen 1 — STAT (default)

The at-a-glance screen. Answers "how much can I still eat, and am I short on protein."

### TODAY panel

Header: `▸ TODAY` + meta `MONDAY · JUL 27 · REST DAY` (weekday, month/day, day type,
uppercase, 11px dim).

Body: `display: flex; flex-wrap: wrap; gap: 24px; padding: 20px 16px; align-items: center`.

**Ring group** — `flex: 1 1 470px`, itself a wrapping flex row with `gap: 24px`,
centered. This basis matters: at ~692px of content width the two rings must stay on one
row and push the macro column below, not stack on top of each other.

Two rings, identical construction, `214 × 214px`:

- Label above: 10px, `.18em`, dim — `CALORIES REMAINING`, `PROTEIN REMAINING`.
- The arc is an inline `<svg viewBox="0 0 200 200">` containing **44 `<rect>` ticks**,
  each `x=97 y=5 width=6 height=17`, rotated `rotate(i * 360/44, 100, 100)`.
  Lit ticks take the state color; unlit ticks are `#16301f`.
  Number of lit ticks = `round(pct * 44)`.
- Centered overlay (absolute, inset 0, column, centered):
  - 46px / 700 hero number in the state color
  - 11px `.14em` dim unit caption, `margin-top: 7px`
  - 11px mid `eaten / target` line, `margin-top: 9px`
- Caption below the ring: 11px, `.06em`.

**Calories ring** — counts *down*. Fill fraction = `calLeft / calTarget`, where
`calTarget = INTAKE_BASE + workoutCal` and `calLeft = calTarget - eaten`.
Hero number = `abs(round(calLeft))`; caption unit = `KCAL LEFT`, or `KCAL OVER` when
negative. Color: bright when `pct ≤ 1.001`, warn above that, crit above `1.12`.
**When over budget the ring stays fully lit in the warn/crit color** — an unlit ring must
never be the over-budget state, it reads as "no data". Bottom caption:
`ON BUDGET` (mid) / `EATING INTO DEFICIT` (warn) / `DEFICIT LOST` (crit).

**Protein ring** — counts *up*. Fill = `protein / PROTEIN_TARGET_G`. Hero number =
`abs(round(target - protein))`, unit `G TO GO` or `G OVER`. Color bright, hot once met.
Caption: `FLOOR NOT MET` (mid) / `✓ FLOOR MET` (hot).

**Macro bars** — `flex: 1; min-width: 250px`, column, `gap: 14px`. Two rows, CARBS and
FAT, each:
- Top line: name (11px, `.14em`, mid) left; right side `<b>value</b> / target G · 42 LEFT`
  (11px, value in bright/hot).
- Bar: `display: flex; gap: 2px; height: 11px`, **28 equal `flex: 1` blocks**; filled
  blocks `#2b7d52` (carbs) / `#1f5c3c` (fat), empty `#16301f`.
- Helper line below both, 10px dim:
  `CARB TARGET SCALES WITH THE DAY'S ENERGY · FAT IS A FLOOR`.

Carb target is derived exactly as today:
`max(0, (calTarget - PROTEIN_TARGET_G*4 - FAT_TARGET_G*9) / 4)`. Fat target is
`FAT_TARGET_G`.

**Today footer** — a full-width strip on a top border, four equal cells
(`flex: 1; min-width: 130px`, `10px 14px`, right border between): each is a 9px `.16em`
dim label over a 15px value.
`WORKOUT BURN` · `DEFICIT SO FAR` (bright if ≥ target, else warn) · `DAY TYPE` ·
`ITEMS LOGGED` (count of food rows, or `FROM DAILY TOTALS`).

Today's numbers come from the Food Log rows for the latest date; fall back to the Daily
Log's reconciled totals when there are no food rows — same rule as today's code.

### KPI tiles

`display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 10px`.
Tile: panel border/background, `12px 13px 11px`. Label 9px `.16em` dim → value 27px with a
12px dim unit suffix → 10px sub line.

Seven tiles, in order:

1. **MASS** — latest weigh-in, `LB`, hot. Sub: `7-DAY AVG 197.2 LB · ▼ 0.8 LB/WK`.
2. **TREND** — least-squares lb/wk over the calibration window, `LB/WK`.
   Color + sub by band: `IN TARGET BAND 0.4–1.2 LB/WK` (bright),
   `BELOW 0.4 LB/WK → CALIBRATION TRIGGER` (warn),
   `ABOVE 1.2 LB/WK → TOO AGGRESSIVE` (warn).
3. **TOTAL LOST** *(new)* — actual pounds down: first non-null weigh-in minus the latest,
   `LB`, hot. Sub: `CUM. DEFICIT 30,431 KCAL ≈ −8.7 LB PREDICTED`. This is the
   "cumulative deficit → total lb lost" metric requested; it pairs the measured loss with
   the deficit-implied prediction so drift between them is visible.
4. **DEFICIT 7-DAY** — 7-day rolling avg deficit, `KCAL`, bright if ≥ `DEFICIT_TARGET`
   else warn. Sub: `≈ 1.3 LB/WK PREDICTED · TARGET 400`.
5. **PROTEIN 7-DAY** — `G`; bright ≥97%, warn ≥85%, crit below. Sub: `88% OF 145G TARGET`.
6. **RESTING HR** — `BPM`; crit if `+5` or more over `RHR_BASELINE`, with sub
   `+6 VS BASE — RECOVERY FLAG`, else `−2 VS BASE 51`.
7. **SLEEP HRV** — `MS`; crit below `HRV_FLOOR` with sub `BELOW 65 FLOOR`, else
   `+4 VS BASE 82`, and always append ` · 7.4H SLEEP` (7-day avg sleep).

---

## Screen 2 — DIET

### ▸ ENERGY BALANCE (reworked)

Note line: `BURNED (TDEE) VS EATEN · THE SHADED GAP IS THE DEFICIT · DASHED = TARGET
INTAKE (1750 + WORKOUT CAL)`. Height 300px.

The paired-bars chart was illegible. Replace it with **two lines and a filled band**:

- Dataset 0 `Burned (TDEE)` — `borderColor: #7dfcb0`, width 1.5, `pointRadius: 0`,
  `tension: .25`, **`fill: "+1"`**, `backgroundColor: rgba(125,252,176,.16)`.
- Dataset 1 `Eaten` — `borderColor: #2b7d52`, width 1.5, `pointRadius: 0`, `tension: .25`.
- Dataset 2 `Target intake` — `#ffc24a`, width 1, `borderDash: [5,4]`, `pointRadius: 0`.

The shaded area between burned and eaten *is* the daily deficit, so the chart now shows
one idea instead of two bar series to mentally subtract. Add a tooltip `afterBody`
callback printing `Deficit  +612 kcal` for the hovered day.

### Deficit stat strip *(new)*

Directly under the energy chart: `grid-template-columns: repeat(auto-fit, minmax(150px,
1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border)` — the 1px
gaps on a border-colored background produce hairline dividers. Each cell is
`background: var(--panel); padding: 12px 14px`, 9px `.16em` dim label → 25px value with
11px dim unit → 10px sub.

1. `7-DAY AVG DEFICIT` — value bright if ≥400 else warn; sub `+266 VS 400 TARGET`.
2. `ALL-TIME AVG` — hot; sub `ACROSS 46 LOGGED DAYS`.
3. `7-DAY VS ALL-TIME` — signed delta, bright if positive else warn; sub
   `RECENT WEEK RUNNING HARDER` / `RECENT WEEK RUNNING SOFTER`.
4. `TOTAL DEFICIT` — sum of all deficits, thousands-separated, hot; sub
   `≈ −8.7 LB PREDICTED`.

This is the requested "total average deficit over the duration vs the rolling 7-day"
comparison, stated as numbers before it is drawn as a chart.

### ▸ DAILY DEFICIT (re-zeroed)

Note: `ZEROED ON THE 400 KCAL TARGET · UP = AHEAD, DOWN = SHORT · SOLID = 7-DAY AVG,
DASHED = ALL-TIME AVG`. Height 280px. Panel sits in a
`repeat(auto-fit, minmax(320px, 1fr))` grid beside MACROS.

**The y axis is shifted so that 0 = the 400 kcal target**, not zero calories. Plot
`deficit - DEFICIT_TARGET`; the axis tick callback re-signs the value (`+150`, `−220`);
the tooltip label prints both forms:
`vs target  +150 vs target · 550 kcal`.

- Bars: bright when `deficit ≥ target`, warn when short.
- Line `7-day avg`: `#c8ffdd`, width 2, also offset by `-target`.
- Line `All-time avg`: flat line at `avgAll - target`, `#6fb98f`, width 1.5,
  `borderDash: [6,4]` — the 7-day line crossing above or below this dashed baseline is the
  "am I trending harder or softer than my whole run" read.
- Annotations: solid `#4fae76` line at y=0 labelled `TARGET 400` (position `end`), and a
  `#ff6a4a` dashed line at `y = -target` labelled `BREAK EVEN` (position `start`).

### ▸ MACROS

Unchanged in structure — stacked grams, protein bottom. Restyled only: protein `#7dfcb0`,
carbs `#2b7d52`, fat `#154a30`, `borderRadius: 0`, and the protein-target annotation line
in `#ffc24a` dashed, labelled `PROTEIN 145G`.

---

## Screen 3 — TRENDS

### ▸ MASS & 7-DAY TREND
Height 320px. Raw weigh-ins as `pointStyle: "rect"`, radius 2.2, `#2c6b45`, width 1.
7-day rolling average `#7dfcb0` width 2. Calibration window box annotation
`rgba(125,252,176,.07)`, label `CALIBRATION WINDOW`, 9px dim. Y grace `6%`.

### ▸ RECOVERY SIGNALS
Three small multiples in `repeat(auto-fit, minmax(230px, 1fr))` with `gap: 1px` on a
border-colored background (hairline dividers again). Each: a header row with a 10px
`.16em` dim name and a 13px bright current value, then a 140px chart.
All three lines `#7dfcb0` width 1.5, `tension: .3`, no points, x axis hidden,
y `maxTicksLimit: 4`. Reference lines dashed 9px: RHR `BASE 51`; HRV `BASE 82` (dim) and
`FLOOR 65` (crit); SLEEP `TARGET 8H` (mid).

### Weekly averages strip *(new — sits above the table, inside the WEEKLY SUMMARY panel)*

Two side-by-side blocks, `repeat(auto-fit, minmax(300px, 1fr))`, hairline-divided,
`13px 14px` padding:

- `AVG DEFICIT / WEEK` — right-aligned scale note `NOTCH = 400 KCAL TARGET`
- `AVG PROTEIN / WEEK` — `NOTCH = 145 G TARGET`

Each block lists the weeks **chronologically** as rows:
`grid-template-columns: 66px 1fr 70px; gap: 9px; align-items: center`, `gap: 7px` between
rows. Left: week start `JUL 13` (10px dim). Middle: a **24-block segmented bar**, 12px
tall, `gap: 2px`, `flex: 1` blocks. Right: value (11px, hot if target met else warn).

Bar scale: deficit `max(700, highest weekly avg)`; protein
`max(PROTEIN_TARGET_G * 1.25, highest weekly avg)`. Filled blocks are `#7dfcb0` when the
week met target, `#2b7d52` when it didn't. **The block at the target index is painted
`#ffc24a`** regardless of fill — that amber notch is the target marker.

This is what makes weekly avg deficit and protein prominent, as asked.

### ▸ WEEKLY SUMMARY table

Same 11 columns, same math (calendar weeks, Mon–Sun) as the current implementation.
`min-width: 760px` inside an `overflow-x: auto` wrapper. Headers 9px `.16em` dim, first
column left-aligned, rest right. Row rule `1px solid #12211a`. Week range cell in bright
uppercase. `Δ WT` bright when negative, warn when positive. **`AVG DEF` and `AVG PROTEIN`
cells are hot when the week met target and warn when it didn't** — the two columns that
matter are color-coded, everything else stays mid green.

---

## Screen 4 — LOG

### ▸ INTAKE LOG

Note line: `LATEST LOGGED DAY — JUL 27 · 1,190 KCAL · 112G PROTEIN`.
Body padding 14px, meal groups separated by `gap: 22px`.

The Food Log has one row per ingredient, so a day can be long. The meal header must
dominate:

- **Meal header** is a boxed bar: `background: #0e1a12; border: 1px solid var(--border);
  padding: 9px 12px; margin-bottom: 6px`, `display: flex; justify-content: space-between;
  align-items: baseline; gap: 14px; flex-wrap: wrap`.
  - Left: meal name, **Share Tech Mono 17px, `.18em`, hot** — `BREAKFAST`, `LUNCH`, …
  - Right: **16px / 700 bright** totals as `1,190` + 10px dim `KCAL`, a `#1d3f2a` pipe
    separator with `0 8px` margin, `112` + 10px dim `G P`.
- **Items**: 11px, `padding: 3px 0 3px 12px` (indented), food name mid, right side dim
  `310 KCAL · 30G P`, `white-space: nowrap`.

Meal order: `Breakfast, Lunch, Snack, Dinner, Smoothie, Workout Fuel`, then any other meal
names found, appended. Meal names uppercased.

---

## Interactions & behavior

- **Tab switching** — `setState`-equivalent; all four panes stay in the DOM,
  inactive ones `display: none`. Resize live charts after a switch.
- **Refresh** — unchanged: `load(true)` → `/api/data?fresh=1`.
- **Auto-refresh** — unchanged: 5-minute interval while visible, plus a refetch on
  `visibilitychange` when data is older than 2 minutes.
- **Theme toggle — remove it.** Delete the `#theme` button, the `data-theme` attribute
  handling, the `prefers-color-scheme` listener, and the light palette. Dark only.
- **Hover** — rail tabs (border → dim, text → hot), refresh button (border/text → hot),
  Chart.js tooltips (`backgroundColor #0e1a12`, `borderColor #2c6b45`, `cornerRadius: 0`,
  `displayColors: false`, JetBrains Mono body/title).
- **No animations.** Set `animation: false` in the Chart.js base options — an instant
  redraw suits the terminal look and makes the 5-minute auto-refresh unobtrusive.
- **Empty states** — keep the existing guards (`No rows in the Daily Log yet.`,
  `No food-log entries.`), restyled to dim uppercase inside a panel.

## State

No new server state. Client state is: `DATA` (the `/api/data` payload), `lastLoad`
timestamp, and one new value — the **active tab** (`"STAT" | "DIET" | "TRENDS" | "LOG"`,
default `"STAT"`). Consider persisting the active tab in `localStorage` so a refresh
returns to the same screen; the prototype does not.

## Data & config

No changes to `src/index.js`, `src/notion.js`, the `/api/data` shape, or the Notion
queries. All thresholds continue to come from `wrangler.toml [vars]` via `cfg`:
`INTAKE_BASE`, `PROTEIN_TARGET_G`, `FAT_TARGET_G`, `DEFICIT_TARGET`, `RHR_BASELINE`,
`HRV_BASELINE`, `HRV_FLOOR`, `SLEEP_TARGET_H`, `CALIB_WINDOW_START/END`. **Nothing in the
new UI hardcodes a threshold** — every 400 / 145 / 60 / 51 / 82 / 65 / 8 shown in the copy
above is interpolated from `cfg`.

The prototype's `mockData()` exists only to make the design file standalone. Do not port
it.

## Assets

None. No images, no icon files, no SVG illustrations. The only glyphs used are text
characters: `▸ ◆ ◇ ↻ ✓ − + · Δ ▲ ▼ |`. Fonts load from Google Fonts by `<link>`;
Chart.js 4.4.6 and chartjs-plugin-annotation 3.1.0 stay on jsDelivr as they are today.

## Files

- `Dietty Terminal.dc.html` — the design reference (open it in a browser; it runs
  standalone with mocked data).
- `screens/01-stat.png`, `02-diet.png`, `03-trends.png`, `04-log.png` — reference
  captures of the four tabs at ~924px wide.

  > Caveat: these were captured with a DOM re-rendering screenshotter that mis-measures
  > the webfont, so some labels appear to wrap onto two lines (the wordmark chip, ring
  > captions, meal header units, macro bar values). **That wrapping is a capture
  > artifact — in the live design every one of those is a single line.** Open the HTML
  > file for ground truth; use the PNGs for layout and color only.
- Target file to rewrite: `src/page.js` — `STYLE` and `clientMain()`.
- Leave alone: `src/index.js`, `src/notion.js`, `wrangler.toml`, `package.json`.

## Suggested order of work

1. Replace `STYLE` wholesale with the new token set + layout rules (including the 760px
   media query for the rail). Delete the light theme.
2. Rewrite the `renderPage` markup: top bar, rail, four tab panes.
3. Add tab state + switching in `clientMain`.
4. Rewrite `renderToday` (rings as generated SVG ticks, macro block bars, footer strip).
5. Rewrite `renderKPIs` (7 tiles, add TOTAL LOST).
6. Rework the three main charts: energy → filled band, deficit → target-zeroed, macros →
   recolor. Add the deficit stat strip.
7. Add the weekly averages block; recolor the two key table columns.
8. Restyle the intake log headers.
9. `npm run dev`, check at 375px and 1440px, then `npm run deploy`.

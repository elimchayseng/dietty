# 🥗 Dietty

A personal diet + health dashboard served from a **Cloudflare Worker**, pulling
**live from Notion** (your Food Tracker's *Daily Log* and *Food Log* databases).
Every page load re-reads Notion, so it stays current through the day as Coros
pushes RHR/HRV/sleep/workout-calories and you log food.

## What it shows

- **KPI tiles** — weight + 7-day trend (lb/wk, colored against your 0.4–1.2 lb/wk
  calibration band), 7-day avg deficit with predicted loss, 7-day avg protein vs
  target, resting HR / HRV / sleep with under-recovery flags.
- **Weight & 7-day trend** — raw weigh-ins + rolling average, calibration window shaded.
- **Energy balance** — calories eaten vs. burned (TDEE) + dynamic target-intake line.
- **Daily deficit** — diverging bars (deficit vs. surplus) + 7-day rolling line + target.
- **Macros** — stacked protein/carbs/fat grams + protein-target line.
- **Recovery signals** — RHR, HRV, sleep small-multiples with baseline/floor/target refs.
- **Weekly summary** — calendar-week table (avg weight, Δ weight, deficit, est. lb, protein, training days, sleep).
- **Meals** — the latest logged day's food broken down by meal.

Rolling 7-day lines live on the charts; calendar-week rollups live in the table.

## Architecture

- One Worker (`src/index.js`) — router + password gate + edge cache.
- `src/notion.js` — Notion REST calls (API version `2022-06-28`, classic
  `/databases/{id}/query`, paginated).
- `src/page.js` — the dashboard HTML/CSS/JS (Chart.js + annotation plugin from CDN;
  colorblind-safe palette; light/dark themes).
- Data is served at `GET /api/data` and **edge-cached ~2 minutes** to protect Notion
  rate limits. The **↻ Refresh** button bypasses the cache (`?fresh=1`).
- Program constants (targets, baselines, calibration window) live in
  `wrangler.toml [vars]` — edit there, no code change needed.

---

## Setup

### 1. Create a Notion integration token (~3 min)

The Worker needs its own Notion access — the Claude connection can't be reused.

1. Go to **https://www.notion.com/my-integrations** → **New integration**.
2. Name it `dietty`, pick your workspace (*nameless-consulting*), type **Internal**.
   Capabilities: **Read content** is enough.
3. Click **Save**, then copy the **Internal Integration Secret** (starts with `ntn_`).
4. **Share both databases with the integration.** Open the Notion **Food Tracker**
   page → on each embedded database (**Ethan Daily Log - Energy & Weight** and
   **Food Log**) click the **•••** menu → **Connections** → **Connect to** → `dietty`.
   (Connecting the parent page usually cascades, but do both DBs to be safe.)

> The database IDs are already in `wrangler.toml`. They're harmless without the token.

### 2. Install + authenticate wrangler

```bash
cd dietty
npm install
npx wrangler login    # opens a browser to auth your Cloudflare account
```

### 3. Set the secrets

```bash
npx wrangler secret put NOTION_TOKEN         # paste the ntn_… secret
npx wrangler secret put DASHBOARD_PASSWORD   # pick any password for the dashboard
```

### 4. (Optional) Run locally first

Create a `.dev.vars` file (git-ignored) with the same two values:

```
NOTION_TOKEN=ntn_xxx
DASHBOARD_PASSWORD=whatever
```

Then:

```bash
npm run dev        # http://localhost:8787
```

### 5. Deploy

```bash
npm run deploy
```

Wrangler prints your URL (`https://dietty.<your-subdomain>.workers.dev`). Open it,
enter your password, and you're in.

---

## Deploy from GitHub (Cloudflare Workers Builds)

You can have Cloudflare auto-deploy on every `git push`:

1. **Do one manual deploy + set secrets first** (steps 3 & 5 above). This creates
   the Worker and stores `NOTION_TOKEN` / `DASHBOARD_PASSWORD` — secrets persist on
   the Worker across all future deploys, so they never live in the repo or CI.
2. In the **Cloudflare dashboard → Workers & Pages → your `dietty` Worker →
   Settings → Build**, click **Connect** and pick the GitHub repo.
3. Build settings: **Deploy command** `npx wrangler deploy` (build command can be
   left as `npm install`). Root directory `/`.
4. Now every push to the default branch triggers a fresh `wrangler deploy`. The
   `[vars]` in `wrangler.toml` deploy automatically; secrets stay as you set them.

> If you'd rather not do a manual deploy first, you can instead add
> `NOTION_TOKEN` and `DASHBOARD_PASSWORD` as **Secrets** in the Worker's Settings
> after the first CI deploy — the initial build will just error until they exist.

## Keeping it fresh

- Live on every load, with a 2-minute edge cache; **↻ Refresh** forces a fresh pull.
- **Auto-refreshes every 5 minutes** while the tab is open, and re-pulls immediately
  when you switch back to the tab if the data is more than 2 minutes stale.
- Want a custom domain (e.g. `dietty.yourdomain.com`)? Add a `route` in `wrangler.toml`.

## Adjusting the program

Edit `[vars]` in `wrangler.toml` (intake base, protein/deficit targets, RHR/HRV
baselines, calibration window) and re-run `npm run deploy`. No code changes needed.

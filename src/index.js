// Dietty — Cloudflare Worker.
// Routes:
//   GET /            → password gate, then the dashboard shell
//   GET /api/data    → gated JSON of Daily Log + Food Log, edge-cached ~2 min
//   POST /login      → sets auth cookie from the password form
//   GET /logout      → clears the cookie
//
// Secrets:  NOTION_TOKEN, DASHBOARD_PASSWORD   (wrangler secret put …)

import { fetchDailyLog, fetchFoodLog } from "./notion.js";
import { renderPage } from "./page.js";

const COOKIE = "dietty_auth";
const CACHE_TTL = 120; // seconds of edge cache for the Notion pull

function cfgFrom(env) {
  const n = (v, d) => (v == null || v === "" ? d : Number(v));
  return {
    intakeBase: n(env.INTAKE_BASE, 1575),
    proteinTarget: n(env.PROTEIN_TARGET_G, 145),
    fatTarget: n(env.FAT_TARGET_G, 60),
    deficitTarget: n(env.DEFICIT_TARGET, 400),
    rhrBaseline: n(env.RHR_BASELINE, 51),
    hrvBaseline: n(env.HRV_BASELINE, 82),
    hrvFloor: n(env.HRV_FLOOR, 65),
    sleepTarget: n(env.SLEEP_TARGET_H, 8),
    calibStart: env.CALIB_WINDOW_START || "2026-07-13",
    calibEnd: env.CALIB_WINDOW_END || "2026-08-03",
  };
}

// constant-time-ish string compare
function safeEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.get("Cookie") || "";
  raw.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function isAuthed(req, env) {
  if (!env.DASHBOARD_PASSWORD) return true; // no password set → open (warn in README)
  return safeEqual(parseCookies(req)[COOKIE], env.DASHBOARD_PASSWORD);
}

const LOGIN_HTML = (err) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dietty — sign in</title>
<style>
:root{color-scheme:light dark}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0d0d;color:#fff;
font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
@media (prefers-color-scheme:light){body{background:#f9f9f7;color:#0b0b0b}}
form{background:#1a1a19;border:1px solid rgba(255,255,255,.1);padding:28px;border-radius:16px;width:300px;text-align:center}
@media (prefers-color-scheme:light){form{background:#fcfcfb;border-color:rgba(11,11,11,.1)}}
h1{font-size:22px;margin:0 0 4px}p{color:#898781;font-size:13px;margin:0 0 18px}
input{width:100%;padding:11px 12px;border-radius:9px;border:1px solid rgba(128,128,128,.4);
background:transparent;color:inherit;font:inherit;margin-bottom:12px}
button{width:100%;padding:11px;border-radius:9px;border:0;background:#3987e5;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.err{color:#e66767;font-size:13px;margin-bottom:10px}
</style></head><body>
<form method="POST" action="/login">
<h1>🥗 Dietty</h1><p>Enter your dashboard password</p>
${err ? '<div class="err">Wrong password</div>' : ""}
<input type="password" name="password" autofocus autocomplete="current-password" placeholder="Password"/>
<button type="submit">Unlock</button>
</form></body></html>`;

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders },
  });
}

async function handleData(request, env, ctx) {
  const url = new URL(request.url);
  const fresh = url.searchParams.get("fresh") === "1";
  const cache = caches.default;
  const cacheKey = new Request(new URL("/__data-cache", url).toString(), { method: "GET" });

  if (!fresh) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const h = new Headers(hit.headers);
      h.set("X-Cache", "HIT");
      return new Response(hit.body, { status: hit.status, headers: h });
    }
  }

  if (!env.NOTION_TOKEN) {
    return new Response(JSON.stringify({ error: "NOTION_TOKEN secret is not set" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const [daily, food] = await Promise.all([
    fetchDailyLog(env.NOTION_TOKEN, env.DAILY_DB_ID),
    // only need recent food entries for the "latest day" panel
    fetchFoodLog(env.NOTION_TOKEN, env.FOOD_DB_ID, isoDaysAgo(3)).catch(() => []),
  ]);

  const payload = JSON.stringify({ daily, food, generatedAt: new Date().toISOString() });
  const res = new Response(payload, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      "X-Cache": "MISS",
    },
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

function isoDaysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── login / logout ──────────────────────────────────────────────
    if (url.pathname === "/login" && request.method === "POST") {
      const form = await request.formData();
      if (safeEqual(form.get("password"), env.DASHBOARD_PASSWORD)) {
        const cookie = `${COOKIE}=${encodeURIComponent(env.DASHBOARD_PASSWORD)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 90}`;
        return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": cookie } });
      }
      return html(LOGIN_HTML(true), 401);
    }
    if (url.pathname === "/logout") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0` },
      });
    }

    // ── everything else requires auth ────────────────────────────────
    if (!isAuthed(request, env)) {
      if (url.pathname === "/api/data")
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
      return html(LOGIN_HTML(false), 200);
    }

    if (url.pathname === "/api/data") {
      try {
        return await handleData(request, env, ctx);
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e && e.message || e) }), {
          status: 502, headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/") return html(renderPage(cfgFrom(env)));

    return new Response("Not found", { status: 404 });
  },
};

// Notion REST API data layer — reads the Training OS databases.
// Uses the stable 2022-06-28 API version + the classic database query endpoint,
// which works with an internal integration token (see README for setup).
//
// Training OS model (see the "Agent Runbook" page in Notion):
//   Days     — the spine, one row per local calendar date. Health metrics plus
//              closing diet totals (Eaten kcal / Protein g / Carbs g / Fat g).
//   Food Log — one row per item eaten, each linked to its Day. Food Log "Date" is
//              stored in UTC (evening meals land on the next calendar date), so
//              food is always attributed to a day via the Day relation, never Date.

const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

// ─── typed property extractors ──────────────────────────────────────────────
const num = (p) => (p && p.type === "number" ? p.number : null);
// Calendar day (YYYY-MM-DD) from a date property's start value.
const dateStart = (p) => {
  const s = p && p.type === "date" && p.date ? p.date.start : null;
  return s ? s.slice(0, 10) : null;
};
const select = (p) => (p && p.type === "select" && p.select ? p.select.name : null);
const title = (p) =>
  p && p.type === "title" ? p.title.map((t) => t.plain_text).join("") : "";
const richText = (p) =>
  p && p.type === "rich_text" ? p.rich_text.map((t) => t.plain_text).join("") : "";
const relationIds = (p) =>
  p && p.type === "relation" ? p.relation.map((r) => normId(r.id)) : [];
const normId = (id) => String(id || "").replace(/-/g, "").toLowerCase();

async function queryDatabase(token, dbId, body = {}) {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`${API}/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cursor ? { ...body, start_cursor: cursor } : body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    rows.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return rows;
}

// Days — one row per local date. Returns every row (history back to 2025-12 and
// pre-created future days included); trimming to the charted range is done by
// trimDays() once food has been merged in.
export async function fetchDays(token, dbId) {
  const results = await queryDatabase(token, dbId, {
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 100,
  });
  return results
    .map((r) => {
      const p = r.properties;
      const date = dateStart(p["Date"]) || (/^\d{4}-\d{2}-\d{2}$/.test(title(p["Day"])) ? title(p["Day"]) : null);
      return {
        id: normId(r.id),
        date,
        weight: num(p["Weight lb"]),
        workoutCal: num(p["Active kcal"]),
        burned: num(p["Burned kcal"]),
        eaten: num(p["Eaten kcal"]),
        protein: num(p["Protein g"]),
        carbs: num(p["Carbs g"]),
        fat: num(p["Fat g"]),
        deficit: num(p["Deficit"]),
        dayType: select(p["Day Type"]),
        foodLogging: select(p["Food Logging"]),
        sessions: relationIds(p["Sessions"]).length,
        rhr: num(p["RHR"]),
        hrv: num(p["HRV"]),
        sleep: num(p["Sleep h"]),
        notes: richText(p["Notes"]),
      };
    })
    .filter((d) => d.date);
}

// Food Log — per-item entries since `sinceISO` (by UTC Date, which is never
// earlier than the local day, so every item for a local day >= sinceISO is
// included). Items carry their Day link; resolveFoodDates() turns that into the
// local calendar day once the Days rows are in hand.
export async function fetchFoodLog(token, dbId, sinceISO) {
  const filter = sinceISO
    ? { property: "Date", date: { on_or_after: sinceISO } }
    : undefined;
  const results = await queryDatabase(token, dbId, {
    ...(filter ? { filter } : {}),
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 100,
  });
  return results.map((r) => {
    const p = r.properties;
    return {
      dayId: relationIds(p["Day"])[0] || null,
      localDate: dateStart(p["Local Date"]),
      utcDate: dateStart(p["Date"]),
      food: title(p["Food"]),
      meal: select(p["Meal"]),
      method: select(p["Method"]),
      grams: num(p["Grams"]),
      calories: num(p["Calories"]),
      protein: num(p["Protein (g)"]),
      carbs: num(p["Carbs (g)"]),
      fat: num(p["Fat (g)"]),
    };
  });
}

// Attribute each food item to its local day: linked Day's date, else Local Date,
// else the (UTC) Date prefix as a last resort.
export function resolveFoodDates(food, days, sinceISO) {
  const dateById = new Map(days.map((d) => [d.id, d.date]));
  return food
    .map(({ dayId, localDate, utcDate, ...item }) => ({
      date: (dayId && dateById.get(dayId)) || localDate || utcDate,
      ...item,
    }))
    .filter((f) => f.date && (!sinceISO || f.date >= sinceISO));
}

// Days → Eaten kcal / Protein g / Carbs g / Fat g are closing totals, written after
// the day ends. Until then (today, or a day not yet closed) fall back to the live
// sum of that day's Food Log items, mirroring the old "(final)" fields. Days marked
// Untracked/Partial are left blank rather than charted as a misleading low intake.
// Deficit falls back to burned − eaten when both are known.
export function mergeFoodTotals(days, food, sinceISO) {
  const sums = new Map();
  for (const f of food) {
    const s = sums.get(f.date) || { kcal: 0, p: 0, c: 0, f: 0 };
    s.kcal += f.calories || 0; s.p += f.protein || 0; s.c += f.carbs || 0; s.f += f.fat || 0;
    sums.set(f.date, s);
  }
  const r1 = (v) => Math.round(v * 10) / 10;
  for (const d of days) {
    const s = sums.get(d.date);
    const closed = d.eaten != null;
    const skip = d.foodLogging === "Untracked" || d.foodLogging === "Partial";
    if (!closed && s && !skip && d.date >= sinceISO) {
      d.eaten = Math.round(s.kcal);
      d.protein = d.protein ?? r1(s.p);
      d.carbs = d.carbs ?? r1(s.c);
      d.fat = d.fat ?? r1(s.f);
    }
    if (d.deficit == null && d.burned != null && d.eaten != null && closed) {
      d.deficit = Math.round(d.burned - d.eaten);
    }
  }
  return days;
}

// Chart range: from the first day with diet data (weight / intake / TDEE) through
// the last day with any data, capped at today. Days pre-created for the future and
// the run-only history before diet tracking began are dropped.
export function trimDays(days, todayISO) {
  const has = (d) =>
    d.weight != null || d.eaten != null || d.burned != null || d.workoutCal != null ||
    d.rhr != null || d.hrv != null || d.sleep != null;
  const upto = days.filter((d) => d.date <= todayISO);
  const first = upto.findIndex((d) => d.weight != null || d.eaten != null || d.burned != null);
  if (first < 0) return [];
  let last = upto.length - 1;
  while (last > first && !has(upto[last])) last--;
  return upto.slice(first, last + 1).map(({ id, ...rest }) => rest);
}

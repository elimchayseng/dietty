// Notion REST API data layer.
// Uses the stable 2022-06-28 API version + the classic database query endpoint,
// which works with an internal integration token (see README for setup).

const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

// ─── typed property extractors ──────────────────────────────────────────────
const num = (p) => (p && p.type === "number" ? p.number : null);
const dateStart = (p) => (p && p.type === "date" && p.date ? p.date.start : null);
const select = (p) => (p && p.type === "select" && p.select ? p.select.name : null);
const title = (p) =>
  p && p.type === "title" ? p.title.map((t) => t.plain_text).join("") : "";
const richText = (p) =>
  p && p.type === "rich_text" ? p.rich_text.map((t) => t.plain_text).join("") : "";

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

// Daily Log — one row per day, everything the dashboard charts.
export async function fetchDailyLog(token, dbId) {
  const results = await queryDatabase(token, dbId, {
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 100,
  });
  return results
    .map((r) => {
      const p = r.properties;
      return {
        date: dateStart(p["Date"]),
        weight: num(p["Weight (lb)"]),
        workoutCal: num(p["Workout Calories"]),
        burned: num(p["Calories Burned"]),
        eaten: num(p["Calories Eaten (final)"]),
        protein: num(p["Protein Eaten (final)"]),
        carbs: num(p["Carbs Eaten (final)"]),
        fat: num(p["Fat Eaten (final)"]),
        deficit: num(p["Deficit"]),
        dayType: select(p["Day Type"]),
        rhr: num(p["RHR (bpm)"]),
        hrv: num(p["Sleep HRV (ms)"]),
        sleep: num(p["Sleep (h)"]),
        notes: richText(p["Notes"]),
      };
    })
    .filter((d) => d.date);
}

// Food Log — per-item entries; dashboard uses this for the latest day's meal list.
export async function fetchFoodLog(token, dbId, sinceISO) {
  const filter = sinceISO
    ? { property: "Date", date: { on_or_after: sinceISO } }
    : undefined;
  const results = await queryDatabase(token, dbId, {
    ...(filter ? { filter } : {}),
    sorts: [{ property: "Date", direction: "ascending" }],
    page_size: 100,
  });
  return results
    .map((r) => {
      const p = r.properties;
      return {
        date: dateStart(p["Date"]),
        food: title(p["Food"]),
        meal: select(p["Meal"]),
        method: select(p["Method"]),
        grams: num(p["Grams"]),
        calories: num(p["Calories"]),
        protein: num(p["Protein (g)"]),
        carbs: num(p["Carbs (g)"]),
        fat: num(p["Fat (g)"]),
      };
    })
    .filter((d) => d.date);
}

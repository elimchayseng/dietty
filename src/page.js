// Dashboard HTML shell + client code — "Dietty Terminal" green-phosphor redesign.
// The client is authored as a real function (clientMain) and serialized via
// .toString(), so template literals inside stay clean. Server config is injected
// as JSON. renderPage(cfg) is the export consumed by src/index.js.

const CHART_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js";
const ANNO_JS =
  "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0/dist/chartjs-plugin-annotation.min.js";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;700&display=swap";

const STYLE = `
:root{
  --bg:#060a07; --panel:#0b120d; --head:#0e1a12; --border:#1d3f2a;
  --dim:#2c6b45; --dim2:#3d8a5c; --mid:#4fae76; --bright:#7dfcb0; --hot:#c8ffdd;
  --warn:#ffc24a; --crit:#ff6a4a;
}
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; }
body{
  background:var(--bg); color:var(--mid);
  font-family:"JetBrains Mono",ui-monospace,monospace; font-weight:500;
  -webkit-font-smoothing:antialiased;
}
::selection{ background:#7dfcb0; color:#060a07; }

/* top bar */
.topbar{ display:flex; align-items:center; gap:14px; padding:10px 16px; border-bottom:1px solid var(--border); background:var(--panel); flex-wrap:wrap; }
.wordmark{ font-family:"Share Tech Mono",monospace; font-size:17px; letter-spacing:.14em; color:var(--bright); }
.chip{ font-size:11px; letter-spacing:.1em; color:var(--dim); border:1px solid var(--border); padding:2px 6px; white-space:nowrap; }
.grow{ flex:1; }
.sync{ font-size:11px; letter-spacing:.06em; color:var(--dim); white-space:nowrap; }
.refresh{ font:inherit; font-size:11px; letter-spacing:.1em; color:var(--bright); background:var(--panel); border:1px solid var(--dim); padding:5px 10px; cursor:pointer; white-space:nowrap; }
.refresh:hover{ border-color:var(--bright); color:var(--hot); }

/* shell */
.shell{ display:flex; flex-direction:row; align-items:stretch; }
.rail{ display:flex; flex-direction:column; gap:2px; padding:10px; border-right:1px solid var(--border); border-bottom:1px solid var(--border); background:#080e0a; width:168px; flex-shrink:0; }
.tab{ font:inherit; text-align:left; font-size:12px; letter-spacing:.14em; padding:10px 12px; cursor:pointer; border:1px solid transparent; background:transparent; color:var(--dim); display:flex; align-items:center; gap:9px; white-space:nowrap; flex:0 0 auto; }
.tab:hover{ border-color:var(--dim); color:var(--hot); }
.tab.active{ background:#153223; border-color:var(--dim); color:var(--hot); }
.tab .mark{ font-size:10px; }
.rail-spacer{ flex:1; }
.rail-foot{ font-size:10px; line-height:1.7; color:var(--dim2); letter-spacing:.08em; padding:10px 12px; }
.content{ flex:1; min-width:0; padding:16px; }

#status{ font-size:10px; letter-spacing:.1em; color:var(--dim); text-transform:uppercase; margin-bottom:12px; }
#status.err{ color:var(--crit); }
#status:empty{ display:none; margin:0; }

.pane{ display:none; flex-direction:column; gap:14px; }
.pane.active{ display:flex; }

.panel{ border:1px solid var(--border); background:var(--panel); }
.phead{ padding:9px 14px; border-bottom:1px solid var(--border); background:var(--head); }
.phead.row{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.ptitle{ font-family:"Share Tech Mono",monospace; font-size:13px; letter-spacing:.16em; color:var(--bright); }
.pmeta{ font-size:11px; letter-spacing:.06em; color:var(--dim); }
.psub{ font-size:10px; color:var(--dim); letter-spacing:.04em; margin-top:3px; }
.pbody{ padding:12px; position:relative; }

.grid-320{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:14px; }

/* today */
.today-inner{ display:flex; flex-wrap:wrap; gap:24px; padding:20px 16px; align-items:center; }
.ring-group{ display:flex; flex-wrap:wrap; gap:24px; flex:1 1 470px; justify-content:center; }
.ring-card{ display:flex; flex-direction:column; align-items:center; gap:9px; }
.ring-label{ font-size:10px; letter-spacing:.18em; color:var(--dim); white-space:nowrap; }
.ring-wrap{ position:relative; width:214px; height:214px; }
.ring-wrap svg{ display:block; width:100%; height:100%; }
.ring-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.ring-big{ font-size:46px; line-height:1; font-weight:700; font-variant-numeric:tabular-nums; }
.ring-unit{ font-size:11px; letter-spacing:.14em; color:var(--dim); margin-top:7px; white-space:nowrap; }
.ring-of{ font-size:11px; color:var(--mid); margin-top:9px; font-variant-numeric:tabular-nums; }
.ring-cap{ font-size:11px; letter-spacing:.06em; white-space:nowrap; text-align:center; line-height:1.6; }
.macro-col{ flex:1; min-width:250px; display:flex; flex-direction:column; gap:14px; }
.macro-row{ display:flex; flex-direction:column; gap:5px; }
.macro-top{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
.macro-name{ font-size:11px; letter-spacing:.14em; }
.macro-val{ font-size:11px; color:var(--mid); font-variant-numeric:tabular-nums; white-space:nowrap; }
.macro-val b{ font-weight:700; }
.macro-bar{ display:flex; gap:2px; }
.macro-bar>div{ flex:1; }
.macro-help{ font-size:10px; line-height:1.6; color:var(--dim); letter-spacing:.04em; }
.today-foot{ display:flex; flex-wrap:wrap; gap:0; border-top:1px solid var(--border); }
.foot-cell{ flex:1; min-width:130px; padding:10px 14px; border-right:1px solid var(--border); }
.foot-cell .fl{ font-size:9px; letter-spacing:.16em; color:var(--dim); }
.foot-cell .fv{ font-size:15px; margin-top:4px; font-variant-numeric:tabular-nums; }
.foot-cell .fs{ font-size:9px; letter-spacing:.06em; color:var(--dim); margin-top:3px; }

/* kpis */
.kpis{ display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:10px; }
.kpi{ border:1px solid var(--border); background:var(--panel); padding:12px 13px 11px; }
.kpi-label{ font-size:9px; letter-spacing:.16em; color:var(--dim); }
.kpi-val{ font-size:27px; line-height:1.05; margin-top:7px; font-variant-numeric:tabular-nums; }
.kpi-unit{ font-size:12px; color:var(--dim); margin-left:4px; }
.kpi-sub{ font-size:10px; line-height:1.5; margin-top:6px; letter-spacing:.03em; }

/* deficit stat strip */
.defstats{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); }
.defstat{ background:var(--panel); padding:12px 14px; }
.defstat .dl{ font-size:9px; letter-spacing:.16em; color:var(--dim); }
.defstat .dv{ font-size:25px; line-height:1.05; margin-top:6px; font-variant-numeric:tabular-nums; }
.defstat .du{ font-size:11px; color:var(--dim); margin-left:4px; }
.defstat .ds{ font-size:10px; margin-top:5px; letter-spacing:.04em; }

/* recovery */
.recovery{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:1px; background:var(--border); }
.reco{ background:var(--panel); padding:12px; }
.reco-head{ display:flex; justify-content:space-between; align-items:baseline; }
.reco-name{ font-size:10px; letter-spacing:.16em; color:var(--dim); }
.reco-now{ font-size:13px; color:var(--bright); font-variant-numeric:tabular-nums; }
.reco-chart{ height:140px; position:relative; margin-top:8px; }

/* weekly averages bars */
.weekbars{ display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1px; background:var(--border); border-bottom:1px solid var(--border); }
.weekgrp{ background:var(--panel); padding:13px 14px; }
.weekgrp-head{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
.weekgrp-title{ font-size:10px; letter-spacing:.16em; color:var(--bright); }
.weekgrp-note{ font-size:10px; letter-spacing:.08em; color:var(--dim); }
.weekgrp-rows{ display:flex; flex-direction:column; gap:7px; }
.weekrow{ display:grid; grid-template-columns:66px 1fr 70px; gap:9px; align-items:center; }
.weekrow-label{ font-size:10px; color:var(--dim); letter-spacing:.06em; }
.weekrow-bar{ display:flex; gap:2px; height:12px; }
.weekrow-bar>div{ flex:1; }
.weekrow-val{ font-size:11px; text-align:right; font-variant-numeric:tabular-nums; }

/* weekly table */
.tablewrap{ overflow-x:auto; }
table.week{ width:100%; border-collapse:collapse; font-size:11px; min-width:760px; }
table.week th{ padding:8px 10px; border-bottom:1px solid var(--border); font-size:9px; font-weight:500; letter-spacing:.14em; color:var(--dim); white-space:nowrap; }
table.week td{ padding:8px 10px; border-bottom:1px solid #12211a; color:var(--mid); font-variant-numeric:tabular-nums; white-space:nowrap; }

/* intake log */
.meals{ padding:14px; display:flex; flex-direction:column; gap:22px; }
.mealgrp{ display:flex; flex-direction:column; gap:3px; }
.mealhead{ display:flex; justify-content:space-between; align-items:baseline; gap:14px; flex-wrap:wrap; background:var(--head); border:1px solid var(--border); padding:9px 12px; margin-bottom:6px; }
.mealname{ font-family:"Share Tech Mono",monospace; font-size:17px; letter-spacing:.18em; color:var(--hot); }
.mealtot{ font-size:16px; font-weight:700; letter-spacing:.04em; color:var(--bright); font-variant-numeric:tabular-nums; }
.mealtot .u{ font-size:10px; font-weight:500; color:var(--dim); margin-left:4px; }
.mealtot .pipe{ color:var(--border); margin:0 8px; }
.mealitem{ display:flex; justify-content:space-between; gap:12px; font-size:11px; padding:3px 0 3px 12px; }
.mealitem .food{ color:var(--mid); }
.mealitem .det{ color:var(--dim); font-variant-numeric:tabular-nums; white-space:nowrap; }
.empty{ padding:14px; font-size:10px; letter-spacing:.12em; color:var(--dim); }

/* scope bar (phase selector) */
.scopebar{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; padding:8px 12px; border:1px solid var(--border); background:var(--panel); }
.scope-label{ font-size:9px; letter-spacing:.18em; color:var(--dim); }
.scope-btns{ display:flex; gap:4px; flex-wrap:wrap; }
.scope-btn{ font:inherit; font-size:11px; letter-spacing:.1em; color:var(--dim2); background:transparent; border:1px solid var(--border); padding:4px 10px; cursor:pointer; white-space:nowrap; }
.scope-btn:hover{ border-color:var(--dim); color:var(--hot); }
.scope-btn.active{ background:#153223; border-color:var(--bright); color:var(--hot); }
.scope-meta{ font-size:10px; letter-spacing:.06em; color:var(--dim); }

/* phases timeline */
.phase-strip{ display:flex; gap:2px; padding:12px; border-bottom:1px solid var(--border); }
.phase-seg{ font:inherit; min-width:96px; display:flex; flex-direction:column; gap:3px; align-items:flex-start; text-align:left; padding:9px 10px; cursor:pointer; border:1px solid transparent; overflow:hidden; }
.phase-seg.def{ background:#11301f; color:var(--bright); }
.phase-seg.mnt{ background:#231f10; color:#c9a94e; }
.phase-seg.cur{ border-color:var(--bright); box-shadow:inset 0 0 0 1px var(--bright); }
.phase-seg:hover{ border-color:var(--mid); }
.ps-id{ font-family:"Share Tech Mono",monospace; font-size:15px; letter-spacing:.12em; white-space:nowrap; }
.ps-name{ font-size:9px; letter-spacing:.14em; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.ps-dates{ font-size:9px; letter-spacing:.06em; color:var(--dim2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
tr.phase-row{ cursor:pointer; }
tr.phase-row:hover td{ background:#0e1a12; }
tr.phase-row.cur td{ background:#0f2016; }

.foot{ margin-top:18px; font-size:9px; letter-spacing:.16em; color:var(--dim); text-align:center; }

@media (max-width:760px){
  .shell{ flex-direction:column; }
  .rail{ flex-direction:row; width:auto; border-right:0; padding:8px 10px; }
  .tab{ flex:1; justify-content:center; }
  .rail-spacer,.rail-foot{ display:none; }
}
`;

function clientMain() {
  const CFG = window.__CFG__;
  const el = (id) => document.getElementById(id);

  const C = {
    bg:"#060a07", panel:"#0b120d", head:"#0e1a12", border:"#1d3f2a",
    dim:"#2c6b45", dim2:"#3d8a5c", mid:"#4fae76", bright:"#7dfcb0", hot:"#c8ffdd",
    warn:"#ffc24a", crit:"#ff6a4a",
  };
  const FILL = { carb:"#2b7d52", fat:"#1f5c3c", empty:"#16301f", allAvg:"#6fb98f", macFat:"#154a30" };

  let DATA = null;
  let charts = [];
  let lastLoad = 0;
  let tab = (function(){ try { return localStorage.getItem("dietty_tab") || "STAT"; } catch(e){ return "STAT"; } })();
  const AUTO_MS = 5 * 60 * 1000;
  const STALE_MS = 2 * 60 * 1000;

  // ── helpers (mirror src/notion + prototype) ──────────────────────────────
  const r0 = (x) => (x==null||isNaN(x) ? null : Math.round(x));
  const r1 = (x) => (x==null||isNaN(x) ? null : Math.round(x*10)/10);
  const lastVal = (a,k) => { for(let i=a.length-1;i>=0;i--) if(a[i][k]!=null) return a[i][k]; return null; };
  const fmtD = (iso) => new Date(iso+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
  function rolling(rows,key,win){ win=win||7; return rows.map((_,i)=>{ let s=0,n=0; for(let j=Math.max(0,i-win+1);j<=i;j++){ const v=rows[j][key]; if(v!=null){s+=v;n++;} } return n?s/n:null; }); }
  function slopePerWeek(rows){
    if(!rows.length) return null;
    const pts=[]; const t0=new Date(rows[0].date+"T00:00:00").getTime();
    for(const r of rows) if(r.weight!=null) pts.push([ (new Date(r.date+"T00:00:00").getTime()-t0)/86400000, r.weight ]);
    if(pts.length<2) return null;
    const n=pts.length; let sx=0,sy=0,sxx=0,sxy=0;
    for(const [x,y] of pts){ sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; }
    const d=n*sxx-sx*sx; if(!d) return null;
    return ((n*sxy-sx*sy)/d)*7;
  }
  function mondayOf(iso){ const d=new Date(iso+"T00:00:00"); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return d.toISOString().slice(0,10); }

  function ticks(pct, color){
    const n=44, p=Math.max(0,Math.min(pct||0,1)), filled=Math.round(p*n), step=360/n, out=[];
    for(let i=0;i<n;i++) out.push({ t:"rotate("+(i*step).toFixed(2)+" 100 100)", c:i<filled?color:FILL.empty });
    return out;
  }
  function blocks(pct, color, n){
    n=n||28; const p=Math.max(0,Math.min(pct||0,1)), filled=Math.round(p*n), out=[];
    for(let i=0;i<n;i++) out.push({ c:i<filled?color:FILL.empty });
    return out;
  }
  function blocksT(pct, targetPct, color, n){
    n=n||24; const filled=Math.round(Math.max(0,Math.min(pct||0,1))*n);
    const ti=Math.min(n-1,Math.max(0,Math.round(targetPct*n)-1)), out=[];
    for(let i=0;i<n;i++) out.push({ c:i===ti?"#ffc24a":i<filled?color:FILL.empty });
    return out;
  }

  function setStatus(msg, err){ const s=el("status"); s.textContent=msg||""; s.classList.toggle("err",!!err); }

  // ── load ─────────────────────────────────────────────────────────────────
  async function load(fresh){
    setStatus("SYNCING FROM NOTION…");
    try{
      const r = await fetch("/api/data"+(fresh?"?fresh=1":""), {cache:"no-store"});
      if(!r.ok) throw new Error(await r.text());
      DATA = await r.json();
      lastLoad = Date.now();
      render();
      setStatus("");
    }catch(e){ setStatus("COULDN’T LOAD: "+(e && e.message || e), true); }
  }

  // ── phases ───────────────────────────────────────────────────────────────
  // CFG.phases is the hard-wired list from wrangler.toml (PHASES). Each day is
  // judged against the targets of the phase it falls in; a phase can change its
  // targets part-way through via `changes` (e.g. Phase 1's base bump on 8/17).
  const PH = CFG.phases || [];
  const LEAD_DAYS = 7; // context days drawn (shaded, excluded from stats) before a phase
  const isoAdd = (iso,n) => { const d=new Date(iso+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
  const daysBetween = (a,b) => Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/86400000);
  const inPhase = (p,iso) => iso>=p.start && (!p.end || iso<=p.end);
  function phaseOf(iso){ for(let i=PH.length-1;i>=0;i--) if(inPhase(PH[i],iso)) return PH[i]; return null; }
  function targetsFor(iso){
    const p = phaseOf(iso);
    const t = p ? { intakeBase:p.intakeBase, protein:p.protein, deficit:p.deficit }
                : { intakeBase:CFG.intakeBase, protein:CFG.proteinTarget, deficit:CFG.deficitTarget };
    if(p) for(const c of p.changes||[]) if(iso>=c.from){
      if(c.intakeBase!=null) t.intakeBase=c.intakeBase;
      if(c.protein!=null) t.protein=c.protein;
      if(c.deficit!=null) t.deficit=c.deficit;
    }
    t.phase = p;
    return t;
  }
  const phaseTag = (p) => p ? "PHASE "+p.id+(p.name?" · "+p.name:"") : "UNPHASED";
  const isDeficitPhase = (p) => !!p && p.deficit > 0;
  let scope = (function(){ try { return localStorage.getItem("dietty_scope") || "CURRENT"; } catch(e){ return "CURRENT"; } })();

  // ── compute all derived values ───────────────────────────────────────────
  // rows   = days inside the selected scope (stats/averages only see these)
  // all    = every day (TODAY always reads the latest day, whatever the scope)
  // sel    = selected phase (null = ALL), cur = phase today falls in
  function computeVals(rows, all, food, sel, cur){
    const dr = all[all.length-1];
    const day = dr.date;
    const tToday = dr.tgt;
    const ft = food.filter((f)=>f.date===day);
    let eaten=0,pg=0,cg=0,fg=0;
    ft.forEach((f)=>{ eaten+=f.calories||0; pg+=f.protein||0; cg+=f.carbs||0; fg+=f.fat||0; });
    if(!ft.length){ eaten=dr.eaten||0; pg=dr.protein||0; cg=dr.carbs||0; fg=dr.fat||0; }

    const workout = dr.workoutCal||0;
    const calTarget = tToday.intakeBase + workout;
    const cTarget = Math.max(0, (calTarget - tToday.protein*4 - CFG.fatTarget*9)/4);
    const calPct = calTarget>0 ? eaten/calTarget : 0;
    const calLeft = calTarget - eaten;
    const calColor = calPct>1.12 ? C.crit : calPct>1.001 ? C.warn : C.bright;
    const pPct = pg/tToday.protein;
    const pLeft = tToday.protein - pg;
    const pColor = pPct>=1 ? C.hot : C.bright;
    // Net deficit for today: estimated TDEE (phase maintenance base + workout) − eaten.
    // Computed here rather than from Notion's Burned kcal, which isn't reliably
    // written with the maintenance base mid-day.
    const maintBase = tToday.intakeBase + tToday.deficit;
    const tdeeEst = maintBase + workout;
    const netDef = tdeeEst - eaten;
    const netColor = netDef>=tToday.deficit ? C.bright : netDef>=0 ? C.warn : C.crit;
    const signed = (v)=> (v>=0?"+":"−")+Math.abs(r0(v));

    // scope-level targets: the selected phase's (as of its last day), or today's for ALL
    const ref = sel || cur;
    const tScope = rows.length ? rows[rows.length-1].tgt : tToday;
    const scopeWord = sel ? "PHASE" : "ALL-TIME";

    const wRoll = rolling(rows,"weight",7);
    const dRoll = rolling(rows,"deficit",7);
    const pRoll = rolling(rows,"protein",7);
    const wNow = lastVal(rows,"weight");
    const nn = wRoll.filter((v)=>v!=null);
    const rollNow = nn[nn.length-1];
    const roll7ago = nn.length>=8 ? nn[nn.length-8] : nn[0];
    const wkDelta = rollNow!=null && roll7ago!=null && nn.length>1 ? rollNow-roll7ago : null;
    const trendRows = sel ? rows : rows.filter((r)=>r.date>=CFG.calibStart);
    const weighIns = trendRows.filter((r)=>r.weight!=null).length;
    const trend = slopePerWeek(trendRows.length>=2 ? trendRows : rows);
    const loss = trend==null ? null : -trend;
    let trendColor=C.mid, trendNote = weighIns<2 ? "NEEDS 2+ WEIGH-INS IN PHASE" : "—";
    if(loss!=null){
      if(!isDeficitPhase(ref)){
        if(Math.abs(loss)<=0.3){ trendColor=C.bright; trendNote="HOLDING · WITHIN ±0.3 LB/WK"; }
        else { trendColor=C.warn; trendNote=(loss>0?"DRIFTING DOWN":"DRIFTING UP")+" · MAINTENANCE ±0.3"; }
      }
      else if(loss<0.4){ trendColor=C.warn; trendNote="BELOW 0.4 LB/WK → CALIBRATION TRIGGER"; }
      else if(loss>1.2){ trendColor=C.warn; trendNote="ABOVE 1.2 LB/WK → TOO AGGRESSIVE"; }
      else { trendColor=C.bright; trendNote="IN TARGET BAND 0.4–1.2 LB/WK"; }
      if(sel && weighIns<10) trendNote += " · "+weighIns+" WEIGH-INS, EARLY";
      if(!sel){ trendColor=C.mid; trendNote="SINCE CALIBRATION · MIXES DEFICIT + MAINTENANCE PHASES"; }
    }
    const dAvg = dRoll.filter((v)=>v!=null).slice(-1)[0];
    const impliedLoss = dAvg==null ? null : (dAvg*7)/3500;
    const pAvg = pRoll.filter((v)=>v!=null).slice(-1)[0];
    const pAvgPct = pAvg==null ? null : (pAvg/tScope.protein)*100;
    const rhr = lastVal(rows,"rhr"), hrv = lastVal(rows,"hrv");
    const rhrD = rhr==null ? null : rhr-CFG.rhrBaseline;
    const hrvD = hrv==null ? null : hrv-CFG.hrvBaseline;
    const sleepAvg = rolling(rows,"sleep",7).filter((v)=>v!=null).slice(-1)[0];
    const cumDef = rows.reduce((s,r)=>s+(r.deficit||0),0);
    const cumLb = cumDef/3500;
    const wFirst = rows.find((r)=>r.weight!=null);
    const actualLb = wFirst && wNow!=null ? wFirst.weight-wNow : null;

    const arrow = (x)=> x==null ? "" : x>0 ? "▲" : "▼";
    // signed 1-dp value; "−" = loss. Near-zero prints 0.0 instead of a stray "−0".
    const lossFmt = (v)=> v==null ? "—" : Math.abs(v)<0.05 ? "0.0" : (v>0?"−":"+")+Math.abs(v).toFixed(1);
    const kpis = [
      { label:"MASS", val:wNow==null?"—":r1(wNow), unit:"LB", color:C.hot,
        sub:"7-DAY AVG "+(rollNow==null?"—":r1(rollNow)+" LB")+(wkDelta==null?"":" · "+arrow(wkDelta)+" "+Math.abs(r1(wkDelta))+" LB/WK"), subColor:C.dim },
      { label:sel?"PHASE TREND":"TREND", val:lossFmt(loss), unit:"LB/WK", color:trendColor, sub:trendNote, subColor:trendColor },
      { label:sel?"CHANGE THIS PHASE":"TOTAL LOST", val:lossFmt(actualLb), unit:"LB", color:C.hot,
        sub:(wFirst?"FROM "+r1(wFirst.weight)+" LB ON "+fmtD(wFirst.date).toUpperCase()+" · ":"")+"CUM. DEFICIT "+r0(cumDef).toLocaleString()+" KCAL ≈ "+lossFmt(cumLb)+" LB", subColor:C.dim },
      { label:"DEFICIT 7-DAY", val:dAvg==null?"—":r0(dAvg), unit:"KCAL", color:dAvg>=tScope.deficit?C.bright:C.warn,
        sub:impliedLoss==null?"—":"≈ "+r1(impliedLoss)+" LB/WK PREDICTED · TARGET "+tScope.deficit, subColor:C.dim },
      { label:"PROTEIN 7-DAY", val:pAvg==null?"—":r0(pAvg), unit:"G", color:pAvgPct>=97?C.bright:pAvgPct>=85?C.warn:C.crit,
        sub:pAvgPct==null?"—":r0(pAvgPct)+"% OF "+tScope.protein+"G TARGET", subColor:pAvgPct>=97?C.bright:C.warn },
      { label:"RESTING HR", val:rhr==null?"—":r0(rhr), unit:"BPM", color:rhrD>=5?C.crit:C.hot,
        sub:rhrD==null?"—":rhrD>=5?"+"+r0(rhrD)+" VS BASE — RECOVERY FLAG":(rhrD>=0?"+":"")+r0(rhrD)+" VS BASE "+CFG.rhrBaseline, subColor:rhrD>=5?C.crit:C.dim },
      { label:"SLEEP HRV", val:hrv==null?"—":r0(hrv), unit:"MS", color:hrv<CFG.hrvFloor?C.crit:C.hot,
        sub:(hrv<CFG.hrvFloor?"BELOW "+CFG.hrvFloor+" FLOOR":(hrvD>=0?"+":"")+r0(hrvD)+" VS BASE "+CFG.hrvBaseline)+(sleepAvg==null?"":" · "+r1(sleepAvg)+"H SLEEP"), subColor:hrv<CFG.hrvFloor?C.crit:C.dim },
    ];

    const barDef = (name,val,target,unit,color)=>({
      name, unit, val:r0(val), target:r0(target),
      left: target-val>=0 ? r0(target-val)+" LEFT" : r0(val-target)+" OVER",
      blocks: blocks(target>0?val/target:0, color, 28),
    });
    const macroBars = [ barDef("CARBS",cg,cTarget,"G",FILL.carb), barDef("FAT",fg,CFG.fatTarget,"G",FILL.fat) ];

    const todayFoot = [
      { label:"EST. BURN (TDEE)", val:r0(tdeeEst)+" KCAL", color:C.hot, sub:maintBase+" BASE + "+r0(workout)+" WORKOUT" },
      { label:"NET DEFICIT", val:signed(netDef)+" KCAL", color:netColor, sub:tToday.deficit>0?"TARGET +"+tToday.deficit+" · "+(netDef>=tToday.deficit?"ON TRACK":signed(netDef-tToday.deficit)+" VS TARGET"):"MAINTENANCE · TARGET 0" },
      { label:"DAY TYPE", val:(dr.dayType||"—").toUpperCase(), color:C.hot },
      { label:"ITEMS LOGGED", val:ft.length?String(ft.length):"FROM DAILY TOTALS", color:C.hot },
    ];

    // weekly table — calendar weeks, clipped to the scope
    const showPhaseCol = !sel;
    const weekCols = (showPhaseCol?["WEEK","PHASE"]:["WEEK"]).concat(["DAYS","AVG WT","Δ WT","AVG KCAL IN","AVG DEF","TOT DEF","EST Δ","AVG PROTEIN","TRAIN","AVG SLEEP"])
      .map((name,i)=>({ name, align:i===0||(showPhaseCol&&i===1)?"left":"right" }));
    const groups={};
    for(const r of rows){ const k=mondayOf(r.date); (groups[k]=groups[k]||[]).push(r); }
    const avg=(a,k)=>{ let s=0,n=0; for(const r of a) if(r[k]!=null){s+=r[k];n++;} return n?s/n:null; };
    const sum=(a,k)=>{ let s=0,n=0; for(const r of a) if(r[k]!=null){s+=r[k];n++;} return n?s:null; };
    const avgT=(a,k)=>a.reduce((s,r)=>s+r.tgt[k],0)/a.length;
    let prevW=null; const weekRows=[]; const weekAgg=[];
    for(const k of Object.keys(groups).sort()){
      const g=groups[k]; const e=new Date(k+"T00:00:00"); e.setDate(e.getDate()+6);
      const range=fmtD(k)+"–"+e.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      const w=avg(g,"weight"); const dW=w!=null&&prevW!=null?w-prevW:null; if(w!=null) prevW=w;
      const totDef=sum(g,"deficit"); const estLb=totDef==null?null:totDef/3500;
      const train=g.filter((r)=>r.sessions>0).length;
      const pa=avg(g,"protein"), da=avg(g,"deficit");
      const tDef=avgT(g,"deficit"), tPro=avgT(g,"protein");
      const ids=[...new Set(g.map((r)=>r.tgt.phase?r.tgt.phase.id:"—"))].join("/");
      const cell=(v,align,color)=>({ v:v==null?"—":v, align:align||"right", color:color||C.mid });
      const cells=[ cell(range.toUpperCase(),"left",C.bright) ];
      if(showPhaseCol) cells.push(cell("P"+ids,"left",C.dim2));
      cells.push(
        cell(g.length), cell(r1(w)),
        cell(dW==null?null:(dW<0?"−":"+")+Math.abs(r1(dW)),"right",dW==null?C.mid:dW<0?C.bright:C.warn),
        cell(r0(avg(g,"eaten"))),
        cell(r0(da),"right",da>=tDef?C.hot:C.warn),
        cell(r0(totDef)),
        cell(estLb==null?null:(estLb>=0?"−":"+")+Math.abs(r1(estLb))+" LB","right",C.bright),
        cell(pa==null?null:r0(pa)+"G","right",pa>=tPro?C.hot:C.warn), cell(train), cell(avg(g,"sleep")==null?null:r1(avg(g,"sleep"))+"H"),
      );
      weekRows.push({ cells });
      weekAgg.push({ label:fmtD(k).toUpperCase(), def:da, pro:pa, tDef, tPro });
    }
    weekRows.reverse();

    const defScale = Math.max(700, ...weekAgg.map((x)=>x.def||0));
    const proScale = Math.max(tScope.protein*1.25, ...weekAgg.map((x)=>Math.max(x.pro||0, x.tPro)));
    const weekBarGroups = [
      { title:"AVG DEFICIT / WEEK", scaleNote:"NOTCH = PHASE TARGET",
        rows:weekAgg.map((x)=>({ label:x.label, val:x.def==null?"—":r0(x.def)+" KCAL",
          color:x.def>=x.tDef?C.hot:C.warn,
          blocks:blocksT(Math.max(0,x.def||0)/defScale, x.tDef/defScale, x.def>=x.tDef?C.bright:FILL.carb) })) },
      { title:"AVG PROTEIN / WEEK", scaleNote:"NOTCH = PHASE TARGET",
        rows:weekAgg.map((x)=>({ label:x.label, val:x.pro==null?"—":r0(x.pro)+" G",
          color:x.pro>=x.tPro?C.hot:C.warn,
          blocks:blocksT((x.pro||0)/proScale, x.tPro/proScale, x.pro>=x.tPro?C.bright:FILL.carb) })) },
    ];

    const allDefs = rows.map((r)=>r.deficit).filter((v)=>v!=null);
    const avgScope = allDefs.length ? allDefs.reduce((a,b)=>a+b,0)/allDefs.length : null;
    const dDelta = dAvg!=null && avgScope!=null ? dAvg-avgScope : null;
    const defStats = [
      { label:"7-DAY AVG DEFICIT", val:dAvg==null?"—":r0(dAvg), unit:"KCAL", color:dAvg>=tScope.deficit?C.bright:C.warn,
        sub:dAvg==null?"—":(dAvg-tScope.deficit>=0?"+":"−")+Math.abs(r0(dAvg-tScope.deficit))+" VS "+tScope.deficit+" TARGET", subColor:dAvg>=tScope.deficit?C.bright:C.warn },
      { label:scopeWord+" AVG", val:avgScope==null?"—":r0(avgScope), unit:"KCAL", color:C.hot,
        sub:"ACROSS "+allDefs.length+" LOGGED DAYS", subColor:C.dim },
      { label:"7-DAY VS "+scopeWord, val:dDelta==null?"—":(dDelta>=0?"+":"−")+Math.abs(r0(dDelta)), unit:"KCAL", color:dDelta>=0?C.bright:C.warn,
        sub:dDelta==null?"—":dDelta>=0?"RECENT WEEK RUNNING HARDER":"RECENT WEEK RUNNING SOFTER", subColor:C.dim },
      { label:sel?"PHASE DEFICIT":"TOTAL DEFICIT", val:r0(cumDef).toLocaleString(), unit:"KCAL", color:C.hot,
        sub:"≈ "+lossFmt(cumLb)+" LB PREDICTED", subColor:C.dim },
    ];

    const order = ["Breakfast","Lunch","Snack","Dinner","Smoothie","Workout Fuel"];
    const byMeal = {};
    for(const f of ft) (byMeal[f.meal||"Other"]=byMeal[f.meal||"Other"]||[]).push(f);
    const mealGroups = [];
    for(const m of order.concat(Object.keys(byMeal).filter((x)=>!order.includes(x)))){
      const items=byMeal[m]; if(!items) continue;
      let c=0,p=0;
      const list=items.map((f)=>{ c+=f.calories||0; p+=f.protein||0; return { food:f.food, detail:r0(f.calories)+" KCAL · "+r0(f.protein||0)+"G P" }; });
      mealGroups.push({ name:m.toUpperCase(), kcal:r0(c).toLocaleString(), prot:r0(p), items:list });
    }

    const g = new Date(DATA.generatedAt);
    const curDay = cur ? daysBetween(cur.start, day)+1 : all.length;
    return {
      kpis, macroBars, todayFoot, weekCols, weekRows, weekBarGroups, defStats, mealGroups,
      syncedAt: g.toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).toUpperCase() + (DATA.cached?" (CACHED)":""),
      railFoot: cur ? "PHASE "+cur.id+"<br>"+(cur.name||"")+"<br>DAY "+String(curDay).padStart(3,"0") : "DAY "+String(curDay).padStart(3,"0"),
      todayMeta: new Date(day+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}).toUpperCase()
        + (dr.dayType?" · "+dr.dayType.toUpperCase()+" DAY":"")
        + (cur?" · PHASE "+cur.id+" DAY "+curDay:""),
      calTicks: ticks(calLeft>=0?calLeft/calTarget:1, calColor),
      proTicks: ticks(pPct, pColor),
      calBig: Math.abs(r0(calLeft)), calBigUnit: calLeft>=0?"KCAL LEFT":"KCAL OVER", calBigColor: calColor,
      calEaten: r0(eaten), calTarget: r0(calTarget),
      calCap: calLeft>=0?"ON BUDGET":calPct>1.12?(tToday.deficit>0?"DEFICIT LOST":"OVER MAINTENANCE"):(tToday.deficit>0?"EATING INTO DEFICIT":"ABOVE MAINTENANCE"),
      calCapColor: calLeft>=0?C.mid:calColor,
      calNet: "NET DEFICIT "+signed(netDef)+" KCAL", calNetColor: netColor,
      proBig: Math.abs(r0(pLeft)), proBigUnit: pLeft>0?"G TO GO":"G OVER", proBigColor: pColor,
      proEaten: r0(pg), proTarget: tToday.protein,
      proCap: pLeft>0?"FLOOR NOT MET":"✓ FLOOR MET",
      proCapColor: pLeft>0?C.mid:C.hot,
      rhrNow: rhr==null?"—":r0(rhr)+" BPM",
      hrvNow: hrv==null?"—":r0(hrv)+" MS",
      sleepNow: lastVal(rows,"sleep")==null?"—":r1(lastVal(rows,"sleep"))+" H",
      mealsHead: "LATEST LOGGED DAY — "+fmtD(day).toUpperCase()+" · "+r0(ft.reduce((s,f)=>s+(f.calories||0),0))+" KCAL · "+r0(ft.reduce((s,f)=>s+(f.protein||0),0))+"G PROTEIN",
    };
  }

  // Per-phase summary for the PHASES panel (always every phase, ignores scope).
  function phaseSummary(all, cur){
    const today = all[all.length-1].date;
    return PH.filter((p)=>p.start<=today).map((p)=>{
      const rs = all.filter((r)=>inPhase(p,r.date));
      const end = p.end && p.end<today ? p.end : today;
      const span = daysBetween(p.start, end)+1;
      const logged = rs.filter((r)=>r.eaten!=null).length;
      const ws = rs.filter((r)=>r.weight!=null);
      const w0 = ws.length?ws[0].weight:null, w1 = ws.length?ws[ws.length-1].weight:null;
      const slope = slopePerWeek(rs);
      const defs = rs.map((r)=>r.deficit).filter((v)=>v!=null);
      const pros = rs.map((r)=>r.protein).filter((v)=>v!=null);
      const mean = (a)=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
      return { p, span, logged, w0, w1, dW:w0!=null&&w1!=null?w1-w0:null, slope, avgDef:mean(defs), avgPro:mean(pros),
        tgtDef:p.deficit, tgtPro:p.protein, isCur:!!cur && cur.id===p.id, end:p.end };
    });
  }

  // ── DOM fill ─────────────────────────────────────────────────────────────
  function ringCardHTML(label, tks, big, bigColor, unit, of, cap, capColor){
    const rects = tks.map((tk)=>'<rect x="97" y="5" width="6" height="17" fill="'+tk.c+'" transform="'+tk.t+'"></rect>').join("");
    return '<div class="ring-card"><div class="ring-label">'+label+'</div>'
      +'<div class="ring-wrap"><svg viewBox="0 0 200 200">'+rects+'</svg>'
      +'<div class="ring-center"><div class="ring-big" style="color:'+bigColor+'">'+big+'</div>'
      +'<div class="ring-unit">'+unit+'</div><div class="ring-of">'+of+'</div></div></div>'
      +'<div class="ring-cap" style="color:'+capColor+'">'+cap+'</div></div>';
  }
  function macroRowHTML(mb){
    const bk = mb.blocks.map((b)=>'<div style="background:'+b.c+'"></div>').join("");
    return '<div class="macro-row"><div class="macro-top">'
      +'<span class="macro-name" style="color:'+C.mid+'">'+mb.name+'</span>'
      +'<span class="macro-val"><b style="color:'+C.bright+'">'+mb.val+'</b> / '+mb.target+' '+mb.unit+' · '+mb.left+'</span></div>'
      +'<div class="macro-bar" style="height:11px">'+bk+'</div></div>';
  }
  const fmtRange = (p) => fmtD(p.start).toUpperCase()+" → "+(p.end?fmtD(p.end).toUpperCase():"NOW");

  function scopeBarHTML(sel, cur){
    const btn = (key,label,active)=>'<button class="scope-btn'+(active?' active':'')+'" data-scope="'+key+'">'+label+'</button>';
    const btns = PH.filter((p)=>p.start<=DATA.daily[DATA.daily.length-1].date).map((p)=>
      btn(cur&&p.id===cur.id?"CURRENT":p.id, "P"+p.id+(cur&&p.id===cur.id?" ◆":""), !!sel && sel.id===p.id)).join("")
      + btn("ALL","ALL",!sel);
    const meta = sel
      ? phaseTag(sel)+" · "+fmtRange(sel)+" · STATS COUNT THIS PHASE ONLY"
      : "ALL HISTORY · PHASES SHADED ON CHARTS";
    return '<span class="scope-label">VIEW</span><div class="scope-btns">'+btns+'</div><span class="scope-meta">'+meta+'</span>';
  }

  function phasesHTML(sum){
    if(!sum.length) return '<div class="empty">NO PHASES CONFIGURED — SET PHASES IN WRANGLER.TOML.</div>';
    const total = sum.reduce((s,x)=>s+x.span,0);
    const strip = '<div class="phase-strip">'+sum.map((x)=>{
      const kind = isDeficitPhase(x.p) ? "def" : "mnt";
      return '<button class="phase-seg '+kind+(x.isCur?' cur':'')+'" data-scope="'+(x.isCur?"CURRENT":x.p.id)+'" style="flex:'+x.span+' 1 0">'
        +'<span class="ps-id">P'+x.p.id+(x.isCur?' ◆':'')+'</span><span class="ps-name">'+(x.p.name||"")+'</span>'
        +'<span class="ps-dates">'+fmtRange(x.p)+' · '+x.span+'D</span></button>';
    }).join("")+'</div>';
    const pct = (a,b)=> b ? Math.round(a/b*100) : 0;
    const sign = (v)=> v==null ? "—" : Math.abs(v)<0.05 ? "0.0" : (v>0?"+":"−")+Math.abs(v).toFixed(1);
    const head = ["PHASE","DATES","DAYS","LOGGED","START WT","LATEST WT","Δ WT","LB/WK","AVG DEF / TGT","AVG PROTEIN / TGT"];
    const rowsHTML = sum.slice().reverse().map((x)=>{
      const lc = pct(x.logged,x.span), loggedColor = lc>=80?C.bright:lc>=50?C.warn:C.crit;
      const defColor = x.avgDef==null?C.mid:x.avgDef>=x.tgtDef?C.bright:C.warn;
      const proColor = x.avgPro==null?C.mid:x.avgPro>=x.tgtPro*0.97?C.bright:C.warn;
      const td=(v,c,al)=>'<td style="text-align:'+(al||"right")+';color:'+(c||C.mid)+'">'+v+'</td>';
      return '<tr class="phase-row'+(x.isCur?' cur':'')+'" data-scope="'+(x.isCur?"CURRENT":x.p.id)+'">'
        + td("P"+x.p.id+" · "+(x.p.name||"")+(x.isCur?" ◆":""), x.isCur?C.hot:C.bright, "left")
        + td(fmtRange(x.p), C.dim2, "left")
        + td(x.span) + td(x.logged+" · "+lc+"%", loggedColor)
        + td(x.w0==null?"—":r1(x.w0)) + td(x.w1==null?"—":r1(x.w1))
        + td(sign(x.dW), x.dW==null?C.mid:x.dW<0?C.bright:C.warn)
        + td(x.slope==null||x.span<7?"—":sign(x.slope))
        + td((x.avgDef==null?"—":r0(x.avgDef))+" / "+x.tgtDef, defColor)
        + td((x.avgPro==null?"—":r0(x.avgPro)+"G")+" / "+x.tgtPro+"G", proColor)
        + '</tr>';
    }).join("");
    return strip + '<div class="tablewrap"><table class="week"><thead><tr>'
      + head.map((h,i)=>'<th style="text-align:'+(i<2?"left":"right")+'">'+h+'</th>').join("")
      + '</tr></thead><tbody>'+rowsHTML+'</tbody></table></div>';
  }

  function resolveScope(all){
    const last = all[all.length-1].date;
    const cur = phaseOf(last) || PH.filter((p)=>p.start<=last).slice(-1)[0] || null;
    let sel = scope==="ALL" ? null : scope==="CURRENT" ? cur : (PH.find((p)=>p.id===scope) || cur);
    return { cur, sel };
  }

  function render(){
    const all = (DATA && DATA.daily) || [];
    if(!all.length){ setStatus("NO ROWS IN THE DAILY LOG YET.", false); return; }
    all.forEach((r)=>{ r.tgt = targetsFor(r.date); });
    const { cur, sel } = resolveScope(all);
    const statRows = sel ? all.filter((r)=>inPhase(sel,r.date)) : all;
    const chartRows = sel ? all.filter((r)=>r.date>=isoAdd(sel.start,-LEAD_DAYS) && (!sel.end || r.date<=sel.end)) : all;
    const V = computeVals(statRows, all, (DATA.food)||[], sel, cur);

    el("scopebar").innerHTML = scopeBarHTML(sel, cur);
    el("phases").innerHTML = phasesHTML(phaseSummary(all, cur));
    document.querySelectorAll("[data-scope]").forEach((b)=> b.addEventListener("click", ()=> setScope(b.getAttribute("data-scope"))));

    el("sync").textContent = "SYNC "+V.syncedAt;
    el("railFoot").innerHTML = V.railFoot;
    el("todayMeta").textContent = V.todayMeta;

    const ringGroup = '<div class="ring-group">'
      + ringCardHTML("CALORIES REMAINING", V.calTicks, V.calBig, V.calBigColor, V.calBigUnit, V.calEaten+" / "+V.calTarget, V.calCap+'<br><span style="color:'+V.calNetColor+'">'+V.calNet+'</span>', V.calCapColor)
      + ringCardHTML("PROTEIN REMAINING", V.proTicks, V.proBig, V.proBigColor, V.proBigUnit, V.proEaten+" / "+V.proTarget, V.proCap, V.proCapColor)
      + '</div>';
    const macroCol = '<div class="macro-col">'+V.macroBars.map(macroRowHTML).join("")
      + '<div class="macro-help">CARB TARGET SCALES WITH THE DAY’S ENERGY · FAT IS A FLOOR</div></div>';
    el("todayBody").innerHTML = ringGroup + macroCol;

    el("todayFoot").innerHTML = V.todayFoot.map((f)=>
      '<div class="foot-cell"><div class="fl">'+f.label+'</div><div class="fv" style="color:'+f.color+'">'+f.val+'</div>'
      +(f.sub?'<div class="fs">'+f.sub+'</div>':'')+'</div>').join("");

    el("kpis").innerHTML = V.kpis.map((k)=>
      '<div class="kpi"><div class="kpi-label">'+k.label+'</div>'
      +'<div class="kpi-val" style="color:'+k.color+'">'+k.val+'<span class="kpi-unit">'+k.unit+'</span></div>'
      +'<div class="kpi-sub" style="color:'+k.subColor+'">'+k.sub+'</div></div>').join("");

    el("defStats").innerHTML = V.defStats.map((s)=>
      '<div class="defstat"><div class="dl">'+s.label+'</div>'
      +'<div class="dv" style="color:'+s.color+'">'+s.val+'<span class="du">'+s.unit+'</span></div>'
      +'<div class="ds" style="color:'+s.subColor+'">'+s.sub+'</div></div>').join("");

    el("weekBars").innerHTML = V.weekBarGroups.map((wg)=>
      '<div class="weekgrp"><div class="weekgrp-head"><span class="weekgrp-title">'+wg.title+'</span><span class="weekgrp-note">'+wg.scaleNote+'</span></div>'
      +'<div class="weekgrp-rows">'+wg.rows.map((wr)=>
        '<div class="weekrow"><span class="weekrow-label">'+wr.label+'</span>'
        +'<div class="weekrow-bar">'+wr.blocks.map((b)=>'<div style="background:'+b.c+'"></div>').join("")+'</div>'
        +'<span class="weekrow-val" style="color:'+wr.color+'">'+wr.val+'</span></div>').join("")
      +'</div></div>').join("");

    el("weekHead").innerHTML = '<tr>'+V.weekCols.map((c)=>'<th style="text-align:'+c.align+'">'+c.name+'</th>').join("")+'</tr>';
    el("weekBody").innerHTML = V.weekRows.map((w)=>
      '<tr>'+w.cells.map((cell)=>'<td style="text-align:'+cell.align+';color:'+cell.color+'">'+cell.v+'</td>').join("")+'</tr>').join("");

    el("mealsHead").textContent = V.mealsHead;
    el("meals").innerHTML = V.mealGroups.length
      ? V.mealGroups.map((g)=>
          '<div class="mealgrp"><div class="mealhead"><span class="mealname">'+g.name+'</span>'
          +'<span class="mealtot">'+g.kcal+'<span class="u">KCAL</span><span class="pipe">|</span>'+g.prot+'<span class="u">G P</span></span></div>'
          +g.items.map((it)=>'<div class="mealitem"><span class="food">'+it.food+'</span><span class="det">'+it.detail+'</span></div>').join("")
          +'</div>').join("")
      : '<div class="empty">NO FOOD-LOG ENTRIES.</div>';

    el("rhrNow").textContent = V.rhrNow;
    el("hrvNow").textContent = V.hrvNow;
    el("sleepNow").textContent = V.sleepNow;

    buildCharts(chartRows, sel);
    applyTab();
  }

  function setScope(key){
    scope = key;
    try{ localStorage.setItem("dietty_scope", key); }catch(e){}
    if(DATA) render();
  }

  // ── charts ───────────────────────────────────────────────────────────────
  // Phase annotations: in a phase view the lead-in days before the phase are
  // shaded and labelled as context; in ALL every phase gets its own band.
  function phaseAnnos(rows, sel){
    const out = {};
    if(sel){
      const lead = rows.filter((r)=>r.date<sel.start).length;
      if(lead>0){
        const prev = phaseOf(rows[0].date);
        out.lead = { type:"box", xMin:-0.5, xMax:lead-0.5, backgroundColor:"rgba(44,107,69,.14)", borderWidth:0,
          label:{ display:true, content:(prev?"P"+prev.id+" ":"")+"CONTEXT", position:{x:"center",y:"start"}, color:C.dim, font:{size:9}, backgroundColor:"transparent" } };
        out.start = { type:"line", xMin:lead-0.5, xMax:lead-0.5, borderColor:C.dim2, borderWidth:1, borderDash:[3,3],
          label:{ display:true, content:"P"+sel.id+" START", position:"start", color:C.mid, font:{size:9}, backgroundColor:"transparent" } };
      }
      return out;
    }
    PH.forEach((p,i)=>{
      const idx = rows.map((r,j)=>inPhase(p,r.date)?j:-1).filter((j)=>j>=0);
      if(!idx.length) return;
      out["ph"+i] = { type:"box", xMin:idx[0]-0.5, xMax:idx[idx.length-1]+0.5,
        backgroundColor: isDeficitPhase(p) ? "rgba(125,252,176,.06)" : "rgba(255,194,74,.05)", borderWidth:0,
        label:{ display:true, content:"P"+p.id+" "+(p.name||""), position:{x:"start",y:"start"}, color:isDeficitPhase(p)?C.dim2:"#8a7334", font:{size:9}, backgroundColor:"transparent" } };
    });
    return out;
  }

  function buildCharts(rows, sel){
    if(!window.Chart) { setTimeout(()=>buildCharts(rows, sel), 120); return; }
    charts.forEach((c)=>c.destroy()); charts=[];
    const Chart = window.Chart;
    const labels = rows.map((r)=>fmtD(r.date));
    Chart.defaults.font.family = '"JetBrains Mono",ui-monospace,monospace';
    Chart.defaults.font.size = 10;
    Chart.defaults.font.weight = 500;
    Chart.defaults.color = C.dim;
    Chart.defaults.borderColor = C.border;

    const gridX = { grid:{ display:false }, border:{ color:C.border }, ticks:{ color:C.dim, maxRotation:0, autoSkip:true, maxTicksLimit:10 } };
    const gridY = (title)=>({ grid:{ color:"#12211a" }, border:{ color:C.border }, ticks:{ color:C.dim }, title:{ display:!!title, text:title, color:C.dim } });
    const base = (yTitle)=>({
      responsive:true, maintainAspectRatio:false, animation:false,
      interaction:{ mode:"index", intersect:false },
      plugins:{ legend:{ display:false },
        tooltip:{ backgroundColor:C.head, borderColor:C.dim, borderWidth:1, titleColor:C.hot, bodyColor:C.mid, padding:9, cornerRadius:0, displayColors:false, titleFont:{ family:'"JetBrains Mono",monospace' }, bodyFont:{ family:'"JetBrains Mono",monospace' } } },
      scales:{ x:gridX, y:gridY(yTitle) },
    });
    const leg = { display:true, labels:{ usePointStyle:true, pointStyle:"rect", boxWidth:8, boxHeight:8, color:C.mid, font:{ size:10 } } };
    const PA = phaseAnnos(rows, sel);
    const inSel = (r)=> !sel || inPhase(sel, r.date);
    // few points (early in a phase) → draw markers so a 3-day phase isn't invisible
    const sparse = rows.length < 21;

    const wRoll = rolling(rows,"weight",7);
    const dRoll = rolling(rows,"deficit",7);
    const targetIntake = rows.map((r)=> r.workoutCal!=null ? r.tgt.intakeBase+r.workoutCal : null);

    // calibration window — only when it actually falls inside the drawn range
    let calibBox = null;
    if(rows.length && rows[0].date<=CFG.calibEnd && rows[rows.length-1].date>=CFG.calibStart){
      const idxStart = rows.findIndex((r)=>r.date>=CFG.calibStart);
      const idxEnd0 = rows.map((r)=>r.date<=CFG.calibEnd).lastIndexOf(true);
      calibBox = {
        type:"box", xMin:Math.max(0,idxStart)-0.5, xMax:(idxEnd0>=0?idxEnd0:rows.length-1)+0.5,
        backgroundColor:"rgba(125,252,176,.07)", borderWidth:0,
        label:{ display:true, content:"CALIBRATION WINDOW", position:{x:"start",y:"end"}, color:C.dim, font:{size:9}, backgroundColor:"transparent" },
      };
    }

    // Weight
    const wAnno = { ...PA, ...(calibBox?{calibBox}:{}) };
    const startW = sel ? rows.find((r)=>inSel(r) && r.weight!=null) : null;
    if(startW) wAnno.startW = { type:"line", yMin:startW.weight, yMax:startW.weight, borderColor:C.dim2, borderWidth:1, borderDash:[2,4],
      label:{ display:true, content:"PHASE START "+r1(startW.weight)+" LB", position:"end", color:C.dim2, font:{size:9}, backgroundColor:"transparent" } };
    charts.push(new Chart(el("cWeight"), {
      type:"line",
      data:{ labels, datasets:[
        { label:"Weigh-in", data:rows.map((r)=>r.weight), borderColor:C.dim, backgroundColor:C.dim, borderWidth:1, pointRadius:sparse?3:2.2, pointStyle:"rect", pointHoverRadius:5, spanGaps:true, tension:0 },
        { label:"7-day avg", data:wRoll, borderColor:C.bright, backgroundColor:C.bright, borderWidth:2, pointRadius:0, spanGaps:true, tension:0.25 },
      ] },
      options:{ ...base("lb"), plugins:{ ...base().plugins, legend:leg, annotation:{ annotations:wAnno } }, scales:{ x:gridX, y:{ ...gridY("lb"), grace:"6%" } } },
    }));

    // Energy balance (filled band)
    charts.push(new Chart(el("cEnergy"), {
      type:"line",
      data:{ labels, datasets:[
        { label:"Burned (TDEE)", data:rows.map((r)=>r.burned), borderColor:C.bright, borderWidth:1.5, pointRadius:sparse?2:0, spanGaps:true, tension:0.25, fill:"+1", backgroundColor:"rgba(125,252,176,.16)" },
        { label:"Eaten", data:rows.map((r)=>r.eaten), borderColor:FILL.carb, backgroundColor:FILL.carb, borderWidth:1.5, pointRadius:sparse?2:0, spanGaps:true, tension:0.25 },
        { label:"Target intake", data:targetIntake, borderColor:C.warn, borderWidth:1, borderDash:[5,4], pointRadius:0, spanGaps:true, tension:0 },
      ] },
      options:{ ...base("kcal"), plugins:{ ...base().plugins, legend:leg, annotation:{ annotations:PA }, tooltip:{ ...base().plugins.tooltip, callbacks:{
        afterBody:(items)=>{ const r=rows[items[0].dataIndex]; const d=r.deficit; return "\n"+phaseTag(r.tgt.phase)+"\nDeficit  "+(d==null?"—":(d>=0?"+":"")+d+" kcal")+" · target "+r.tgt.deficit; },
      } } } },
    }));

    // Deficit — each bar zeroed on its own day's phase target
    const scoped = rows.filter(inSel).map((r)=>r.deficit).filter((v)=>v!=null);
    const avgScope = scoped.length ? scoped.reduce((a,b)=>a+b,0)/scoped.length : null;
    const tg = (r)=>r.tgt.deficit;
    const anyBreakEven = rows.some((r)=>tg(r)>0);
    const defSets = [
      { label:"vs target", data:rows.map((r)=>(r.deficit==null?null:r.deficit-tg(r))), backgroundColor:rows.map((r)=>(r.deficit==null?C.dim:!inSel(r)?"#24543a":r.deficit>=tg(r)?C.bright:C.warn)), barPercentage:0.9, categoryPercentage:0.72 },
      { label:"7-day avg", type:"line", data:dRoll.map((v,i)=>(v==null?null:v-tg(rows[i]))), borderColor:C.hot, borderWidth:2, pointRadius:0, spanGaps:true, tension:0.25 },
      { label:(sel?"Phase":"All-time")+" avg", type:"line", data:rows.map((r)=>(avgScope==null||!inSel(r)?null:avgScope-tg(r))), borderColor:FILL.allAvg, borderWidth:1.5, borderDash:[6,4], pointRadius:0, tension:0, stepped:true },
    ];
    if(anyBreakEven) defSets.push({ label:"Break even", type:"line", data:rows.map((r)=>(tg(r)>0?-tg(r):null)), borderColor:C.crit, borderWidth:1, borderDash:[3,4], pointRadius:0, tension:0, stepped:true, spanGaps:false });
    charts.push(new Chart(el("cDeficit"), {
      type:"bar",
      data:{ labels, datasets:defSets },
      options:{ ...base("kcal"),
        plugins:{ ...base().plugins, legend:leg,
          tooltip:{ ...base().plugins.tooltip, callbacks:{ label:(ctx)=>{ const t=tg(rows[ctx.dataIndex]); return ctx.dataset.label+"  "+(ctx.parsed.y>=0?"+":"")+Math.round(ctx.parsed.y)+" vs "+t+" target · "+Math.round(ctx.parsed.y+t)+" kcal"; } } },
          annotation:{ annotations:{ ...PA,
            target:{ type:"line", yMin:0, yMax:0, borderColor:C.mid, borderWidth:1.5, label:{ display:true, content:"PHASE TARGET", position:"end", color:C.mid, font:{size:9}, backgroundColor:"transparent" } },
          } } },
        scales:{ x:gridX, y:{ ...gridY("kcal vs target"), ticks:{ color:C.dim, callback:(v)=>(v>0?"+":"")+v } } } },
    }));

    // Macros — protein target drawn per day (it changes between phases)
    charts.push(new Chart(el("cMacros"), {
      type:"bar",
      data:{ labels, datasets:[
        { label:"Protein", data:rows.map((r)=>r.protein), backgroundColor:C.bright, stack:"m", barPercentage:0.9, categoryPercentage:0.7 },
        { label:"Carbs", data:rows.map((r)=>r.carbs), backgroundColor:FILL.carb, stack:"m", barPercentage:0.9, categoryPercentage:0.7 },
        { label:"Fat", data:rows.map((r)=>r.fat), backgroundColor:FILL.macFat, stack:"m", barPercentage:0.9, categoryPercentage:0.7 },
        { label:"Protein target", type:"line", data:rows.map((r)=>r.tgt.protein), stack:"pt", borderColor:C.warn, borderWidth:1, borderDash:[4,4], pointRadius:0, tension:0, stepped:true },
      ] },
      options:{ ...base("grams"), plugins:{ ...base().plugins, legend:leg, annotation:{ annotations:PA } },
        scales:{ x:{ ...gridX, stacked:true }, y:{ ...gridY("grams"), stacked:true } } },
    }));

    // Recovery small multiples
    const mini = (canvasId, key, color, refs)=>{
      const anno={ ...PA };
      Object.keys(anno).forEach((k)=>{ if(anno[k].label) anno[k] = { ...anno[k], label:{ ...anno[k].label, display:false } }; });
      (refs||[]).forEach((rf,i)=>{ anno["r"+i]={ type:"line", yMin:rf.v, yMax:rf.v, borderColor:rf.c, borderWidth:1, borderDash:[4,4], label:{ display:true, content:rf.t, position:"start", color:rf.c, font:{size:9}, backgroundColor:"transparent" } }; });
      charts.push(new Chart(el(canvasId), {
        type:"line",
        data:{ labels, datasets:[{ data:rows.map((r)=>r[key]), borderColor:color, backgroundColor:color, borderWidth:1.5, pointRadius:sparse?2:0, pointHoverRadius:4, spanGaps:true, tension:0.3 }] },
        options:{ ...base(), plugins:{ ...base().plugins, legend:{ display:false }, annotation:{ annotations:anno } },
          scales:{ x:{ display:false }, y:{ ...gridY(), grace:"12%", ticks:{ color:C.dim, maxTicksLimit:4 } } } },
      }));
    };
    mini("cRhr","rhr",C.bright,[{ v:CFG.rhrBaseline, c:C.dim, t:"BASE "+CFG.rhrBaseline }]);
    mini("cHrv","hrv",C.bright,[{ v:CFG.hrvBaseline, c:C.dim, t:"BASE "+CFG.hrvBaseline }, { v:CFG.hrvFloor, c:C.crit, t:"FLOOR "+CFG.hrvFloor }]);
    mini("cSleep","sleep",C.bright,[{ v:CFG.sleepTarget, c:C.mid, t:"TARGET "+CFG.sleepTarget+"H" }]);
  }

  // ── tabs ─────────────────────────────────────────────────────────────────
  function applyTab(){
    ["STAT","DIET","TRENDS","LOG"].forEach((name)=>{
      const pane = el("pane-"+name); if(pane) pane.classList.toggle("active", name===tab);
      const btn = document.querySelector('.tab[data-tab="'+name+'"]');
      if(btn){ btn.classList.toggle("active", name===tab); const m=btn.querySelector(".mark"); if(m) m.textContent = name===tab?"◆":"◇"; }
    });
    charts.forEach((c)=>{ try{ c.resize(); }catch(e){} });
  }
  function setTab(name){
    tab = name;
    try{ localStorage.setItem("dietty_tab", name); }catch(e){}
    applyTab();
  }

  // ── wiring ───────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach((b)=> b.addEventListener("click", ()=> setTab(b.getAttribute("data-tab"))));
  el("refresh").addEventListener("click", ()=> load(true));
  setInterval(()=>{ if(!document.hidden) load(false); }, AUTO_MS);
  document.addEventListener("visibilitychange", ()=>{ if(!document.hidden && Date.now()-lastLoad > STALE_MS) load(false); });

  applyTab(); // reflect persisted tab before data arrives
  load(false);
}

function renderPage(cfg) {
  const tabBtn = (name) =>
    `<button class="tab" data-tab="${name}"><span class="mark">◇</span><span>${name}</span></button>`;
  const chartPanel = (title, note, canvasId, height) =>
    `<div class="panel"><div class="phead"><div class="ptitle">▸ ${title}</div><div class="psub">${note}</div></div>` +
    `<div class="pbody" style="height:${height}px"><canvas id="${canvasId}"></canvas></div></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dietty — personal biomonitor</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${FONTS}" rel="stylesheet"/>
<style>${STYLE}</style>
<script src="${CHART_JS}"></script>
<script src="${ANNO_JS}"></script>
</head>
<body>
<div class="topbar">
  <span class="wordmark">DIETTY</span>
  <span class="chip">PERSONAL BIOMONITOR</span>
  <span class="grow"></span>
  <span class="sync" id="sync"></span>
  <button class="refresh" id="refresh" title="Auto-refreshes every 5 min while open; click to force a fresh pull now">&#8635; REFRESH</button>
</div>

<div class="shell">
  <nav class="rail">
    ${tabBtn("STAT")}${tabBtn("DIET")}${tabBtn("TRENDS")}${tabBtn("LOG")}
    <div class="rail-spacer"></div>
    <div class="rail-foot" id="railFoot"></div>
  </nav>

  <main class="content">
    <div id="status"></div>
    <div class="scopebar" id="scopebar"></div>

    <div class="pane" id="pane-STAT">
      <div class="panel">
        <div class="phead row"><span class="ptitle">▸ TODAY</span><span class="pmeta" id="todayMeta"></span></div>
        <div class="today-inner" id="todayBody"></div>
        <div class="today-foot" id="todayFoot"></div>
      </div>
      <div class="kpis" id="kpis"></div>
      <div class="panel">
        <div class="phead"><div class="ptitle">▸ PHASES</div><div class="psub">DEFICIT = GREEN · MAINTENANCE / TRAVEL = AMBER · CLICK A PHASE TO FOCUS THE DASHBOARD ON IT</div></div>
        <div id="phases"></div>
      </div>
    </div>

    <div class="pane" id="pane-DIET">
      ${chartPanel("ENERGY BALANCE", `BURNED (TDEE) VS EATEN · THE SHADED GAP IS THE DEFICIT · DASHED = TARGET INTAKE (PHASE BASE + WORKOUT CAL)`, "cEnergy", 300)}
      <div class="defstats" id="defStats"></div>
      <div class="grid-320">
        ${chartPanel("DAILY DEFICIT", `ZEROED ON EACH DAY'S PHASE TARGET · UP = AHEAD, DOWN = SHORT · SOLID = 7-DAY AVG, DASHED = PHASE / ALL-TIME AVG`, "cDeficit", 280)}
        ${chartPanel("MACROS", `GRAMS PER DAY, STACKED · DASHED = PHASE PROTEIN TARGET`, "cMacros", 280)}
      </div>
    </div>

    <div class="pane" id="pane-TRENDS">
      ${chartPanel("MASS &amp; 7-DAY TREND", "RAW MORNING WEIGH-INS WITH 7-DAY ROLLING AVERAGE · SHADED = PHASES / CONTEXT DAYS", "cWeight", 320)}
      <div class="panel">
        <div class="phead"><div class="ptitle">▸ RECOVERY SIGNALS</div><div class="psub">FROM COROS · FLAG IF RHR SUSTAINED +5 OVER BASELINE OR HRV PARKED BELOW FLOOR</div></div>
        <div class="recovery">
          <div class="reco"><div class="reco-head"><span class="reco-name">RESTING HR</span><span class="reco-now" id="rhrNow"></span></div><div class="reco-chart"><canvas id="cRhr"></canvas></div></div>
          <div class="reco"><div class="reco-head"><span class="reco-name">SLEEP HRV</span><span class="reco-now" id="hrvNow"></span></div><div class="reco-chart"><canvas id="cHrv"></canvas></div></div>
          <div class="reco"><div class="reco-head"><span class="reco-name">SLEEP</span><span class="reco-now" id="sleepNow"></span></div><div class="reco-chart"><canvas id="cSleep"></canvas></div></div>
        </div>
      </div>
      <div class="panel">
        <div class="phead"><div class="ptitle">▸ WEEKLY SUMMARY</div><div class="psub">CALENDAR WEEKS, MON–SUN · ONLY DAYS IN THE SELECTED VIEW</div></div>
        <div class="weekbars" id="weekBars"></div>
        <div class="tablewrap"><table class="week"><thead id="weekHead"></thead><tbody id="weekBody"></tbody></table></div>
      </div>
    </div>

    <div class="pane" id="pane-LOG">
      <div class="panel">
        <div class="phead"><div class="ptitle">▸ INTAKE LOG</div><div class="psub" id="mealsHead"></div></div>
        <div class="meals" id="meals"></div>
      </div>
    </div>

    <div class="foot">DIETTY · LIVE FROM NOTION · CLOUDFLARE WORKERS</div>
  </main>
</div>

<script>
window.__CFG__ = ${JSON.stringify(cfg)};
// esbuild's --keep-names wraps named functions with a __name() helper defined in
// module scope. Since clientMain ships via .toString(), that helper is absent here —
// define a no-op so the serialized body runs.
var __name = (fn) => fn;
(${clientMain.toString()})();
</script>
</body>
</html>`;
}

export { renderPage };

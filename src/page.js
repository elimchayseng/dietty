// Dashboard HTML shell + client code.
// The client is authored as a real function (clientMain) and serialized via
// .toString(), so we can write normal JS/template-literals inside it without
// fighting the outer template string. Server config is injected as JSON.

const CHART_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js";
const ANNO_JS =
  "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0/dist/chartjs-plugin-annotation.min.js";

const STYLE = `
:root{ color-scheme: light dark; }
*{ box-sizing:border-box; }
body{
  margin:0; font-family: system-ui,-apple-system,"Segoe UI",sans-serif;
  background: var(--plane); color: var(--ink);
  --surface:#fcfcfb; --plane:#f9f9f7; --ink:#0b0b0b; --ink2:#52514e; --muted:#898781;
  --grid:#e1e0d9; --axis:#c3c2b7; --border:rgba(11,11,11,.10);
  --good:#0ca30c; --warn:#c98500; --crit:#d03b3b; --accent:#2a78d6;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]) body{
    --surface:#1a1a19; --plane:#0d0d0d; --ink:#fff; --ink2:#c3c2b7; --muted:#898781;
    --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,.10);
    --good:#0ca30c; --warn:#fab219; --crit:#d03b3b; --accent:#3987e5;
  }
}
:root[data-theme="dark"] body{
  --surface:#1a1a19; --plane:#0d0d0d; --ink:#fff; --ink2:#c3c2b7; --muted:#898781;
  --grid:#2c2c2a; --axis:#383835; --border:rgba(255,255,255,.10);
  --good:#0ca30c; --warn:#fab219; --crit:#d03b3b; --accent:#3987e5;
}
.wrap{ max-width:1180px; margin:0 auto; padding:20px 20px 80px; }
header.top{ display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; margin-bottom:4px; }
header.top h1{ font-size:22px; margin:0; letter-spacing:-.01em; }
header.top .sub{ color:var(--muted); font-size:13px; }
.spacer{ flex:1; }
button.btn{
  font: inherit; font-size:13px; color:var(--ink2); background:var(--surface);
  border:1px solid var(--border); border-radius:8px; padding:7px 12px; cursor:pointer;
}
button.btn:hover{ border-color:var(--axis); }
#status{ font-size:13px; color:var(--muted); min-height:18px; margin:10px 0 4px; }
#status.err{ color:var(--crit); }

/* ── Today rings ─────────────────────────────────────────────── */
.today h2 .note{ font-weight:400; }
.today-rings{ display:flex; gap:28px; flex-wrap:wrap; align-items:center; margin-top:6px; }
.ring-card{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.ring-wrap{ position:relative; width:168px; height:168px; }
.ring-wrap svg{ display:block; width:100%; height:100%; }
.ring-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.ring-center .big{ font-size:27px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
.ring-center .of{ font-size:13px; color:var(--muted); margin-top:3px; font-variant-numeric:tabular-nums; }
.ring-name{ font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
.ring-caption{ font-size:13px; font-weight:600; }
.subs{ flex:1; min-width:260px; display:flex; flex-direction:column; justify-content:center; gap:16px; }
.subrow{ display:grid; grid-template-columns:52px 1fr auto; gap:12px; align-items:center; font-size:13px; }
.subrow .sn{ color:var(--ink2); font-weight:600; }
.subbar{ height:11px; border-radius:6px; background:color-mix(in srgb,var(--muted) 22%,transparent); overflow:hidden; position:relative; }
.subfill{ height:100%; border-radius:6px; }
.subval{ color:var(--ink2); font-variant-numeric:tabular-nums; white-space:nowrap; }
.subval b{ color:var(--ink); font-weight:600; }
.today-foot{ margin-top:16px; padding-top:14px; border-top:1px solid var(--border); font-size:13px; color:var(--ink2); display:flex; gap:22px; flex-wrap:wrap; }
.today-foot b{ color:var(--ink); font-weight:600; }

.kpis{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin:14px 0 22px; }
.card{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 16px 14px; }
.card .label{ font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.card .val{ font-size:30px; font-weight:600; margin-top:6px; line-height:1.05; }
.card .val small{ font-size:15px; font-weight:500; color:var(--ink2); }
.card .sub{ font-size:13px; color:var(--ink2); margin-top:4px; }
.pill{ display:inline-block; font-size:12px; font-weight:600; padding:2px 8px; border-radius:20px; }
.pill.good{ color:var(--good); background:color-mix(in srgb,var(--good) 14%,transparent); }
.pill.warn{ color:var(--warn); background:color-mix(in srgb,var(--warn) 16%,transparent); }
.pill.crit{ color:var(--crit); background:color-mix(in srgb,var(--crit) 14%,transparent); }
.pill.flat{ color:var(--ink2); background:color-mix(in srgb,var(--muted) 16%,transparent); }

.grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media (max-width:820px){ .grid2{ grid-template-columns:1fr; } }
.panel{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; margin-bottom:16px; }
.panel h2{ font-size:15px; margin:0 0 2px; }
.panel .note{ font-size:12px; color:var(--muted); margin:0 0 10px; }
.chart-box{ position:relative; height:280px; }
.chart-box.tall{ height:320px; }
.mini3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
@media (max-width:720px){ .mini3{ grid-template-columns:1fr; } }
.mini .chart-box{ height:150px; }
.mini h3{ font-size:13px; margin:0 0 2px; display:flex; justify-content:space-between; align-items:baseline; }
.mini h3 span{ font-size:12px; color:var(--ink2); font-weight:500; }

table{ width:100%; border-collapse:collapse; font-size:13px; }
th,td{ text-align:right; padding:8px 10px; border-bottom:1px solid var(--border); font-variant-numeric:tabular-nums; white-space:nowrap; }
th:first-child,td:first-child{ text-align:left; }
th{ color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.03em; }
tbody tr:hover{ background:color-mix(in srgb,var(--accent) 6%,transparent); }
.table-scroll{ overflow-x:auto; }

.meals{ display:flex; flex-direction:column; gap:10px; }
.meal-group .mh{ display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:var(--ink2); border-bottom:1px solid var(--border); padding-bottom:4px; margin-bottom:4px; }
.meal-item{ display:flex; justify-content:space-between; font-size:13px; padding:2px 0; color:var(--ink2); }
.meal-item .fn{ color:var(--ink); }
.legend{ display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:var(--ink2); margin-bottom:8px; }
.legend i{ display:inline-block; width:11px; height:11px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
.foot{ color:var(--muted); font-size:12px; margin-top:24px; text-align:center; }
`;

function clientMain() {
  const CFG = window.__CFG__;
  const $ = (s) => document.querySelector(s);

  const PAL = {
    light: { blue:"#2a78d6", orange:"#eb6834", aqua:"#1baf7a", yellow:"#eda100", red:"#e34948",
      surface:"#fcfcfb", ink:"#0b0b0b", ink2:"#52514e", muted:"#898781", grid:"#e1e0d9", axis:"#c3c2b7",
      good:"#0ca30c", warn:"#c98500", crit:"#d03b3b" },
    dark: { blue:"#3987e5", orange:"#d95926", aqua:"#199e70", yellow:"#c98500", red:"#e66767",
      surface:"#1a1a19", ink:"#ffffff", ink2:"#c3c2b7", muted:"#898781", grid:"#2c2c2a", axis:"#383835",
      good:"#0ca30c", warn:"#fab219", crit:"#d03b3b" },
  };
  const isDark = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const T = () => (isDark() ? PAL.dark : PAL.light);

  let charts = [];
  let DATA = null;
  let lastLoad = 0;
  const AUTO_MS = 5 * 60 * 1000; // auto-refresh cadence
  const STALE_MS = 2 * 60 * 1000; // refetch on tab focus if older than this

  // ── helpers ────────────────────────────────────────────────────────────
  const fmtD = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const r1 = (x) => (x==null||isNaN(x) ? null : Math.round(x*10)/10);
  const r0 = (x) => (x==null||isNaN(x) ? null : Math.round(x));
  const lastVal = (arr,k) => { for(let i=arr.length-1;i>=0;i--) if(arr[i][k]!=null) return arr[i][k]; return null; };

  function rolling(rows, key, win) {
    win = win||7;
    return rows.map((_,i)=>{ let s=0,n=0; for(let j=Math.max(0,i-win+1);j<=i;j++){ const v=rows[j][key]; if(v!=null){s+=v;n++;} } return n?s/n:null; });
  }
  // least-squares slope (per day) of y over date, returns lb/week
  function slopePerWeek(rows) {
    const pts=[]; const t0=new Date(rows[0].date+"T00:00:00").getTime();
    for(const r of rows) if(r.weight!=null) pts.push([ (new Date(r.date+"T00:00:00").getTime()-t0)/86400000, r.weight ]);
    if(pts.length<2) return null;
    const n=pts.length; let sx=0,sy=0,sxx=0,sxy=0;
    for(const [x,y] of pts){ sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; }
    const d=n*sxx-sx*sx; if(!d) return null;
    return ((n*sxy-sx*sy)/d)*7; // per week
  }
  function mondayOf(iso){ const d=new Date(iso+"T00:00:00"); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return d.toISOString().slice(0,10); }

  function setStatus(msg,err){ const el=$("#status"); el.textContent=msg||""; el.classList.toggle("err",!!err); }

  // ── load ───────────────────────────────────────────────────────────────
  async function load(fresh){
    setStatus("Loading data from Notion…");
    try{
      const r = await fetch("/api/data"+(fresh?"?fresh=1":""), {cache:"no-store"});
      if(!r.ok) throw new Error(await r.text());
      DATA = await r.json();
      lastLoad = Date.now();
      render();
      const g = new Date(DATA.generatedAt);
      $("#generated").textContent = "Updated " + g.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) + (DATA.cached?" (cached)":"");
      setStatus("");
    }catch(e){ setStatus("Couldn’t load: "+e.message, true); }
  }

  function pill(text, cls){ return '<span class="pill '+cls+'">'+text+'</span>'; }

  // ── render ───────────────────────────────────────────────────────────────
  function render(){
    charts.forEach(c=>c.destroy()); charts=[];
    const rows = DATA.daily;
    if(!rows.length){ $("#kpis").innerHTML="<div class='card'>No rows in the Daily Log yet.</div>"; return; }
    const labels = rows.map(r=>fmtD(r.date));
    const t = T();

    // derived series
    const wRoll = rolling(rows,"weight",7);
    const dRoll = rolling(rows,"deficit",7);
    const pRoll = rolling(rows,"protein",7);
    const targetIntake = rows.map(r => r.workoutCal!=null ? CFG.intakeBase + r.workoutCal : null);
    let cum=0; const cumDeficit = rows.map(r=>{ if(r.deficit!=null) cum+=r.deficit; return cum; });

    renderToday(rows, DATA.food || []);
    renderKPIs(rows, wRoll, dRoll, pRoll);

    // Chart.js global look
    Chart.defaults.font.family = 'system-ui,-apple-system,"Segoe UI",sans-serif';
    Chart.defaults.color = t.ink2;
    Chart.defaults.borderColor = t.grid;

    const gridX = { grid:{ display:false }, ticks:{ color:t.muted, maxRotation:0, autoSkip:true, maxTicksLimit:12 } };
    const gridY = (title)=>({ grid:{ color:t.grid, drawBorder:false }, ticks:{ color:t.muted }, title:{ display:!!title, text:title, color:t.muted } });
    const baseOpts = (yTitle)=>({
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:"index", intersect:false },
      plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:t.surface, borderColor:t.axis, borderWidth:1, titleColor:t.ink, bodyColor:t.ink2, padding:10 } },
      scales:{ x:gridX, y:gridY(yTitle) },
    });

    // calibration window shading (box annotation on category axis)
    const idxStart = rows.findIndex(r=>r.date>=CFG.calibStart);
    const idxEnd0 = rows.map(r=>r.date<=CFG.calibEnd).lastIndexOf(true);
    const calibBox = (idxStart>=0) ? {
      type:"box",
      xMin: Math.max(0,idxStart-0.5),
      xMax: (idxEnd0>=0?idxEnd0:rows.length-1)+0.5,
      backgroundColor: (isDark()?"rgba(57,135,229,.10)":"rgba(42,120,214,.07)"),
      borderWidth:0,
      label:{ display:true, content:"Calibration window", position:{x:"start",y:"start"}, color:t.muted, font:{size:10}, backgroundColor:"transparent" }
    } : null;

    // ── 1. Weight ───────────────────────────────────────────────────
    charts.push(new Chart($("#cWeight"), {
      type:"line",
      data:{ labels, datasets:[
        { label:"Weigh-in", data:rows.map(r=>r.weight), borderColor:t.muted, backgroundColor:t.muted, borderWidth:1, pointRadius:3, pointHoverRadius:5, spanGaps:true, tension:0 },
        { label:"7-day avg", data:wRoll, borderColor:t.blue, backgroundColor:t.blue, borderWidth:2.5, pointRadius:0, pointHoverRadius:4, spanGaps:true, tension:.25 },
      ]},
      options:{ ...baseOpts("lb"), plugins:{ ...baseOpts().plugins, legend:{ display:true, labels:{ usePointStyle:true, boxWidth:8, color:t.ink2 } }, annotation:{ annotations: calibBox?{calibBox}:{} } },
        scales:{ x:gridX, y:{ ...gridY("lb"), grace:"6%" } } },
    }));

    // ── 2. Energy balance ───────────────────────────────────────────
    charts.push(new Chart($("#cEnergy"), {
      type:"bar",
      data:{ labels, datasets:[
        { label:"Eaten", data:rows.map(r=>r.eaten), backgroundColor:t.orange, borderRadius:4, borderSkipped:false, barPercentage:.9, categoryPercentage:.7 },
        { label:"Burned (TDEE)", data:rows.map(r=>r.burned), backgroundColor:t.blue, borderRadius:4, borderSkipped:false, barPercentage:.9, categoryPercentage:.7 },
        { label:"Target intake", type:"line", data:targetIntake, borderColor:t.ink2, borderWidth:2, borderDash:[5,4], pointRadius:0, spanGaps:true, tension:0 },
      ]},
      options:{ ...baseOpts("kcal"), plugins:{ ...baseOpts().plugins, legend:{ display:true, labels:{ usePointStyle:true, boxWidth:8, color:t.ink2 } } } },
    }));

    // ── 3. Deficit ──────────────────────────────────────────────────
    const defColors = rows.map(r=> r.deficit==null?t.muted : (r.deficit>=0? t.blue : t.red));
    charts.push(new Chart($("#cDeficit"), {
      type:"bar",
      data:{ labels, datasets:[
        { label:"Daily deficit", data:rows.map(r=>r.deficit), backgroundColor:defColors, borderRadius:4, borderSkipped:false, barPercentage:.9, categoryPercentage:.72 },
        { label:"7-day avg", type:"line", data:dRoll, borderColor:t.ink, borderWidth:2, pointRadius:0, spanGaps:true, tension:.25 },
      ]},
      options:{ ...baseOpts("kcal"),
        plugins:{ ...baseOpts().plugins, legend:{ display:true, labels:{ usePointStyle:true, boxWidth:8, color:t.ink2 } },
          annotation:{ annotations:{
            zero:{ type:"line", yMin:0, yMax:0, borderColor:t.axis, borderWidth:1 },
            target:{ type:"line", yMin:CFG.deficitTarget, yMax:CFG.deficitTarget, borderColor:t.good, borderWidth:1.5, borderDash:[4,4],
              label:{ display:true, content:"target "+CFG.deficitTarget, position:"end", color:t.good, font:{size:10}, backgroundColor:"transparent" } },
          } } } },
    }));

    // ── 4. Macros (stacked grams; protein is bottom segment) ────────
    charts.push(new Chart($("#cMacros"), {
      type:"bar",
      data:{ labels, datasets:[
        { label:"Protein", data:rows.map(r=>r.protein), backgroundColor:t.blue, borderRadius:{topLeft:0,topRight:0}, borderWidth:0, stack:"m", barPercentage:.9, categoryPercentage:.7 },
        { label:"Carbs", data:rows.map(r=>r.carbs), backgroundColor:t.orange, stack:"m", barPercentage:.9, categoryPercentage:.7 },
        { label:"Fat", data:rows.map(r=>r.fat), backgroundColor:t.aqua, borderRadius:{topLeft:4,topRight:4}, stack:"m", barPercentage:.9, categoryPercentage:.7 },
      ]},
      options:{ ...baseOpts("grams"),
        plugins:{ ...baseOpts().plugins, legend:{ display:true, labels:{ usePointStyle:true, boxWidth:8, color:t.ink2 } },
          annotation:{ annotations:{ pt:{ type:"line", yMin:CFG.proteinTarget, yMax:CFG.proteinTarget, borderColor:t.ink, borderWidth:1.5, borderDash:[4,4],
            label:{ display:true, content:"protein "+CFG.proteinTarget+"g", position:"start", color:t.ink2, font:{size:10}, backgroundColor:"transparent" } } } } },
        scales:{ x:{ ...gridX, stacked:true }, y:{ ...gridY("grams"), stacked:true } } },
    }));

    // ── 5. Recovery small multiples ─────────────────────────────────
    const mini = (canvas, key, color, refs)=>{
      const anno={};
      (refs||[]).forEach((rf,i)=>{ anno["r"+i]={ type:"line", yMin:rf.v, yMax:rf.v, borderColor:rf.c, borderWidth:1, borderDash:[4,4],
        label:{ display:true, content:rf.t, position:"start", color:t.muted, font:{size:9}, backgroundColor:"transparent" } }; });
      charts.push(new Chart($(canvas),{
        type:"line",
        data:{ labels, datasets:[{ data:rows.map(r=>r[key]), borderColor:color, backgroundColor:color, borderWidth:2, pointRadius:0, pointHoverRadius:4, spanGaps:true, tension:.3 }]},
        options:{ ...baseOpts(), plugins:{ ...baseOpts().plugins, legend:{display:false}, annotation:{ annotations:anno } },
          scales:{ x:{ display:false }, y:{ ...gridY(), grace:"12%", ticks:{ color:t.muted, maxTicksLimit:4 } } } },
      }));
    };
    mini("#cRHR","rhr",t.blue,[{v:CFG.rhrBaseline,c:t.axis,t:"base "+CFG.rhrBaseline}]);
    mini("#cHRV","hrv",t.aqua,[{v:CFG.hrvBaseline,c:t.axis,t:"base "+CFG.hrvBaseline},{v:CFG.hrvFloor,c:t.crit,t:"floor "+CFG.hrvFloor}]);
    mini("#cSleep","sleep",t.orange,[{v:CFG.sleepTarget,c:t.good,t:"target "+CFG.sleepTarget+"h"}]);
    $("#rhrNow").textContent = fmtLatest(rows,"rhr","bpm");
    $("#hrvNow").textContent = fmtLatest(rows,"hrv","ms");
    $("#sleepNow").textContent = fmtLatest(rows,"sleep","h");

    renderWeekly(rows);
    renderMeals();
  }

  function fmtLatest(rows,k,unit){ const v=lastVal(rows,k); return v==null?"—":(r1(v)+" "+unit); }

  // ── Today: Apple-Watch-style rings ───────────────────────────────────────
  function ringSVG(pctRaw, col, track){
    const size=168, sw=16, r=(size-sw)/2, C=2*Math.PI*r;
    const pct=Math.max(0, Math.min(pctRaw||0, 1));
    const dash=C*pct;
    return '<svg viewBox="0 0 '+size+' '+size+'">'
      +'<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+track+'" stroke-width="'+sw+'"/>'
      +'<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+dash+' '+(C-dash)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>'
      +'</svg>';
  }
  function renderToday(daily, food){
    const t=T();
    const track = isDark() ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.08)";
    const dates=[...daily.map(d=>d.date), ...food.map(f=>f.date)].filter(Boolean).sort();
    const day = dates[dates.length-1];
    if(!day){ $("#today").innerHTML="<div class='sub' style='color:var(--muted)'>No data yet.</div>"; return; }

    const dr = daily.find(d=>d.date===day) || {};
    const ft = food.filter(f=>f.date===day);
    let eaten=0,pg=0,cg=0,fg=0;
    ft.forEach(f=>{ eaten+=f.calories||0; pg+=f.protein||0; cg+=f.carbs||0; fg+=f.fat||0; });
    // fall back to the Daily Log's reconciled totals if no food rows for the day
    if(!ft.length){ eaten=dr.eaten||0; pg=dr.protein||0; cg=dr.carbs||0; fg=dr.fat||0; }

    const workout = dr.workoutCal||0;
    const calTarget = CFG.intakeBase + workout;
    const pTarget = CFG.proteinTarget;
    const fTarget = CFG.fatTarget;
    const cTarget = Math.max(0, (calTarget - pTarget*4 - fTarget*9)/4); // carbs fill remaining energy

    // Calories ring — hitting target = planned deficit; over = eating into it
    const calPct = calTarget>0 ? eaten/calTarget : 0;
    const calLeft = calTarget - eaten;
    const calCol = calPct>1.12 ? t.crit : (calPct>1.001 ? t.warn : t.orange);
    const calCap = calLeft>=0
      ? '<span style="color:var(--ink2)">'+r0(calLeft)+' kcal left</span>'
      : '<span style="color:'+(calPct>1.12?"var(--crit)":"var(--warn)")+'">'+r0(-calLeft)+' kcal over</span>';

    // Protein ring — a floor; green once hit
    const pPct = pTarget>0 ? pg/pTarget : 0;
    const pLeft = pTarget - pg;
    const pCol = pPct>=1 ? t.good : t.blue;
    const pCap = pLeft>0
      ? '<span style="color:var(--ink2)">'+r0(pLeft)+' g to go</span>'
      : '<span style="color:var(--good)">✓ hit'+(pLeft<0?" +"+r0(-pLeft)+"g":"")+'</span>';

    const ring = (name, big, of, svg, cap)=>
      '<div class="ring-card"><div class="ring-name">'+name+'</div>'
      +'<div class="ring-wrap">'+svg+'<div class="ring-center"><div class="big">'+big+'</div><div class="of">'+of+'</div></div></div>'
      +'<div class="ring-caption">'+cap+'</div></div>';

    const subBar = (name, val, target, col, unit)=>{
      const pct = target>0 ? val/target : 0;
      const w = Math.max(0, Math.min(pct,1))*100;
      const left = target-val;
      return '<div class="subrow"><span class="sn">'+name+'</span>'
        +'<div class="subbar"><div class="subfill" style="width:'+w+'%;background:'+col+'"></div></div>'
        +'<span class="subval"><b>'+r0(val)+'</b> / '+r0(target)+' '+unit+' · '+(left>=0?r0(left)+" left":r0(-left)+" over")+'</span></div>';
    };

    const rings = '<div class="today-rings">'
      + ring("Calories", r0(eaten), "/ "+r0(calTarget)+" kcal", ringSVG(calPct, calCol, track), calCap)
      + ring("Protein", r0(pg), "/ "+r0(pTarget)+" g", ringSVG(pPct, pCol, track), pCap)
      + '<div class="subs">'
        + subBar("Carbs", cg, cTarget, t.aqua, "g")
        + subBar("Fat", fg, fTarget, t.yellow, "g")
        + '<div class="subval" style="font-size:12px;color:var(--muted)">Carb target scales with the day’s energy; fat is a floor.</div>'
      + '</div>'
      + '</div>';

    const burned = dr.burned;
    const defSoFar = burned!=null ? burned-eaten : (dr.deficit!=null?dr.deficit:null);
    const foot = '<div class="today-foot">'
      + '<span>Workout burn <b>'+(workout?r0(workout)+" kcal":"—")+'</b></span>'
      + '<span>Deficit so far <b>'+(defSoFar==null?"—":r0(defSoFar)+" kcal")+'</b></span>'
      + '<span>'+(ft.length?ft.length+" items logged":"from daily totals")+'</span>'
      + '</div>';

    $("#todayMeta").textContent = new Date(day+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}) + (dr.dayType?" · "+dr.dayType+" day":"");
    $("#today").innerHTML = rings + foot;
  }

  // ── KPI tiles ──────────────────────────────────────────────────────────
  function renderKPIs(rows, wRoll, dRoll, pRoll){
    const t=T();
    const wNow = lastVal(rows,"weight");
    const rollNow = wRoll.filter(v=>v!=null).slice(-1)[0];
    const roll7ago = (()=>{ const nn=wRoll.filter(v=>v!=null); return nn.length>=8?nn[nn.length-8]:(nn.length?nn[0]:null); })();
    const wkDelta = (rollNow!=null&&roll7ago!=null)? rollNow-roll7ago : null;

    const calRows = rows.filter(r=>r.date>=CFG.calibStart);
    const trend = slopePerWeek(calRows.length>=2?calRows:rows); // lb/wk (negative = losing)
    const loss = trend==null?null:-trend; // positive = losing
    let trendCls="flat", trendNote="—";
    if(loss!=null){
      if(loss<0.4){ trendCls="warn"; trendNote="below 0.4 lb/wk → calibration trigger"; }
      else if(loss>1.2){ trendCls="warn"; trendNote="above 1.2 lb/wk → too aggressive"; }
      else { trendCls="good"; trendNote="in target band (0.4–1.2 lb/wk)"; }
    }

    const dAvg = dRoll.filter(v=>v!=null).slice(-1)[0];
    const impliedLoss = dAvg==null?null : dAvg*7/3500;
    const pAvg = pRoll.filter(v=>v!=null).slice(-1)[0];
    const pPct = pAvg==null?null : pAvg/CFG.proteinTarget*100;

    const rhr=lastVal(rows,"rhr"), hrv=lastVal(rows,"hrv");
    const rhrD = rhr==null?null : rhr-CFG.rhrBaseline;
    const hrvD = hrv==null?null : hrv-CFG.hrvBaseline;
    const sleepAvg = rolling(rows,"sleep",7).filter(v=>v!=null).slice(-1)[0];

    const arrow=(x)=> x==null?"":(x>0?"▲ ":"▼ ");
    const card=(label,val,sub)=>'<div class="card"><div class="label">'+label+'</div><div class="val">'+val+'</div><div class="sub">'+sub+'</div></div>';

    const tiles=[];
    tiles.push(card("Weight", (wNow==null?"—":r1(wNow))+' <small>lb</small>',
      "7-day avg "+(rollNow==null?"—":r1(rollNow)+" lb")+(wkDelta==null?"":" · "+arrow(wkDelta)+Math.abs(r1(wkDelta))+" lb/wk")));
    tiles.push(card("Weight trend",
      (loss==null?"—":(loss>=0?"−":"+")+Math.abs(r1(Math.abs(loss)))+' <small>lb/wk</small>'),
      pill(trendNote,trendCls)));
    tiles.push(card("Deficit (7-day avg)", (dAvg==null?"—":r0(dAvg))+' <small>kcal</small>',
      (impliedLoss==null?"—":"≈ "+r1(impliedLoss)+" lb/wk predicted · target "+CFG.deficitTarget)));
    const pCls = pPct==null?"flat":(pPct>=97?"good":pPct>=85?"warn":"crit");
    tiles.push(card("Protein (7-day avg)", (pAvg==null?"—":r0(pAvg))+' <small>g</small>',
      (pPct==null?"—":pill(r0(pPct)+"% of "+CFG.proteinTarget+"g", pCls))));
    tiles.push(card("Resting HR", (rhr==null?"—":r0(rhr))+' <small>bpm</small>',
      (rhrD==null?"—":(rhrD>=5?pill("+"+r0(rhrD)+" vs base — recovery flag","crit"):pill((rhrD>=0?"+":"")+r0(rhrD)+" vs base "+CFG.rhrBaseline, rhrD<=0?"good":"flat")))));
    tiles.push(card("Sleep HRV", (hrv==null?"—":r0(hrv))+' <small>ms</small>',
      (hrv==null?"—":(hrv<CFG.hrvFloor?pill("below "+CFG.hrvFloor+" floor","crit"):pill((hrvD>=0?"+":"")+r0(hrvD)+" vs base "+CFG.hrvBaseline, hrvD>=0?"good":"flat")))
      +(sleepAvg==null?"":" · "+r1(sleepAvg)+"h sleep")));

    $("#kpis").innerHTML = tiles.join("");
  }

  // ── weekly (calendar-week) table ─────────────────────────────────────────
  function renderWeekly(rows){
    const groups={};
    for(const r of rows){ const k=mondayOf(r.date); (groups[k]=groups[k]||[]).push(r); }
    const keys=Object.keys(groups).sort();
    const avg=(a,k)=>{ let s=0,n=0; for(const r of a){ if(r[k]!=null){s+=r[k];n++;} } return n?s/n:null; };
    const sum=(a,k)=>{ let s=0,n=0; for(const r of a){ if(r[k]!=null){s+=r[k];n++;} } return n?s:null; };
    let prevW=null; const trs=[];
    for(const k of keys){
      const g=groups[k]; const end=new Date(k+"T00:00:00"); end.setDate(end.getDate()+6);
      const range=fmtD(k)+"–"+end.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      const w=avg(g,"weight"); const dW = (w!=null&&prevW!=null)? w-prevW : null; if(w!=null) prevW=w;
      const totDef=sum(g,"deficit"); const estLb= totDef==null?null: totDef/3500;
      const train=g.filter(r=>r.dayType==="Training"||r.dayType==="Long").length;
      const pAvg=avg(g,"protein");
      const cell=(x,suf)=> x==null?"—":(r1(x)+(suf||""));
      trs.push("<tr>"+
        "<td>"+range+"</td>"+
        "<td>"+g.length+"</td>"+
        "<td>"+cell(w)+"</td>"+
        "<td style='color:"+(dW==null?"inherit":(dW<0?"var(--good)":"var(--crit)"))+"'>"+(dW==null?"—":(dW<0?"−":"+")+Math.abs(r1(dW)))+"</td>"+
        "<td>"+(avg(g,"eaten")==null?"—":r0(avg(g,"eaten")))+"</td>"+
        "<td>"+(avg(g,"deficit")==null?"—":r0(avg(g,"deficit")))+"</td>"+
        "<td>"+(totDef==null?"—":r0(totDef))+"</td>"+
        "<td style='color:var(--good)'>"+(estLb==null?"—":"−"+r1(estLb)+" lb")+"</td>"+
        "<td>"+(pAvg==null?"—":r0(pAvg)+"g")+"</td>"+
        "<td>"+train+"</td>"+
        "<td>"+cell(avg(g,"sleep"),"h")+"</td>"+
      "</tr>");
    }
    $("#weekBody").innerHTML = trs.reverse().join("");
  }

  // ── today's meals ────────────────────────────────────────────────────────
  function renderMeals(){
    const food=DATA.food||[];
    if(!food.length){ $("#meals").innerHTML="<div class='sub' style='color:var(--muted)'>No food-log entries.</div>"; return; }
    const lastDate = food[food.length-1].date;
    const day = food.filter(f=>f.date===lastDate);
    const order=["Breakfast","Lunch","Dinner","Snack","Smoothie","Workout Fuel"];
    const byMeal={}; for(const f of day){ (byMeal[f.meal||"Other"]=byMeal[f.meal||"Other"]||[]).push(f); }
    let totC=0,totP=0;
    const blocks=[];
    for(const m of order.concat(Object.keys(byMeal).filter(x=>!order.includes(x)))){
      const items=byMeal[m]; if(!items) continue;
      let c=0,p=0; const rows=items.map(f=>{ c+=f.calories||0; p+=f.protein||0;
        return '<div class="meal-item"><span class="fn">'+f.food+'</span><span>'+(f.calories==null?"":r0(f.calories)+" kcal · "+r0(f.protein||0)+"g P")+'</span></div>'; }).join("");
      totC+=c; totP+=p;
      blocks.push('<div class="meal-group"><div class="mh"><span>'+m+'</span><span>'+r0(c)+" kcal · "+r0(p)+"g P</span></div>"+rows+"</div>");
    }
    $("#mealsHead").textContent = "Latest logged day — "+fmtD(lastDate)+" · "+r0(totC)+" kcal · "+r0(totP)+"g protein";
    $("#meals").innerHTML = blocks.join("");
  }

  // ── theme toggle + wiring ──────────────────────────────────────────────
  $("#theme").onclick = ()=>{
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur ? (cur==="dark"?"light":"dark") : (matchMedia("(prefers-color-scheme: dark)").matches?"light":"dark");
    document.documentElement.setAttribute("data-theme", next);
    if(DATA) render();
  };
  $("#refresh").onclick = ()=>load(true);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ()=>{ if(DATA && !document.documentElement.getAttribute("data-theme")) render(); });

  // auto-refresh: on a 5-min timer while the tab is visible, and immediately
  // when the tab regains focus if the data is more than 2 min stale.
  setInterval(()=>{ if(!document.hidden) load(false); }, AUTO_MS);
  document.addEventListener("visibilitychange", ()=>{
    if(!document.hidden && Date.now()-lastLoad > STALE_MS) load(false);
  });

  load(false);
}

export function renderPage(cfg) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dietty — health & macro dashboard</title>
<style>${STYLE}</style>
<script src="${CHART_JS}"></script>
<script src="${ANNO_JS}"></script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <h1>🥗 Dietty</h1>
    <span class="sub" id="generated"></span>
    <span class="spacer"></span>
    <button class="btn" id="theme">Theme</button>
    <button class="btn" id="refresh" title="Auto-refreshes every 5 min while open; click to force a fresh pull now">↻ Refresh</button>
  </header>
  <div id="status"></div>

  <div class="panel today">
    <h2>Today <span class="note" id="todayMeta"></span></h2>
    <div id="today"></div>
  </div>

  <div class="kpis" id="kpis"></div>

  <div class="grid2">
    <div class="panel">
      <h2>Weight & 7-day trend</h2>
      <p class="note">Raw morning weigh-ins with 7-day rolling average. Shaded = calibration window.</p>
      <div class="chart-box tall"><canvas id="cWeight"></canvas></div>
    </div>
    <div class="panel">
      <h2>Energy balance</h2>
      <p class="note">Calories eaten vs. burned (TDEE). Dashed = dynamic target intake (${cfg.intakeBase} + workout cal).</p>
      <div class="chart-box tall"><canvas id="cEnergy"></canvas></div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <h2>Daily deficit</h2>
      <p class="note">Blue = deficit, red = surplus. Line = 7-day average. Dashed = ${cfg.deficitTarget} kcal target.</p>
      <div class="chart-box"><canvas id="cDeficit"></canvas></div>
    </div>
    <div class="panel">
      <h2>Macros</h2>
      <p class="note">Grams per day, stacked. Dashed = ${cfg.proteinTarget} g protein target (bottom segment).</p>
      <div class="chart-box"><canvas id="cMacros"></canvas></div>
    </div>
  </div>

  <div class="panel">
    <h2>Recovery signals</h2>
    <p class="note">From Coros. Watch for RHR sustained +5 over baseline, or HRV parked below the floor.</p>
    <div class="mini3">
      <div class="mini"><h3>Resting HR <span id="rhrNow"></span></h3><div class="chart-box"><canvas id="cRHR"></canvas></div></div>
      <div class="mini"><h3>Sleep HRV <span id="hrvNow"></span></h3><div class="chart-box"><canvas id="cHRV"></canvas></div></div>
      <div class="mini"><h3>Sleep <span id="sleepNow"></span></h3><div class="chart-box"><canvas id="cSleep"></canvas></div></div>
    </div>
  </div>

  <div class="panel">
    <h2>Weekly summary <span class="note" style="font-weight:400">(calendar weeks, Mon–Sun)</span></h2>
    <div class="table-scroll">
      <table>
        <thead><tr>
          <th>Week</th><th>Days</th><th>Avg wt</th><th>Δ wt</th><th>Avg kcal in</th>
          <th>Avg deficit</th><th>Total deficit</th><th>Est. Δ</th><th>Avg protein</th><th>Train days</th><th>Avg sleep</th>
        </tr></thead>
        <tbody id="weekBody"></tbody>
      </table>
    </div>
  </div>

  <div class="panel">
    <h2>Meals <span class="note" style="font-weight:400" id="mealsHead"></span></h2>
    <div class="meals" id="meals"></div>
  </div>

  <div class="foot">Dietty · data pulled live from Notion · deployed on Cloudflare Workers</div>
</div>
<script>
window.__CFG__ = ${JSON.stringify(cfg)};
// esbuild's --keep-names wraps named functions with a __name() helper that
// lives in module scope. Because we ship clientMain via .toString(), that
// helper isn't present here — define a no-op so the serialized body runs.
var __name = (fn) => fn;
(${clientMain.toString()})();
</script>
</body>
</html>`;
}

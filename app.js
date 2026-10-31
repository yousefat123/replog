(() => {
const PRESETS = {
  Chest:["Bench Press","Incline Dumbbell Press","Dumbbell Bench Press","Chest Fly","Dips"],
  Back:["Deadlift","Pull-up","Barbell Row","Lat Pulldown","Seated Cable Row"],
  Legs:["Squat","Leg Press","Romanian Deadlift","Leg Curl","Leg Extension","Calf Raise"],
  Shoulders:["Overhead Press","Lateral Raise","Face Pull"],
  Arms:["Barbell Curl","Hammer Curl","Triceps Pushdown","Skull Crusher"]
};
PRESETS.Shoulders.push("Rear Delt Fly");
PRESETS.Arms.push("Incline Dumbbell Curl","Close-Grip Bench Press","Overhead Triceps Extension");
const E = (name,sets,lo,hi) => ({ name, sets, lo, hi });
const MY_SPLIT = () => [
  { id:"r-ct", name:"Chest & Triceps", exercises:[E("Bench Press",4,6,10),E("Incline Dumbbell Press",3,8,12),E("Chest Fly",3,10,15),E("Dips",3,8,12),E("Triceps Pushdown",3,10,15),E("Skull Crusher",3,8,12)] },
  { id:"r-bb", name:"Back & Biceps", exercises:[E("Pull-up",3,6,10),E("Barbell Row",4,6,10),E("Lat Pulldown",3,8,12),E("Seated Cable Row",3,10,12),E("Barbell Curl",3,8,12),E("Hammer Curl",3,10,12)] },
  { id:"r-st", name:"Shoulders & Triceps", exercises:[E("Overhead Press",4,6,10),E("Lateral Raise",4,12,15),E("Face Pull",3,12,15),E("Rear Delt Fly",3,12,15),E("Close-Grip Bench Press",3,8,12),E("Overhead Triceps Extension",3,10,12)] },
  { id:"r-lb", name:"Legs & Biceps", exercises:[E("Squat",4,6,10),E("Romanian Deadlift",3,8,12),E("Leg Press",3,10,15),E("Leg Curl",3,10,15),E("Calf Raise",4,10,15),E("Incline Dumbbell Curl",3,10,12)] }
];
const TEMPLATES = [
  { id:"split4", name:"Muscle-pair split", desc:"4 workouts: Chest & Triceps, Back & Biceps, Shoulders & Triceps, Legs & Biceps", make:MY_SPLIT },
  { id:"ppl", name:"Push / Pull / Legs", desc:"3 workouts, run 3–6 days a week", make:() => [
    { id:"r-push", name:"Push", exercises:[E("Bench Press",4,6,10),E("Overhead Press",3,8,12),E("Incline Dumbbell Press",3,8,12),E("Lateral Raise",3,12,15),E("Triceps Pushdown",3,10,15)] },
    { id:"r-pull", name:"Pull", exercises:[E("Deadlift",3,5,8),E("Pull-up",3,6,10),E("Barbell Row",3,8,12),E("Face Pull",3,12,15),E("Barbell Curl",3,8,12)] },
    { id:"r-legs", name:"Legs", exercises:[E("Squat",4,6,10),E("Romanian Deadlift",3,8,12),E("Leg Press",3,10,15),E("Leg Curl",3,10,15),E("Calf Raise",4,10,15)] }] },
  { id:"ul", name:"Upper / Lower", desc:"2 workouts, usually 4 days a week", make:() => [
    { id:"r-upper", name:"Upper", exercises:[E("Bench Press",4,6,10),E("Barbell Row",4,6,10),E("Overhead Press",3,8,12),E("Lat Pulldown",3,8,12),E("Barbell Curl",2,10,12),E("Triceps Pushdown",2,10,12)] },
    { id:"r-lower", name:"Lower", exercises:[E("Squat",4,6,10),E("Romanian Deadlift",3,8,10),E("Leg Press",3,10,12),E("Leg Curl",3,10,12),E("Calf Raise",3,12,15)] }] },
  { id:"fb", name:"Full Body", desc:"1 workout, 2–3 days a week", make:() => [
    { id:"r-full", name:"Full Body", exercises:[E("Squat",3,6,10),E("Bench Press",3,6,10),E("Barbell Row",3,8,12),E("Overhead Press",2,8,12),E("Romanian Deadlift",2,8,12)] }] },
  { id:"own", name:"Build my own", desc:"Start with one empty workout and add what you do", make:() => [{ id:"r-"+uid(), name:"", exercises:[] }] }
];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DOWL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2,"0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const dateOf = k => { const [y,m,d] = k.split("-").map(Number); return new Date(y,m-1,d); };
const today = () => keyOf(new Date());
const addDays = (k,n) => { const d = dateOf(k); d.setDate(d.getDate()+n); return keyOf(d); };
const fmtShort = k => { const d = dateOf(k); return `${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtLong = k => { const d = dateOf(k); return `${DOWL[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };
const uid = () => Math.random().toString(36).slice(2,9);
const num = v => { const n = parseFloat(String(v ?? "").replace(",",".")); return isFinite(n) ? n : 0; };
const fmtKg = n => (Math.round(n*10)/10).toLocaleString("en-US");
const e1rm = (w,r) => r > 0 && w > 0 ? w*(1+r/30) : 0;
const norm = s => String(s).trim().toLowerCase();

const S = { days:{}, routines:[], cur:today(), view:"log", progEx:null, sheet:null, menu:null, armDel:null, q:"", openR:null, armR:null, live:null, planLoaded:false, gate:null, setup:null, firstPullDone:false };

/* ---------- storage: IndexedDB on the phone, optional Supabase sync ---------- */
const CFG = window.REPLOG_CONFIG || {};
const SET = { rest:90, step:2.5 };
let renderPending = false;
const timers = {};

const idb = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("replog", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("docs", { keyPath:"id" }); r.result.createObjectStore("meta"); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(store, mode); const out = fn(t.objectStore(store)); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
  return {
    all: () => tx("docs", "readonly", s => s.getAll()),
    get: id => tx("docs", "readonly", s => s.get(id)),
    put: rec => tx("docs", "readwrite", s => s.put(rec)),
    putMany: recs => tx("docs", "readwrite", s => recs.forEach(r => s.put(r))),
    clear: () => tx("docs", "readwrite", s => s.clear()),
    getMeta: k => tx("meta", "readonly", s => s.get(k)),
    setMeta: (k, v) => tx("meta", "readwrite", s => s.put(v, k))
  };
})();

function applyRecord(r){
  if (r.id === "plan") { if (!r.deleted && r.data && Array.isArray(r.data.routines)) { if (!S.setup || !S.setup.manual) { S.routines = r.data.routines; S.setup = null; } S.planLoaded = true; } return; }
  if (r.id === "settings") { if (!r.deleted && r.data) Object.assign(SET, r.data); return; }
  if (r.deleted || !r.data || !r.data.exercises) delete S.days[r.id];
  else S.days[r.id] = { exercises:r.data.exercises, planName:r.data.planName || "", routineId:r.data.routineId || "" };
}
async function loadLocal(){
  S.routines = []; S.planLoaded = false;
  try { (await idb.all()).forEach(applyRecord); } catch (e) { toast("This browser blocked storage. Logs won't be kept."); }
}
async function writeDoc(id, data){
  const rec = { id, data, updatedAt:Date.now(), deleted:!data, dirty:1 };
  try { await idb.put(rec); } catch {}
  scheduleSync(1500);
}
function persist(k){
  clearTimeout(timers[k]);
  timers[k] = setTimeout(() => {
    delete timers[k];
    if (k === "plan") { if (S.setup) return; return writeDoc("plan", { routines:S.routines }); }
    if (k === "settings") return writeDoc("settings", { ...SET });
    const day = S.days[k];
    writeDoc(k, day && day.exercises && day.exercises.length ? { date:k, exercises:day.exercises, planName:day.planName || "", routineId:day.routineId || "" } : null);
  }, 350);
}

/* --- cloud sync (Supabase). Last write wins per document. --- */
const sb = CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth:{ persistSession:true, autoRefreshToken:true } }) : null;
let session = null, syncing = false, syncAgain = false, syncTimer = null, syncState = { ok:null, at:null, msg:"" };
function scheduleSync(ms = 0){ clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms); }
async function sync(){
  if (!sb || !session || !navigator.onLine) { setSync(); return; }
  if (syncing) { syncAgain = true; return; }
  syncing = true; setSync("Syncing…");
  try {
    let since = (await idb.getMeta("lastPull:" + session.user.id)) || "1970-01-01T00:00:00Z", maxSeen = since, from = 0, changed = false;
    for (;;) {
      const { data, error } = await sb.from("docs").select("id,data,updated_at,deleted,synced_at").gt("synced_at", since).order("synced_at").range(from, from + 999);
      if (error) throw error;
      const apply = [];
      for (const row of data) {
        if (row.synced_at > maxSeen) maxSeen = row.synced_at;
        const local = await idb.get(row.id);
        if (local && local.updatedAt >= row.updated_at) continue;
        apply.push({ id:row.id, data:row.data, updatedAt:row.updated_at, deleted:row.deleted, dirty:0 });
      }
      if (apply.length) { await idb.putMany(apply); apply.forEach(r => { if (!timers[r.id]) applyRecord(r); }); changed = true; }
      if (data.length < 1000) break; from += 1000;
    }
    const dirty = (await idb.all()).filter(r => r.dirty);
    if (dirty.length) {
      const { error } = await sb.from("docs").upsert(dirty.map(r => ({ user_id:session.user.id, id:r.id, data:r.data, updated_at:r.updatedAt, deleted:!!r.deleted })), { onConflict:"user_id,id" });
      if (error) throw error;
      const fresh = await Promise.all(dirty.map(r => idb.get(r.id)));
      await idb.putMany(fresh.filter((f,i) => f && f.updatedAt === dirty[i].updatedAt).map(f => ({ ...f, dirty:0 })));
    }
    await idb.setMeta("lastPull:" + session.user.id, maxSeen);
    syncState = { ok:true, at:new Date(), msg:"" };
    S.firstPullDone = true;
    if (changed) scheduleRender();
  } catch (e) {
    syncState = { ok:false, at:new Date(), msg:(e && e.message) || "Sync failed" };
  } finally {
    syncing = false; setSync();
    if (syncAgain) { syncAgain = false; scheduleSync(500); }
    if (S.settings) renderSettings();
    decideGate();
  }
}
function setSync(text){
  const el = $("#sync"); if (!el) return;
  let on = false;
  if (!text) {
    if (!sb || !session) text = "On this phone only";
    else if (!navigator.onLine) text = "Offline · will sync later";
    else if (syncState.ok === false) text = "Sync problem · tap ⚙";
    else { text = userName() ? `${userName().split(" ")[0]} · synced` : "Synced"; on = true; }
  }
  el.classList.toggle("on", on); el.querySelector("span").textContent = text;
}
async function initAuth(){
  if (!sb) { setSync(); return; }
  try { session = (await sb.auth.getSession()).data.session; } catch {}
  // "Keep me signed in" off: forget the session when the app is fully closed.
  try { if (session && localStorage.getItem("replog.remember") === "0" && !sessionStorage.getItem("replog.alive")) { await sb.auth.signOut({ scope:"local" }); session = null; } } catch {}
  try { sessionStorage.setItem("replog.alive", "1"); } catch {}
  sb.auth.onAuthStateChange((ev, s) => {
    const was = session && session.user.id; session = s; setSync();
    if (ev === "PASSWORD_RECOVERY") { auth.mode = "reset"; S.gate = "auth"; renderGate(); return; }
    if (s && s.user.id !== was) { S.firstPullDone = false; scheduleSync(); }
    if (S.settings) renderSettings();
    decideGate();
  });
  setSync(); if (session) scheduleSync();
}
const userName = () => (session && session.user.user_metadata && session.user.user_metadata.name) || "";
window.addEventListener("online", () => scheduleSync());
window.addEventListener("offline", () => setSync());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") scheduleSync(300); });

let toastT = null;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

function scheduleRender(){
  const a = document.activeElement;
  if (a && a.tagName === "INPUT" && a.id !== "q") { renderPending = true; return; }
  render();
}
document.addEventListener("focusout", () => setTimeout(() => {
  const a = document.activeElement;
  if (renderPending && !(a && a.tagName === "INPUT")) { renderPending = false; render(); }
}, 0));

/* ---------- data helpers ---------- */
const hasDayIn = (m,k) => !!(m[k] && m[k].exercises && m[k].exercises.length);
const dayOf = k => S.days[k] || (S.days[k] = { exercises:[] });
const hasDay = k => hasDayIn(S.days, k);
const sortedKeys = () => Object.keys(S.days).filter(hasDay).sort();
const validSets = ex => ex.sets.filter(s => num(s.r) > 0);
const doneSets = ex => ex.sets.filter(s => s.done);
const exVolume = ex => validSets(ex).reduce((a,s) => a + num(s.w)*num(s.r), 0);
const routine = id => S.routines.find(r => r.id === id);
function lastRoutineBefore(k){
  const keys = sortedKeys().filter(x => x < k).reverse();
  for (const x of keys) { const d = S.days[x]; const r = routine(d.routineId) || S.routines.find(r => d.planName && norm(r.name) === norm(d.planName)); if (r) return { key:x, r }; }
  return null;
}
function nextRoutine(k){
  const rs = S.routines.filter(r => r.exercises && r.exercises.length); if (!rs.length) return null;
  const last = lastRoutineBefore(k); if (!last) return rs[0];
  const i = rs.indexOf(last.r); return rs[(i+1) % rs.length];
}

function previous(name, before){
  const keys = sortedKeys().filter(k => k < before).reverse();
  for (const k of keys) {
    const ex = S.days[k].exercises.find(e => norm(e.name) === norm(name));
    if (ex && validSets(ex).length) return { key:k, ex };
  }
  return null;
}
function bestBefore(name, before){
  let best = 0;
  sortedKeys().filter(k => k < before).forEach(k => S.days[k].exercises.forEach(e => {
    if (norm(e.name) === norm(name)) validSets(e).forEach(s => { best = Math.max(best, e1rm(num(s.w),num(s.r))); });
  }));
  return best;
}
function hint(prev, ex){
  const lo = ex.lo || 8, hi = ex.hi || 12;
  if (!prev) return `First time: pick a weight you can do for ${lo}–${hi} clean reps`;
  const sets = validSets(prev.ex);
  const topW = Math.max(...sets.map(s => num(s.w)));
  const minR = Math.min(...sets.filter(s => num(s.w) === topW).map(s => num(s.r)));
  if (topW > 0 && minR >= hi) return `Go heavier: ${fmtKg(topW + SET.step)} kg for ${lo}+ reps`;
  if (topW > 0) return `Beat it: ${fmtKg(topW)} kg × ${Math.min(minR+1, hi)}+ reps every set`;
  return `Beat it: ${minR+1}+ reps`;
}
function allNames(){
  const count = {};
  sortedKeys().forEach(k => S.days[k].exercises.forEach(e => { if (validSets(e).length) count[e.name] = (count[e.name]||0) + 1; }));
  return Object.keys(count).sort((a,b) => count[b]-count[a] || a.localeCompare(b));
}
function newLogExercise(name, n, lo, hi){
  const prev = previous(name, S.cur);
  const ps = prev ? validSets(prev.ex) : [];
  const count = n || ps.length || 1;
  const sets = Array.from({ length:count }, (_,i) => { const p = ps[Math.min(i, ps.length-1)]; return { w: p ? p.w : "", r: p ? p.r : "", done:false }; });
  return { id:uid(), name, sets, lo:lo || 0, hi:hi || 0 };
}

/* ---------- render ---------- */
function render(){
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === S.view));
  $("#week").hidden = S.view !== "log";
  renderWeek();
  const v = S.view;
  $("#main").innerHTML = v === "log" ? viewLog() : v === "plan" ? viewPlan() : v === "progress" ? viewProgress() : viewHistory();
  renderLive(); renderSheet(); drawRest();
  if (S.gate === "setup") renderGate();
}

function renderWeek(){
  const d = dateOf(S.cur); const start = addDays(S.cur, -d.getDay());
  let h = `<button class="nav" data-act="wk" data-n="-7" aria-label="Previous week">‹</button>`;
  for (let i=0;i<7;i++){
    const k = addDays(start,i);
    h += `<button class="day ${hasDay(k)?"has":""} ${k===today()?"today":""}" data-act="go" data-k="${k}" ${k===S.cur?'aria-current="date"':""}>
      <small>${DOW[i][0]}</small><b>${dateOf(k).getDate()}</b><i></i></button>`;
  }
  $("#week").innerHTML = h + `<button class="nav" data-act="wk" data-n="7" aria-label="Next week">›</button>`;
}

const CHECK = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l4 4 8-9"/></svg>`;

function viewLog(){
  const day = S.days[S.cur];
  const exs = day ? day.exercises : [];
  const nx = nextRoutine(S.cur), last = lastRoutineBefore(S.cur);
  const sets = exs.reduce((a,e) => a + doneSets(e).length, 0);
  const vol = exs.reduce((a,e) => a + doneSets(e).reduce((b,s) => b + num(s.w)*num(s.r), 0), 0);
  let h = `<div class="dayhead"><h2>${S.cur===today()?"Today · ":""}${fmtLong(S.cur)}</h2>
    <p class="num-t">${exs.length ? `${sets} set${sets===1?"":"s"} done · ${fmtKg(vol)} kg lifted` : ""}</p></div>`;

  if (nx && !exs.length) {
    const others = S.routines.filter(r => r !== nx && r.exercises && r.exercises.length);
    h += `<div class="todo"><small>Next up${last ? ` · last was ${esc(last.r.name)}, ${fmtShort(last.key)}` : ""}</small><h3>${esc(nx.name)}</h3>
      <p>${nx.exercises.map(e => `${esc(e.name)} ${e.sets}×${e.lo}–${e.hi}`).join(" · ")}</p>
      <button class="go" data-act="startr" data-r="${nx.id}">Start ${esc(nx.name)}</button>
      ${others.length ? `<div class="alt"><span>Or do instead</span><div class="chips">${others.map(r => `<button data-act="startr" data-r="${r.id}">${esc(r.name)}</button>`).join("")}</div></div>` : ""}</div>`;
  } else if (exs.length) {
    const left = exs.reduce((a,e) => a + e.sets.filter(s => !s.done).length, 0);
    h += `<div class="todo"><small>${esc(day.planName || "Workout")} · ${left ? `${left} sets left` : "all sets done"}</small>
      <button class="go" data-act="startlive">${left ? (sets ? "Continue workout" : "Start workout") : "Open workout mode"}</button></div>`;
  } else if (!nx) {
    h += `<div class="note"><span><b>No workouts in your plan.</b> Add your split to start fast.</span><button data-act="toplan">Build plan</button></div>`;
  }

  if (!exs.length) {
    if (nx) return h + `<button class="cta" data-act="sheet">+ Log single exercises instead</button>`;
    const last = sortedKeys().filter(k => k < S.cur).pop();
    const quick = allNames().slice(0,6);
    const picks = quick.length ? quick : ["Bench Press","Squat","Deadlift","Overhead Press","Pull-up","Barbell Row"];
    return h + `<div class="empty"><h3>Nothing logged ${S.cur===today()?"yet today":"on this day"}</h3>
      <p>Tap an exercise to start. Each one shows what you did last time and the target to beat.</p>
      ${last ? `<button class="btn ghost" data-act="repeat" data-k="${last}">Repeat ${fmtShort(last)} workout · ${S.days[last].exercises.length} exercises</button>` : ""}
      <div class="chips">${picks.map(n => `<button class="chip" data-act="quick" data-name="${esc(n)}">+ ${esc(n)}</button>`).join("")}</div>
      <button class="btn" data-act="sheet">Choose an exercise</button></div>`;
  }
  return h + `<div class="list">${exs.map(exCard).join("")}</div>
    <div style="margin-top:12px"><button class="cta" data-act="sheet">+ Add exercise</button></div>`;
}

function exCard(ex){
  const prev = previous(ex.name, S.cur), best = bestBefore(ex.name, S.cur);
  const prevTxt = prev ? `Last · ${fmtShort(prev.key)}: ${validSets(prev.ex).map(s => `${fmtKg(num(s.w))}×${num(s.r)}`).join(", ")}` : "No previous sessions";
  const open = S.menu === ex.id;
  return `<section class="ex" data-ex="${ex.id}">
    <header><h3>${esc(ex.name)}${ex.hi ? `<small>${ex.lo}–${ex.hi} reps</small>` : ""}</h3><button class="more" data-act="menu" aria-label="Exercise options" aria-expanded="${open}">⋯</button></header>
    ${open ? `<div class="menu"><button data-act="rmset">Remove last set</button><button data-act="up">Move up</button>
      <button class="del ${S.armDel===ex.id?"arm":""}" data-act="delex">${S.armDel===ex.id?"Tap again to delete":"Delete exercise"}</button></div>` : ""}
    <div class="meta"><p class="prev num-t">${prevTxt}</p><p class="hint">↑ ${esc(hint(prev, ex))}</p></div>
    <div class="sets"><div class="row head"><span>#</span><span>kg</span><span>reps</span><span>Done</span></div>
      ${ex.sets.map((s,i) => setRow(s,i,best)).join("")}</div>
    <div class="exfoot"><button class="addset" data-act="addset">+ Add set</button><span class="vol num-t" data-vol>${volTxt(ex)}</span></div>
  </section>`;
}
const volTxt = ex => `Volume ${fmtKg(exVolume(ex))} kg`;
const isPR = (s, best) => s.done && num(s.r)>0 && num(s.w)>0 && best>0 && e1rm(num(s.w),num(s.r)) > best + 0.01;
function setRow(s,i,best){
  return `<div class="row ${s.done?"done":""}" data-i="${i}"><span class="n">${i+1}</span>
    <div class="step"><button data-act="dec" data-f="w" aria-label="Less weight">−</button>
      <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" data-f="w" value="${esc(s.w)}" aria-label="Set ${i+1} weight in kg">
      <button data-act="inc" data-f="w" aria-label="More weight">+</button></div>
    <div class="step"><button data-act="dec" data-f="r" aria-label="Fewer reps">−</button>
      <input type="number" inputmode="numeric" step="1" min="0" placeholder="0" data-f="r" value="${esc(s.r)}" aria-label="Set ${i+1} reps">
      <button data-act="inc" data-f="r" aria-label="More reps">+</button></div>
    <button class="chk" data-act="done" aria-pressed="${!!s.done}" aria-label="Mark set ${i+1} done">${CHECK}</button>
  </div>${isPR(s,best) ? `<div class="prline">New personal best<span class="pr-tag">PR</span></div>` : ""}`;
}

/* ---------- plan ---------- */
function viewPlan(){
  const nx = nextRoutine(today());
  let h = `<div class="dayhead"><h2>My workouts</h2><p>Done in this order, then repeat</p></div><div class="plan">`;
  S.routines.forEach((r,i) => {
    const open = S.openR === r.id;
    h += `<section class="pday ${open?"open":""}">
      <button class="phead ${r===nx?"today":""}" data-act="ropen" data-r="${r.id}" aria-expanded="${open}">
        <span class="dw">${i+1}</span>
        <span class="t"><strong>${esc(r.name || "Untitled workout")}${r===nx ? ` <em class="up">Next</em>` : ""}</strong><span>${r.exercises.length ? esc(r.exercises.map(e => e.name).join(" · ")) : "No exercises yet"}</span></span>
        <span class="chev">›</span></button>
      ${open ? routineBody(r,i) : ""}</section>`;
  });
  return h + `</div><div style="margin-top:12px"><button class="cta" data-act="rnew">+ New workout</button></div>
    <p style="color:var(--muted);font-size:13px;margin:14px 2px 0">Today shows the next workout after the last one you did. You can always pick a different one there.</p>
    <button class="btn ghost" style="width:100%;margin-top:16px" data-act="rebuild">Start over from a template</button>`;
}
function routineBody(r,i){
  const arm = S.armR === r.id;
  return `<div class="pbody">
    <input class="pname" data-rname="${r.id}" id="rname-${r.id}" placeholder="Name, e.g. Chest & Triceps" value="${esc(r.name)}">
    <div>${r.exercises.map((e,j) => `<div class="pex" data-pi="${j}">
        <div class="nm"><span>${esc(e.name)}</span><span style="display:flex"><button class="icon" data-act="pup" data-r="${r.id}" aria-label="Move up" ${j?"":"disabled"}>↑</button><button class="icon" data-act="pdel" data-r="${r.id}" aria-label="Remove">✕</button></span></div>
        <div class="ctl"><span>Sets</span><div class="mini"><button data-act="psets" data-r="${r.id}" data-n="-1" aria-label="Fewer sets">−</button><b>${e.sets}</b><button data-act="psets" data-r="${r.id}" data-n="1" aria-label="More sets">+</button></div>
          <span style="margin-left:6px">Reps</span><span class="rr"><input type="number" inputmode="numeric" data-prr="lo" data-r="${r.id}" id="lo-${r.id}-${j}" value="${e.lo}" aria-label="Lowest reps">–<input type="number" inputmode="numeric" data-prr="hi" data-r="${r.id}" id="hi-${r.id}-${j}" value="${e.hi}" aria-label="Highest reps"></span></div>
      </div>`).join("")}</div>
    <button class="cta" data-act="psheet" data-r="${r.id}">+ Add exercise</button>
    <div class="menu"><button data-act="rup" data-r="${r.id}" ${i?"":"disabled"}>Move earlier</button>
      <button class="del ${arm?"arm":""}" data-act="rdel" data-r="${r.id}">${arm?"Tap again to delete":"Delete workout"}</button></div>
  </div>`;
}

/* ---------- progress / history ---------- */
function viewProgress(){
  const names = allNames();
  if (!names.length) return `<div class="empty"><h3>No progress to show yet</h3><p>Log a few sessions and this page charts your estimated 1-rep max, heaviest sets and volume for every exercise.</p><button class="btn" data-act="tolog">Go to today</button></div>`;
  if (!S.progEx || !names.includes(S.progEx)) S.progEx = names[0];
  const ss = sortedKeys().map(k => {
    const ex = S.days[k].exercises.find(e => norm(e.name) === norm(S.progEx));
    if (!ex) return null; const vs = validSets(ex); if (!vs.length) return null;
    let e = 0, best = vs[0]; vs.forEach(s => { const v = e1rm(num(s.w),num(s.r)); if (v > e) { e = v; best = s; } });
    return { k, e, top:Math.max(...vs.map(s => num(s.w))), vol:exVolume(ex), best, sets:vs.length };
  }).filter(Boolean);
  const bestE = Math.max(...ss.map(s => s.e)), heavy = Math.max(...ss.map(s => s.top));
  const change = ss.length > 1 && ss[0].e > 0 ? ((ss[ss.length-1].e - ss[0].e)/ss[0].e)*100 : null;
  return `<div class="sec">
    <div class="hscroll">${names.map(n => `<button class="chip" data-act="pex" data-name="${esc(n)}" aria-pressed="${n===S.progEx}">${esc(n)}</button>`).join("")}</div>
    <div class="stats">
      <div class="stat"><small>Est. 1-rep max</small><b>${fmtKg(Math.round(bestE*2)/2)}<em>kg</em></b></div>
      <div class="stat"><small>Heaviest set</small><b>${fmtKg(heavy)}<em>kg</em></b></div>
      <div class="stat"><small>Sessions</small><b>${ss.length}</b></div>
      <div class="stat"><small>Since first</small><b>${change===null ? "—" : `${change>=0?"+":""}${change.toFixed(1)}<em>%</em>`}</b></div></div>
    <div class="card chart">${chart(ss)}<div class="legend"><span><i style="background:var(--accent)"></i>Est. 1RM</span><span><i style="background:var(--pr)"></i>Top weight</span></div></div>
    <p class="label">Sessions</p>
    <div class="card" style="padding:4px 10px;overflow-x:auto"><table class="tbl"><thead><tr><th>Date</th><th>Best set</th><th>Sets</th><th>Volume</th></tr></thead><tbody>
      ${ss.slice().reverse().map(s => `<tr><td>${fmtShort(s.k)}</td><td>${fmtKg(num(s.best.w))} × ${num(s.best.r)}</td><td>${s.sets}</td><td>${fmtKg(s.vol)}</td></tr>`).join("")}
    </tbody></table></div></div>`;
}
function niceTicks(min,max,count=4){
  if (max === min) { max = min + 10; min = Math.max(0, min - 10); }
  const raw = (max-min)/count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1,2,2.5,5,10].map(m => m*mag).find(s => s >= raw);
  const lo = Math.floor(min/step)*step, hi = Math.ceil(max/step)*step, t = [];
  for (let v=lo; v<=hi+1e-9; v+=step) t.push(+v.toFixed(2));
  return t;
}
function chart(ss){
  const W=600,H=230,L=44,R=14,T=12,B=30;
  const vals = ss.flatMap(s => [s.e, s.top]);
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals));
  const lo = ticks[0], hi = ticks[ticks.length-1], li = ss.length-1;
  const x = i => ss.length === 1 ? (L + (W-L-R)/2) : L + i*(W-L-R)/li;
  const y = v => T + (H-T-B)*(1-(v-lo)/(hi-lo));
  const line = key => ss.map((s,i) => `${i?"L":"M"}${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join("");
  const xl = ss.length === 1 ? [0] : ss.length === 2 ? [0,1] : [0, Math.floor(li/2), li];
  const F = `font-family="Barlow,system-ui" font-size="12" fill="var(--muted)"`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart for ${esc(S.progEx)}">
    ${ticks.map(t => `<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end" ${F}>${fmtKg(t)}</text>`).join("")}
    ${xl.map(i => `<text x="${x(i)}" y="${H-8}" text-anchor="${ss.length>1 && i===0?"start":ss.length>1 && i===li?"end":"middle"}" ${F}>${fmtShort(ss[i].k)}</text>`).join("")}
    ${ss.length>1 ? `<path d="${line("e")}L${x(li)},${H-B}L${x(0)},${H-B}Z" fill="var(--accent)" fill-opacity=".10"/>
      <path d="${line("top")}" fill="none" stroke="var(--pr)" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="${line("e")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>` : ""}
    ${ss.map((s,i) => `<circle cx="${x(i)}" cy="${y(s.e)}" r="${i===li?5:3}" fill="${i===li?"var(--accent)":"var(--surface)"}" stroke="var(--accent)" stroke-width="2"/>`).join("")}
    <text x="${Math.min(x(li), W-R-4)}" y="${Math.max(y(ss[li].e)-10, T+10)}" text-anchor="${ss.length>1?"end":"middle"}" font-size="13" font-weight="600" fill="var(--accent)" font-family="Barlow,system-ui">${fmtKg(Math.round(ss[li].e*2)/2)} kg</text></svg>`;
}
function viewHistory(){
  const keys = sortedKeys().reverse();
  if (!keys.length) return `<div class="empty"><h3>No workouts yet</h3><p>Every day you log appears here with its exercises, sets and total volume. Tap a day to open it.</p><button class="btn" data-act="tolog">Log today's workout</button></div>`;
  return `<div class="sec">${keys.map(k => {
    const exs = S.days[k].exercises, d = dateOf(k);
    const sets = exs.reduce((a,e) => a + validSets(e).length, 0), vol = exs.reduce((a,e) => a + exVolume(e), 0);
    return `<button class="hist" data-act="go" data-k="${k}" data-tolog="1">
      <div class="d"><small>${DOW[d.getDay()]}</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small></div>
      <div class="t"><strong>${S.days[k].planName ? esc(S.days[k].planName) + ": " : ""}${exs.map(e => esc(e.name)).join(" · ")}</strong><span class="num-t">${exs.length} exercises · ${sets} sets · ${fmtKg(vol)} kg</span></div></button>`;
  }).join("")}</div>`;
}

/* ---------- live workout mode ---------- */
let wake = null;
async function wakeOn(){ try { wake = await navigator.wakeLock.request("screen"); } catch {} }
function wakeOff(){ try { wake && wake.release(); } catch {} wake = null; }
document.addEventListener("visibilitychange", () => { if (S.live && document.visibilityState === "visible") wakeOn(); });

function openLive(){
  const exs = S.days[S.cur].exercises;
  let ei = exs.findIndex(e => e.sets.some(s => !s.done)); if (ei < 0) ei = 0;
  S.live = { ei, si: firstOpen(exs[ei]), done:false };
  document.body.classList.add("lock"); wakeOn(); render();
}
function closeLive(){ S.live = null; document.body.classList.remove("lock"); wakeOff(); render(); }
const firstOpen = ex => { const i = ex.sets.findIndex(s => !s.done); return i < 0 ? ex.sets.length - 1 : i; };

function renderLive(){
  const w = $("#liveWrap");
  if (!S.live || !S.days[S.cur] || !S.days[S.cur].exercises.length) { w.innerHTML = ""; if (S.live) { S.live = null; document.body.classList.remove("lock"); } return; }
  const day = S.days[S.cur], exs = day.exercises;
  if (S.live.done) {
    const sets = exs.reduce((a,e) => a + doneSets(e).length, 0), vol = exs.reduce((a,e) => a + doneSets(e).reduce((b,s) => b + num(s.w)*num(s.r), 0), 0);
    const prs = exs.reduce((a,e) => { const b = bestBefore(e.name, S.cur); return a + (e.sets.some(s => isPR(s,b)) ? 1 : 0); }, 0);
    w.innerHTML = `<div class="live"><div class="lin done-screen">
      <h2>Workout<br>done</h2><p style="color:var(--muted);margin:0">${esc(day.planName || fmtLong(S.cur))}</p>
      <div class="stats" style="text-align:left">
        <div class="stat"><small>Sets</small><b>${sets}</b></div><div class="stat"><small>Volume</small><b>${fmtKg(vol)}<em>kg</em></b></div>
        <div class="stat"><small>Exercises</small><b>${exs.filter(e => doneSets(e).length).length}</b></div><div class="stat"><small>New PRs</small><b style="color:${prs?"var(--pr)":"inherit"}">${prs}</b></div></div>
      <button class="lgo" data-act="lclose">Close</button></div></div>`;
    return;
  }
  const L = S.live; L.ei = Math.min(L.ei, exs.length-1);
  const ex = exs[L.ei]; L.si = Math.min(L.si, ex.sets.length-1);
  const s = ex.sets[L.si];
  const prev = previous(ex.name, S.cur);
  const allDone = ex.sets.every(x => x.done);
  const lastEx = L.ei === exs.length - 1;
  const restEl = rest ? restHTML(true) : "";
  let go;
  if (allDone) go = lastEx ? `<button class="lgo next" data-act="lfinish">Finish workout<small>All sets logged</small></button>`
                           : `<button class="lgo next" data-act="lnext">Next: ${esc(exs[L.ei+1].name)} →<small>${ex.name} complete</small></button>`;
  else go = `<button class="lgo" data-act="llog">${s.done ? "Update" : "Log"} set ${L.si+1}<small class="num-t">${fmtKg(num(s.w))} kg × ${num(s.r)} reps</small></button>`;
  w.innerHTML = `<div class="live" role="dialog" aria-label="Workout mode"><div class="lin">
    <div class="lhead"><button class="x" data-act="lclose" aria-label="Back to log">✕</button>
      <small>${esc(day.planName || "Workout")} · ${L.ei+1} of ${exs.length}</small>
      <button class="fin" data-act="lfinish">Finish</button></div>
    <div class="prog">${exs.map((e,i) => { const d = doneSets(e).length; return `<button class="${d===e.sets.length?"full":d?"part":""} ${i===L.ei?"cur":""}" data-act="ljump" data-i="${i}" aria-label="${esc(e.name)}"></button>`; }).join("")}</div>
    <div><h2 class="lname">${esc(ex.name)}</h2></div>
    <div class="lmeta"><span class="prev num-t">${prev ? `Last · ${fmtShort(prev.key)}: ${validSets(prev.ex).map(x => `${fmtKg(num(x.w))}×${num(x.r)}`).join(", ")}` : "First time logging this"}${ex.hi ? ` · target ${ex.lo}–${ex.hi} reps` : ""}</span>
      <span class="hint">↑ ${esc(hint(prev, ex))}</span></div>
    <div class="pills">${ex.sets.map((x,i) => `<button class="pill ${x.done?"done":""}" data-act="lset" data-i="${i}" aria-current="${i===L.si}"><small>${x.done?"✓ ":""}Set ${i+1}</small><b>${x.w!==""||x.r!=="" ? `${fmtKg(num(x.w))}×${num(x.r)}` : "—"}</b></button>`).join("")}
      <button class="pill" data-act="ladd" aria-label="Add a set"><small>Add</small><b>+</b></button></div>
    ${restEl}
    <div class="big">
      <div class="lbl"><span>Weight · kg</span><span>±${SET.step}</span></div>
      <div class="lnum"><button data-act="lstep" data-f="w" data-n="-${SET.step}" aria-label="Less weight">−</button>
        <input type="number" inputmode="decimal" id="lw" data-lf="w" value="${esc(s.w)}" placeholder="0" aria-label="Weight in kg">
        <button data-act="lstep" data-f="w" data-n="${SET.step}" aria-label="More weight">+</button></div>
      <div class="div"></div>
      <div class="lbl"><span>Reps</span><span>±1</span></div>
      <div class="lnum"><button data-act="lstep" data-f="r" data-n="-1" aria-label="Fewer reps">−</button>
        <input type="number" inputmode="numeric" id="lr" data-lf="r" value="${esc(s.r)}" placeholder="0" aria-label="Reps">
        <button data-act="lstep" data-f="r" data-n="1" aria-label="More reps">+</button></div>
    </div>
    ${go}
    <div class="lnav"><button data-act="lprev" ${L.ei?"":"disabled"}>‹ Prev</button><button data-act="lsheet">+ Exercise</button><button data-act="lnextx" ${lastEx?"disabled":""}>Next ›</button></div>
  </div></div>`;
}
function liveLog(){
  const exs = S.days[S.cur].exercises, L = S.live, ex = exs[L.ei], s = ex.sets[L.si];
  if (num(s.r) <= 0) { const r = $("#lr"); if (r) { r.focus(); } return; }
  const wasDone = s.done; s.done = true;
  const nxt = ex.sets.findIndex((x,i) => !x.done && i > L.si);
  const any = nxt >= 0 ? nxt : ex.sets.findIndex(x => !x.done);
  if (any >= 0) {
    const n = ex.sets[any];
    if (n.w === "" ) n.w = s.w;
    if (n.r === "") n.r = s.r;
    L.si = any;
  }
  persist(S.cur);
  if (!wasDone && any >= 0) startRest(); else if (!wasDone && L.ei < exs.length-1) startRest();
  render();
}

/* ---------- sheet ---------- */
function renderSheet(){
  const o = $("#overlay");
  if (!S.sheet) { o.innerHTML = ""; return; }
  const target = S.sheet.r ? (routine(S.sheet.r)?.exercises || []) : (S.days[S.cur]?.exercises || []);
  const used = new Set(target.map(e => norm(e.name)));
  const q = norm(S.q);
  const flat = Object.values(PRESETS).flat();
  const mine = allNames().filter(n => !flat.some(p => norm(p) === norm(n)));
  const groups = Object.entries({ ...(mine.length ? { "Your exercises": mine } : {}), ...PRESETS });
  let body = "";
  groups.forEach(([g, list]) => {
    const f = list.filter(n => !q || norm(n).includes(q));
    if (f.length) body += `<div><h4>${esc(g)}</h4><div class="chips">${f.map(n => `<button class="chip" data-act="pick" data-name="${esc(n)}" ${used.has(norm(n))?'aria-pressed="true"':""}>${esc(n)}</button>`).join("")}</div></div>`;
  });
  if (q && !flat.concat(allNames()).some(n => norm(n) === q)) body = `<div><button class="btn" data-act="pick" data-name="${esc(S.q.trim())}">Add “${esc(S.q.trim())}”</button></div>` + body;
  if (!o.firstChild) {
    o.innerHTML = `<div class="scrim" data-act="close"><div class="sheet" role="dialog" aria-label="Add exercise">
      <div class="sh"><div><h3 id="shTitle"></h3><button class="more" data-act="close" aria-label="Close">✕</button></div>
      <input class="search" id="q" type="search" placeholder="Search or type a new exercise" autocomplete="off"></div>
      <div class="groups" id="groups"></div></div></div>`;
  }
  $("#shTitle").textContent = S.sheet.r ? `Add to ${routine(S.sheet.r).name || "workout"}` : "Add exercise";
  $("#groups").innerHTML = body || `<p style="color:var(--muted);margin:0">Type a name to add your own exercise.</p>`;
}
function pick(name){
  const t = S.sheet;
  if (t.r) { routine(t.r).exercises.push({ name, sets:3, lo:8, hi:12 }); persist("plan"); }
  else {
    const day = dayOf(S.cur); day.exercises.push(newLogExercise(name)); persist(S.cur);
    if (t.live && S.live) { S.live.ei = day.exercises.length - 1; S.live.si = 0; }
  }
  S.sheet = null; S.q = ""; render();
}

/* ---------- rest timer ---------- */
let rest = null;
function startRest(){ if (rest) clearInterval(rest.iv); rest = { end: Date.now() + SET.rest*1000, iv: setInterval(tickRest, 250), buzzed:false }; tickRest(); }
function stopRest(){ if (rest) clearInterval(rest.iv); rest = null; drawRest(); renderLive(); }
function restText(){ const left = Math.round((rest.end - Date.now())/1000), a = Math.abs(left); return { left, t:`${left<0?"+":""}${Math.floor(a/60)}:${pad(a%60)}` }; }
function restHTML(big){
  const { left, t } = restText();
  return big ? `<div class="lrest ${left<0?"over":""}" id="lrest"><span class="tt">${t}</span><span class="lb">${left<0?"Rest over. Go!":"Resting"}</span><button data-act="rest30">+30s</button><button data-act="restx">${left<0?"OK":"Skip"}</button></div>`
             : `<div class="rest"><div class="bar"><span class="tt">${t}</span><span class="lb">${left<0?"Rest done, next set":"Rest timer"}</span><button data-act="rest30">+30s</button><button data-act="restx">${left<0?"Close":"Skip"}</button></div></div>`;
}
function tickRest(){
  if (!rest) return;
  const { left } = restText();
  if (left <= 0 && !rest.buzzed) { rest.buzzed = true; try { navigator.vibrate && navigator.vibrate([200,100,200]); } catch {} }
  if (left < -300) { stopRest(); return; }
  drawRest();
  const el = $("#lrest");
  if (el) el.outerHTML = restHTML(true);
  else if (S.live && !S.live.done) renderLiveKeepFocus();
}
function renderLiveKeepFocus(){ const a = document.activeElement; if (a && a.tagName === "INPUT") return; renderLive(); }
function drawRest(){ $("#restWrap").innerHTML = rest && !S.live ? restHTML(false) : ""; }

/* ---------- sign-in & first-time setup screens ---------- */
const auth = { mode:"signin", busy:false, err:"", info:"" };
const isGuest = () => { try { return localStorage.getItem("replog.guest") === "1"; } catch { return false; } };
function decideGate(){
  let g = null;
  if (S.setup && S.setup.manual) g = "setup";
  else if (sb && !session && !isGuest()) g = "auth";
  else if (auth.mode === "reset" && S.gate === "auth") g = "auth";
  else if (sb && session && !S.firstPullDone && navigator.onLine && syncState.ok !== false) g = "loading";
  else if (!S.planLoaded) { g = "setup"; if (!S.setup) S.setup = { step:1, tpl:null, manual:false }; }
  if (g !== "setup" && S.setup && !S.setup.manual) S.setup = null;
  const changed = g !== S.gate; S.gate = g;
  if (changed || g) { renderGate(); if (!g) render(); }
}
function renderGate(){
  const w = $("#gateWrap"); document.body.classList.toggle("gated", !!S.gate);
  if (!S.gate) { w.innerHTML = ""; return; }
  if (S.gate === "loading") { w.innerHTML = `<div class="gate"><div class="gin center"><div class="logo">Rep<span>/</span>Log</div><p class="muted">Loading your workouts…</p></div></div>`; return; }
  if (S.gate === "auth") { renderAuth(w); return; }
  renderSetup(w);
}
function renderAuth(w){
  const keep = { n:$("#au-name")?.value, e:$("#au-email")?.value };
  const m = auth.mode;
  let remember = true; try { remember = localStorage.getItem("replog.remember") !== "0"; } catch {}
  const title = m === "signup" ? "Create your account" : m === "forgot" ? "Reset your password" : m === "reset" ? "Choose a new password" : "Welcome back";
  w.innerHTML = `<div class="gate"><form class="gin" id="authForm" novalidate>
    <div class="logo">Rep<span>/</span>Log</div>
    <div><h2>${title}</h2><p class="muted">${m === "signup" ? "Your workouts and history are saved to your account and sync to any phone." : m === "forgot" ? "We'll email you a link to set a new password." : m === "reset" ? "Enter the new password for your account." : "Sign in to pick up where you left off."}</p></div>
    ${m === "signin" || m === "signup" ? `<div class="seg" role="tablist"><button type="button" role="tab" data-act="au-mode" data-m="signin" aria-selected="${m==="signin"}">Sign in</button><button type="button" role="tab" data-act="au-mode" data-m="signup" aria-selected="${m==="signup"}">Create account</button></div>` : ""}
    ${m === "signup" ? `<label class="fld"><span>Your name</span><input id="au-name" autocomplete="given-name" placeholder="e.g. Yousef"></label>` : ""}
    ${m !== "reset" ? `<label class="fld"><span>Email</span><input id="au-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="you@example.com"></label>` : ""}
    ${m !== "forgot" ? `<label class="fld"><span>${m === "reset" ? "New password" : "Password"}</span><input id="au-pass" type="password" autocomplete="${m === "signin" ? "current-password" : "new-password"}" placeholder="At least 6 characters"></label>` : ""}
    ${m === "signin" || m === "signup" ? `<label class="check"><input type="checkbox" id="au-remember" ${remember ? "checked" : ""}><span>Keep me signed in on this phone</span></label>` : ""}
    ${auth.err ? `<p class="err" role="alert">${esc(auth.err)}</p>` : ""}${auth.info ? `<p class="ok" role="status">${esc(auth.info)}</p>` : ""}
    <button class="btn big" type="submit" ${auth.busy ? "disabled" : ""}>${auth.busy ? "One moment…" : m === "signup" ? "Create account" : m === "forgot" ? "Send reset link" : m === "reset" ? "Save new password" : "Sign in"}</button>
    <div class="links">
      ${m === "signin" ? `<button type="button" data-act="au-mode" data-m="forgot">Forgot password?</button>` : ""}
      ${m === "forgot" ? `<button type="button" data-act="au-mode" data-m="signin">Back to sign in</button>` : ""}
      ${m === "signin" || m === "signup" ? `<button type="button" data-act="au-guest">Use without an account</button>` : ""}
    </div></form></div>`;
  if (keep.n && $("#au-name")) $("#au-name").value = keep.n;
  if (keep.e && $("#au-email")) $("#au-email").value = keep.e;
}
async function submitAuth(){
  const m = auth.mode, email = $("#au-email")?.value.trim(), password = $("#au-pass")?.value || "", name = $("#au-name")?.value.trim();
  auth.err = ""; auth.info = "";
  if (m !== "reset" && !/^\S+@\S+\.\S+$/.test(email || "")) { auth.err = "Enter a valid email address."; return renderGate(); }
  if (m !== "forgot" && password.length < 6) { auth.err = "Password needs at least 6 characters."; return renderGate(); }
  try { const rm = $("#au-remember"); if (rm) localStorage.setItem("replog.remember", rm.checked ? "1" : "0"); } catch {}
  auth.busy = true; renderGate();
  try {
    let r;
    if (m === "signup") r = await sb.auth.signUp({ email, password, options:{ data:{ name } } });
    else if (m === "signin") r = await sb.auth.signInWithPassword({ email, password });
    else if (m === "forgot") r = await sb.auth.resetPasswordForEmail(email, { redirectTo:location.origin + location.pathname });
    else r = await sb.auth.updateUser({ password });
    if (r.error) auth.err = /invalid login/i.test(r.error.message) ? "Wrong email or password." : r.error.message;
    else if (m === "signup" && !r.data.session) { auth.info = "Account created. Open the confirmation email, then sign in here."; auth.mode = "signin"; }
    else if (m === "forgot") auth.info = "Check your email for the reset link.";
    else if (m === "reset") { auth.mode = "signin"; auth.info = ""; toast("Password updated"); }
    try { localStorage.removeItem("replog.guest"); } catch {}
  } catch { auth.err = "Couldn't reach the server. Check your connection and try again."; }
  auth.busy = false;
  if (session && auth.mode !== "reset") { S.gate = null; decideGate(); } else renderGate();
}

function renderSetup(w){
  const st = S.setup, first = !st.manual;
  const hello = userName() ? `Hi ${esc(userName().split(" ")[0])}! ` : "";
  if (st.step === 1) {
    w.innerHTML = `<div class="gate"><div class="gin">
      <div class="steps"><i class="on"></i><i></i></div>
      <div><h2>${first ? `${hello}Let's build your workouts` : "Start over from a template"}</h2>
      <p class="muted">${first ? "Pick how you split your training. You'll adjust the exercises next, and can change everything later in the Plan tab." : "This replaces your current workouts. Your logged history stays."}</p></div>
      <div class="tpl">${TEMPLATES.map(t => `<button data-act="su-tpl" data-t="${t.id}" aria-pressed="${st.tpl === t.id}"><strong>${t.name}</strong><span>${t.desc}</span></button>`).join("")}</div>
      <div class="pair">${first ? "" : `<button class="btn ghost" data-act="su-cancel">Cancel</button>`}<button class="btn big" data-act="su-next" ${st.tpl ? "" : "disabled"}>Next: adjust exercises</button></div>
    </div></div>`;
    return;
  }
  const openId = S.openR;
  w.innerHTML = `<div class="gate"><div class="gin">
    <div class="steps"><i class="on"></i><i class="on"></i></div>
    <div><h2>Your workouts</h2><p class="muted">Tap a workout to rename it, add or remove exercises, and set sets and reps. You'll do them in this order, then repeat.</p></div>
    <div class="plan">${S.routines.map((r,i) => `<section class="pday ${openId===r.id?"open":""}">
      <button class="phead" data-act="ropen" data-r="${r.id}" aria-expanded="${openId===r.id}"><span class="dw">${i+1}</span>
        <span class="t"><strong>${esc(r.name || "Untitled workout")}</strong><span>${r.exercises.length ? esc(r.exercises.map(e => e.name).join(" · ")) : "No exercises yet"}</span></span><span class="chev">›</span></button>
      ${openId===r.id ? routineBody(r,i) : ""}</section>`).join("")}</div>
    <button class="cta" data-act="rnew">+ Add another workout</button>
    <div class="pair"><button class="btn ghost" data-act="su-back">Back</button><button class="btn big" data-act="su-save">Save my workouts</button></div>
  </div></div>`;
}
function setupSave(){
  const rs = S.routines.filter(r => r.exercises.length || r.name.trim());
  if (!rs.length || !rs.some(r => r.exercises.length)) { toast("Add at least one exercise first"); return; }
  rs.forEach((r,i) => { if (!r.name.trim()) r.name = `Workout ${String.fromCharCode(65+i)}`; });
  S.routines = rs; S.setup = null; S.planLoaded = true; S.openR = null;
  persist("plan"); S.view = "log"; S.cur = today();
  S.gate = null; renderGate(); render(); scrollTo(0,0); toast("Workouts saved");
}
document.addEventListener("submit", e => { if (e.target.id === "authForm") { e.preventDefault(); submitAuth(); } });

/* ---------- settings, account, backup ---------- */
let authBusy = false, authErr = "";
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
function renderSettings(){
  const w = $("#settingsWrap");
  if (!S.settings) { w.innerHTML = ""; return; }
  const keep = { e: $("#se-email")?.value, p: $("#se-pass")?.value };
  let acct;
  if (!sb) acct = `<p class="muted">Cloud sync isn't set up yet, so logs are saved only on this phone. Add your Supabase keys to <code>config.js</code> to back up and sync across devices.</p>`;
  else if (!session) acct = `<p class="muted">You're using the app without an account. Sign in to back up your logs and use them on any device.</p>
    <button class="btn" data-act="go-signin">Sign in or create account</button>`;
  else acct = `<p><b>${esc(userName() || session.user.email)}</b>${userName() ? `<br><span class="muted">${esc(session.user.email)}</span>` : ""}</p>
    <p class="muted">${!navigator.onLine ? "Offline. Changes sync when you're back online." : syncState.ok === false ? `Last sync failed: ${esc(syncState.msg)}` : syncState.at ? `Synced at ${syncState.at.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}` : "Not synced yet"}</p>
    <div class="pair"><button class="btn" data-act="syncnow">${syncing ? "Syncing…" : "Sync now"}</button><button class="btn ghost" data-act="signout">Sign out</button></div>`;
  const chip = (act, v, cur, label) => `<button class="chip" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${label}</button>`;
  w.innerHTML = `<div class="scrim" data-act="setclose"><div class="sheet" role="dialog" aria-label="Settings"><div class="sh"><div><h3>Settings</h3><button class="more" data-act="setclose" aria-label="Close">✕</button></div></div>
    <div class="groups">
      <div class="setg"><h4>Account &amp; sync</h4>${acct}</div>
      <div class="setg"><h4>Rest timer</h4><div class="chips">${[60,90,120,180].map(v => chip("setrest", v, SET.rest, v < 120 ? `${v}s` : `${v/60} min`)).join("")}</div></div>
      <div class="setg"><h4>Weight buttons step</h4><div class="chips">${[1.25,2.5,5].map(v => chip("setstep", v, SET.step, `${v} kg`)).join("")}</div></div>
      <div class="setg"><h4>Backup</h4><p class="muted">Save all your logs and workouts to a file, or restore from one.</p>
        <div class="pair"><button class="btn ghost" data-act="export">Export backup</button><label class="btn ghost" for="se-file">Import backup</label></div>
        <input type="file" id="se-file" accept="application/json,.json" hidden></div>
      ${standalone() ? "" : `<div class="setg"><h4>Install on your phone</h4><p class="muted">iPhone: open in Safari, tap Share, then <b>Add to Home Screen</b>. Android: Chrome menu ⋮, then <b>Install app</b>.</p></div>`}
    </div></div></div>`;
  if (keep.e) $("#se-email").value = keep.e;
  if (keep.p) $("#se-pass").value = keep.p;
}
async function doAuth(kind){
  const email = $("#se-email").value.trim(), password = $("#se-pass").value;
  if (!email || password.length < 6) { authErr = "Enter your email and a password of at least 6 characters."; renderSettings(); return; }
  authBusy = true; authErr = ""; renderSettings();
  try {
    const r = kind === "up" ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password });
    if (r.error) authErr = r.error.message;
    else if (kind === "up" && !r.data.session) authErr = "Account created. Confirm the email we sent you, then sign in here.";
  } catch (e) { authErr = "Couldn't reach the server. Check your connection."; }
  authBusy = false; renderSettings();
}
async function signOutAll(){
  if (navigator.onLine) await sync();
  const dirty = (await idb.all()).filter(r => r.dirty);
  if (dirty.length) { toast("Some changes haven't synced yet. Connect to the internet, then sign out."); return; }
  await sb.auth.signOut();
  try { await idb.clear(); localStorage.removeItem("replog.guest"); } catch {}
  location.reload();
}
async function exportBackup(){
  const docs = (await idb.all()).filter(r => !r.deleted).map(r => ({ id:r.id, data:r.data, updatedAt:r.updatedAt }));
  const blob = new Blob([JSON.stringify({ app:"replog", version:1, exportedAt:new Date().toISOString(), docs }, null, 1)], { type:"application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `replog-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function importBackup(file){
  try {
    const j = JSON.parse(await file.text());
    if (!j || j.app !== "replog" || !Array.isArray(j.docs)) throw 0;
    const now = Date.now();
    const recs = j.docs.filter(d => d && typeof d.id === "string").map((d,i) => ({ id:d.id, data:d.data, updatedAt:now + i, deleted:false, dirty:1 }));
    await idb.putMany(recs); recs.forEach(applyRecord);
    toast(`Restored ${recs.filter(r => /^\d{4}-/.test(r.id)).length} workout days`); render(); scheduleSync();
  } catch { toast("That file isn't a Rep Log backup."); }
}
document.addEventListener("change", e => { if (e.target.id === "se-file" && e.target.files[0]) importBackup(e.target.files[0]); });

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act],[data-view]"); if (!b || b.disabled) return;
  if (b.dataset.view) { S.view = b.dataset.view; S.menu = null; S.armR = null; render(); scrollTo(0,0); return; }
  const a = b.dataset.act;
  if (a === "go-signin") { try { localStorage.removeItem("replog.guest"); } catch {} S.settings = false; renderSettings(); auth.mode = "signin"; decideGate(); return; }
  if (a === "au-mode") { auth.mode = b.dataset.m; auth.err = ""; auth.info = ""; renderGate(); return; }
  if (a === "au-guest") { try { localStorage.setItem("replog.guest", "1"); } catch {} decideGate(); return; }
  if (a === "su-tpl") { S.setup.tpl = b.dataset.t; renderGate(); return; }
  if (a === "su-next") { const t = TEMPLATES.find(x => x.id === S.setup.tpl); S.routines = t.make(); S.openR = S.routines[0] && !S.routines[0].exercises.length ? S.routines[0].id : null; S.setup.step = 2; renderGate(); $("#gateWrap .gate").scrollTop = 0; return; }
  if (a === "su-back") { S.setup.step = 1; renderGate(); return; }
  if (a === "su-save") { setupSave(); return; }
  if (a === "su-cancel") { S.routines = S.setup.backup; S.setup = null; S.gate = null; renderGate(); render(); return; }
  if (a === "rebuild") { S.setup = { step:1, tpl:null, manual:true, backup:JSON.parse(JSON.stringify(S.routines)) }; S.openR = null; decideGate(); return; }
  if (a === "settings") { S.settings = true; authErr = ""; renderSettings(); return; }
  if (a === "setclose") { if (e.target === b || b.tagName === "BUTTON") { S.settings = false; renderSettings(); } return; }
  if (a === "signin" || a === "signup") { doAuth(a === "signup" ? "up" : "in"); return; }
  if (a === "signout") { signOutAll(); return; }
  if (a === "syncnow") { sync(); renderSettings(); return; }
  if (a === "setrest" || a === "setstep") { SET[a === "setrest" ? "rest" : "step"] = +b.dataset.v; persist("settings"); renderSettings(); render(); return; }
  if (a === "export") { exportBackup(); return; }
  if (a === "close") { if (e.target === b || b.tagName === "BUTTON") { S.sheet = null; S.q = ""; render(); } return; }
  if (a === "wk") { S.cur = addDays(S.cur, +b.dataset.n); S.menu = null; render(); return; }
  if (a === "go") { S.cur = b.dataset.k; S.menu = null; if (b.dataset.tolog) { S.view = "log"; scrollTo(0,0); } render(); return; }
  if (a === "tolog") { S.view = "log"; S.cur = today(); render(); return; }
  if (a === "toplan") { S.view = "plan"; render(); return; }
  if (a === "sheet" || a === "lsheet") { S.sheet = { live: a === "lsheet" }; S.q = ""; render(); return; }
  if (a === "psheet") { S.sheet = { r:b.dataset.r }; S.q = ""; render(); return; }
  if (a === "pick") { pick(b.dataset.name); return; }
  if (a === "quick") { dayOf(S.cur).exercises.push(newLogExercise(b.dataset.name)); persist(S.cur); render(); return; }
  if (a === "repeat") { const src = S.days[b.dataset.k]; const day = dayOf(S.cur); day.planName = src.planName || ""; day.routineId = src.routineId || ""; src.exercises.forEach(x => day.exercises.push(newLogExercise(x.name, x.sets.length, x.lo, x.hi))); persist(S.cur); render(); return; }
  if (a === "startr") {
    const p = routine(b.dataset.r), day = dayOf(S.cur); day.planName = p.name || ""; day.routineId = p.id;
    p.exercises.forEach(x => day.exercises.push(newLogExercise(x.name, x.sets, x.lo, x.hi)));
    persist(S.cur); openLive(); return;
  }
  if (a === "startlive") { openLive(); return; }
  if (a === "pex") { S.progEx = b.dataset.name; render(); return; }
  if (a === "rest30") { if (rest) { rest.end = Math.max(rest.end, Date.now()) + 30000; rest.buzzed = false; tickRest(); } return; }
  if (a === "restx") { stopRest(); return; }

  // plan
  if (a === "ropen") { S.openR = S.openR === b.dataset.r ? null : b.dataset.r; S.armR = null; render(); return; }
  if (a === "rnew") { const r = { id:"r-"+uid(), name:"", exercises:[] }; S.routines.push(r); S.openR = r.id; persist("plan"); render(); setTimeout(() => $("#rname-"+r.id)?.focus(), 30); return; }
  if (a === "rup") { const i = S.routines.findIndex(r => r.id === b.dataset.r); if (i > 0) { const [r] = S.routines.splice(i,1); S.routines.splice(i-1,0,r); persist("plan"); } render(); return; }
  if (a === "rdel") {
    if (S.armR !== b.dataset.r) { S.armR = b.dataset.r; render(); return; }
    S.routines = S.routines.filter(r => r.id !== b.dataset.r); S.armR = null; S.openR = null; persist("plan"); render(); return;
  }
  if (a === "pup" || a === "pdel" || a === "psets") {
    const p = routine(b.dataset.r), i = +b.closest("[data-pi]").dataset.pi;
    if (a === "pup" && i > 0) { const [x] = p.exercises.splice(i,1); p.exercises.splice(i-1,0,x); }
    if (a === "pdel") p.exercises.splice(i,1);
    if (a === "psets") p.exercises[i].sets = Math.max(1, Math.min(10, p.exercises[i].sets + +b.dataset.n));
    persist("plan"); render(); return;
  }

  // live
  if (S.live) {
    const exs = S.days[S.cur].exercises, L = S.live;
    if (a === "lclose") { closeLive(); return; }
    if (a === "lfinish") { L.done = true; stopRest(); render(); return; }
    if (a === "llog") { liveLog(); return; }
    if (a === "lset") { L.si = +b.dataset.i; render(); return; }
    if (a === "ladd") { const ex = exs[L.ei], l = ex.sets[ex.sets.length-1]; ex.sets.push({ w:l?l.w:"", r:l?l.r:"", done:false }); L.si = ex.sets.length-1; persist(S.cur); render(); return; }
    if (a === "lstep") {
      const s = exs[L.ei].sets[L.si], f = b.dataset.f;
      s[f] = String(Math.max(0, Math.round((num(s[f]) + +b.dataset.n)*10)/10));
      persist(S.cur); renderLive(); return;
    }
    if (a === "lnext" || a === "lnextx") { L.ei = Math.min(exs.length-1, L.ei+1); L.si = firstOpen(exs[L.ei]); render(); scrollLiveTop(); return; }
    if (a === "lprev") { L.ei = Math.max(0, L.ei-1); L.si = firstOpen(exs[L.ei]); render(); scrollLiveTop(); return; }
    if (a === "ljump") { L.ei = +b.dataset.i; L.si = firstOpen(exs[L.ei]); render(); scrollLiveTop(); return; }
  }

  // log cards
  const ex = curEx(b); if (!ex) return;
  if (a === "menu") { S.menu = S.menu === ex.id ? null : ex.id; S.armDel = null; render(); return; }
  if (a === "rmset") { if (ex.sets.length > 1) ex.sets.pop(); persist(S.cur); render(); return; }
  if (a === "up") { const l = S.days[S.cur].exercises, i = l.indexOf(ex); if (i > 0) { l.splice(i,1); l.splice(i-1,0,ex); persist(S.cur); } render(); return; }
  if (a === "delex") {
    if (S.armDel !== ex.id) { S.armDel = ex.id; render(); return; }
    const l = S.days[S.cur].exercises; l.splice(l.indexOf(ex),1); S.menu = null; S.armDel = null; persist(S.cur); render(); return;
  }
  if (a === "addset") { const l = ex.sets[ex.sets.length-1] || { w:"", r:"" }; ex.sets.push({ w:l.w, r:l.r, done:false }); persist(S.cur); render(); return; }
  const row = b.closest(".row"); if (!row) return;
  const s = ex.sets[+row.dataset.i];
  if (a === "inc" || a === "dec") {
    const f = b.dataset.f, d = (f === "w" ? SET.step : 1) * (a === "inc" ? 1 : -1);
    s[f] = String(Math.max(0, Math.round((num(s[f]) + d)*10)/10));
    row.querySelector(`input[data-f="${f}"]`).value = s[f];
    b.closest(".ex").querySelector("[data-vol]").textContent = volTxt(ex);
    persist(S.cur); return;
  }
  if (a === "done") { s.done = !s.done; persist(S.cur); if (s.done) startRest(); render(); }
});
const scrollLiveTop = () => { const l = $(".live"); if (l) l.scrollTop = 0; };
function curEx(el){ const id = el.closest("[data-ex]")?.dataset.ex; return S.days[S.cur]?.exercises.find(e => e.id === id); }

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") { S.q = t.value; renderSheet(); return; }
  if (t.dataset.rname) { routine(t.dataset.rname).name = t.value; persist("plan"); return; }
  if (t.dataset.prr) { const p = routine(t.dataset.r), i = +t.closest("[data-pi]").dataset.pi; p.exercises[i][t.dataset.prr] = Math.max(1, Math.round(num(t.value))) || 1; persist("plan"); return; }
  if (t.dataset.lf && S.live) {
    const s = S.days[S.cur].exercises[S.live.ei].sets[S.live.si]; s[t.dataset.lf] = t.value; persist(S.cur);
    const g = $(".lgo small"); if (g && !g.closest(".next")) g.textContent = `${fmtKg(num(s.w))} kg × ${num(s.r)} reps`;
    return;
  }
  const f = t.dataset.f; if (!f) return;
  const ex = curEx(t); if (!ex) return;
  ex.sets[+t.closest(".row").dataset.i][f] = t.value;
  t.closest(".ex").querySelector("[data-vol]").textContent = volTxt(ex);
  persist(S.cur);
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "q" && S.q.trim()) { const first = $("#groups [data-act=pick]"); if (first) first.click(); }
  if (e.key === "Enter" && e.target.dataset && e.target.dataset.lf) { e.target.blur(); }
  if (e.key === "Escape" && S.sheet) { S.sheet = null; render(); }
  if (e.key === "Escape" && S.settings) { S.settings = false; renderSettings(); }
  if (e.key === "Enter" && e.target.id === "se-pass") doAuth("in");
});

(async () => {
  await loadLocal(); render(); await initAuth(); decideGate();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then(reg => {
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
    }).catch(() => {});
    // A new version took over: reload to show it, unless a workout is in progress.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloaded) return;
      if (S.live) { toast("App updated. Changes show after this workout."); return; }
      reloaded = true; location.reload();
    });
  }
})();
})();

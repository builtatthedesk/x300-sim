// Playground UI: drives the same Machine the tests use (../lib/x300.js), with the
// same room model (../lib/world.js). Relative imports keep it working under any
// path prefix.
import { Machine, check, clock, isoDate, weekday, dayFromIso, LIMITS } from "../lib/x300.js";
import { ROOM, hm } from "../lib/world.js";

const $ = (id) => document.getElementById(id);
const base = new URL("../", import.meta.url);
const examples = await (await fetch(new URL("examples.json", base))).json();

let ex = examples[0], speed = 0, nextFeed = 0, pushes = 0, last = performance.now(), sinceSample = 0;
const history = [];                            // {t (sim seconds, absolute), inside, outside, r1}
const log = (text) => {
  const li = document.createElement("li");
  li.textContent = `${isoDate(m.day).slice(5)} ${clock(m.seconds)}  ${text}`;
  $("log").prepend(li);
  while ($("log").children.length > 80) $("log").lastChild.remove();
};
const m = new Machine({
  onEvent: (e) => {
    if (e.type === "relay") log(`relay${e.relay} ${e.value ? "ON" : "OFF"}  (line ${e.line}: ${e.code})`);
    else if (e.type === "error") log(`script error: ${e.message}`);
    else if (e.type === "start") log("script started");
    else if (e.type === "power") log("power cut: unit restarted");
    else if (e.type === "log" || e.type === "email") log(`${e.type.toUpperCase()} (line ${e.line})`);
  },
});

/* ---------- control page replica ---------- */
function buildPanel() {
  const labels = ex.labels || {}, relays = ex.relays || {};
  const rows = [`<tr><td colspan="3" class="hd">X-300</td></tr>`,
    `<tr><td>Temp 1</td><td class="st val" id="pS1" colspan="2"></td></tr>`,
    `<tr><td>Relay 1</td><td class="st" id="pR1"></td><td><input type="button" value="ON" data-relay="1" data-v="1"><input type="button" value="OFF" data-relay="1" data-v="0"></td></tr>`];
  for (const n of [2, 3]) {
    const [name, on, off] = relays[n] || [`Relay ${n}`, "ON", "OFF"];
    rows.push(`<tr><td>${name}</td><td class="st" id="pR${n}" data-on="${on}" data-off="${off}"></td><td><input type="button" value="${on}" data-relay="${n}" data-v="1"><input type="button" value="${off}" data-relay="${n}" data-v="0"></td></tr>`);
  }
  for (let i = 0; i < 5; i++) {
    const fed = ex.feed && ex.feed.extvar === i;
    rows.push(`<tr><td>extvar${i}${labels[i] ? ` <small>${labels[i]}</small>` : ""}</td><td class="st val" colspan="2">` +
      (fed ? `<span id="pE${i}"></span>` : `<input type="number" step="0.1" id="pE${i}" aria-label="extvar${i}">`) + `</td></tr>`);
  }
  $("panel").innerHTML = rows.join("");
  $("panel").querySelectorAll("[data-relay]").forEach((b) => (b.onclick = () => {
    const i = +b.dataset.relay - 1, v = +b.dataset.v;
    if (m.relay[i] !== v) log(`relay${i + 1} ${v ? "ON" : "OFF"} (panel button)`);
    m.relay[i] = v;
  }));
  for (let i = 0; i < 5; i++) {
    const el = $(`pE${i}`);
    if (el.tagName === "INPUT") el.onchange = () => { m.ext[i] = +el.value; };
  }
  $("feedVar").textContent = ex.feed ? ex.feed.extvar : 4;
}

/* ---------- loading ---------- */
async function loadExample(id, srcOverride) {
  ex = examples.find((e) => e.id === id) || examples[0];
  $("sExample").value = ex.id;
  const text = srcOverride ?? await (await fetch(new URL(`examples/${ex.file}`, base))).text();
  $("src").value = text;
  m.relay = [0, 0, 0];
  m.ext = [0, 1, 2, 3, 4].map((i) => ex.ext?.[i] ?? 0);
  const w = ex.world || {};
  m.temps[0] = w.inside ?? 68;
  $("tOut").value = w.outside ?? 40;
  m.seconds = hm(w.time || "12:00");
  m.day = dayFromIso(w.date || "2026-01-14");
  $("cFeed").checked = !!ex.feed;
  history.length = 0;
  buildPanel();
  start();
}

function start() {
  const src = $("src").value;
  try {
    const p = check(src);
    $("bytes").textContent = `${p.bytes} / ${LIMITS.maxBytes} bytes`;
    $("status").dataset.warn = p.warnings.map((w) => `line ${w.line}: ${w.message}`).join("\n");
  } catch (e) { $("bytes").textContent = ""; $("status").dataset.warn = ""; }
  m.load(src);
  if ($("cFeed").checked) pushFeed();
  render();
}

function pushFeed() {
  const i = ex.feed ? ex.feed.extvar : 4;
  const marker = ex.feed ? ex.feed.marker : true;
  m.ext[i] = Math.round(+$("tOut").value * 10) / 10 - (marker ? (pushes++ % 2) * 0.05 : 0);
  nextFeed = m.seconds + (ex.feed?.everyMinutes ?? 10) * 60;
}

/* ---------- simulation loop ---------- */
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  let sim = speed * dt;
  while (sim > 0) {                               // 10-second chunks, same as the tests
    const step = Math.min(10, sim);
    sim -= step;
    const before = m.seconds;
    m.tick(step);
    if (m.seconds < before) nextFeed -= 86400;   // crossed midnight
    if ($("cFeed").checked && m.seconds >= nextFeed) pushFeed();
    if ($("cModel").checked) {
      const out = +$("tOut").value, t = m.temps[0];
      m.temps[0] = Math.min(ROOM.max, Math.max(ROOM.min,
        t + ((m.relay[0] ? ROOM.heatPerHour : 0) - ROOM.lossPerHourPerDegree * (t - out)) * (step / 3600)));
    }
    m.run(400);
    sinceSample += step;
    if (sinceSample >= 120) { sinceSample = 0; sample(); }
  }
  if (speed === 0) m.run(400);                    // paused clock: script still reacts to buttons
  render();
  requestAnimationFrame(frame);
}

function sample() {
  history.push({ t: m.day * 86400 + m.seconds, inside: m.temps[0], outside: +$("tOut").value, r1: m.relay[0] });
  const cutoff = history.at(-1).t - 86400;
  while (history.length && history[0].t < cutoff) history.shift();
}

/* ---------- rendering ---------- */
function paintRelay(n) {
  const el = $(`pR${n}`), on = m.relay[n - 1] === 1;
  el.textContent = on ? (el.dataset.on || "ON") : (el.dataset.off || "OFF");
  el.classList.toggle("on", on);
}
function render() {
  $("pS1").textContent = `${m.temps[0].toFixed(1)} °F`;
  [1, 2, 3].forEach(paintRelay);
  for (let i = 0; i < 5; i++) {
    const el = $(`pE${i}`);
    if (el.tagName === "INPUT") { if (document.activeElement !== el) el.value = +m.ext[i].toFixed(2); }
    else el.textContent = m.ext[i].toFixed(2);
  }
  $("devClock").textContent = `unit clock ${isoDate(m.day)} ${weekday(m.day)} ${clock(m.seconds)}`;
  if (document.activeElement !== $("sDate")) $("sDate").value = isoDate(m.day);
  $("oDow").textContent = weekday(m.day);
  if (document.activeElement !== $("tTime")) $("tTime").value = Math.floor(m.seconds);
  $("oTime").textContent = clock(m.seconds).slice(0, 5);
  $("oOut").textContent = (+$("tOut").value).toFixed(1) + "°";
  if (document.activeElement !== $("tIn")) $("tIn").value = m.temps[0].toFixed(1);
  $("oIn").textContent = m.temps[0].toFixed(1) + "°";
  const st = $("status"), warn = st.dataset.warn;
  st.textContent = m.state === "Error" ? `State: Error\n${m.error}` : `State: ${m.state}${warn ? "\nWarning: " + warn : ""}`;
  st.className = "status" + (m.state === "Error" ? " err" : warn ? " warn" : "");
  $("summary").innerHTML =
    `<span>Relay 1 <span class="pill ${m.relay[0] ? "warn" : "ok"}">${m.relay[0] ? "ON" : "OFF"}</span></span>` +
    `<span>Script <span class="pill ${m.state === "Running" ? "ok" : "bad"}">${m.state === "Running" ? "running" : m.state === "Error" ? "error" : "stopped"}</span></span>`;
  const w = [];
  "abcdefghij".split("").forEach((c) => w.push([c, m.v[c]]));
  m.timers.forEach((x, i) => w.push([`t${i}`, x]));
  m.ext.forEach((x, i) => w.push([`extvar${i}`, x]));
  m.relay.forEach((x, i) => w.push([`relay${i + 1}`, x]));
  w.push(["temp1", Math.round(m.temps[0] * 10) / 10], ["time", Math.floor(m.seconds)], ["date", m.day]);
  $("watch").innerHTML = w.map(([k, v]) => `<div><span>${k}</span><span>${+(+v).toFixed(2)}</span></div>`).join("");
  drawChart();
}

function drawChart() {
  const c = $("chart"), dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
  if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement);
  const col = (v) => css.getPropertyValue(v).trim();
  if (history.length < 2) {
    g.fillStyle = col("--mut"); g.font = "13px system-ui"; g.fillText("Run the clock to draw a history.", 12, H / 2);
    return;
  }
  const t1 = history.at(-1).t, t0 = t1 - 86400;
  const temps = history.flatMap((h) => [h.inside, h.outside]);
  const lo = Math.floor(Math.min(...temps) - 2), hi = Math.ceil(Math.max(...temps) + 2);
  const x = (t) => ((t - t0) / 86400) * W, y = (v) => H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 12);
  g.fillStyle = col("--warn"); g.globalAlpha = 0.25;
  for (let i = 1; i < history.length; i++) if (history[i - 1].r1) g.fillRect(x(history[i - 1].t), 0, x(history[i].t) - x(history[i - 1].t) + 0.5, H);
  g.globalAlpha = 1;
  const line = (key, color) => {
    g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
    history.forEach((h, i) => (i ? g.lineTo : g.moveTo).call(g, x(h.t), y(h[key])));
    g.stroke();
  };
  line("outside", col("--mut"));
  line("inside", col("--accent"));
  g.fillStyle = col("--mut"); g.font = "11px system-ui";
  g.fillText(`${hi}°`, 4, 12); g.fillText(`${lo}°`, 4, H - 8);
}

/* ---------- wiring ---------- */
for (const e of examples) $("sExample").add(new Option(e.title, e.id));
$("sExample").onchange = () => { history.length = 0; loadExample($("sExample").value); };
$("bRun").onclick = start;
$("tTime").oninput = (e) => { m.seconds = +e.target.value; nextFeed = Math.min(nextFeed, m.seconds + 600); };
$("sDate").onchange = (e) => { const d = dayFromIso(e.target.value); if (!isNaN(d)) m.day = d; };
$("tIn").oninput = (e) => { m.temps[0] = +e.target.value; };
$("cFeed").onchange = (e) => { if (e.target.checked) pushFeed(); };
$("bPower").onclick = () => {
  m.powerCycle({ keepExtvars: !$("cWipe").checked });
  if ($("cFeed").checked) nextFeed = m.seconds + 300;
};
document.querySelectorAll("[data-speed]").forEach((b) => (b.onclick = () => {
  speed = +b.dataset.speed;
  document.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
$("bShare").onclick = async () => {
  const bytes = new TextEncoder().encode($("src").value);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const url = `${location.origin}${location.pathname}?example=${encodeURIComponent(ex.id)}#s=${b64}`;
  try { await navigator.clipboard.writeText(url); $("bShare").textContent = "Link copied"; }
  catch { prompt("Copy this link:", url); }
  setTimeout(() => ($("bShare").textContent = "Copy share link"), 2000);
};

const params = new URLSearchParams(location.search);
const shared = location.hash.startsWith("#s=") ? location.hash.slice(3) : null;
let sharedSrc;
if (shared) {
  try {
    const bin = atob(shared.replace(/-/g, "+").replace(/_/g, "/"));
    sharedSrc = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
  } catch { sharedSrc = undefined; }
}
document.querySelector('[data-speed="60"]').click();
await loadExample(params.get("example") || examples[0].id, sharedSrc);
requestAnimationFrame(frame);

// The simulated world around the unit: a room that warms when relay 1 (the heat)
// is on and cools toward the outside temperature, an outdoor temperature curve,
// an optional feed that writes the outside temperature into an external variable
// (the way a Raspberry Pi or ESP32 would over HTTP), and power cuts.
//
// The room model is deliberately crude. It exists to make a thermostat script
// switch, not to predict a real building.

import { Machine, clock } from "./x300.js";

export const ROOM = { heatPerHour: 6, lossPerHourPerDegree: 0.08, min: 40, max: 90 };

// "hh:mm" -> seconds since midnight
export const hm = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 3600 + m * 60;
};

// Piecewise-linear curve through [["hh:mm", value], ...]
export function curve(points) {
  const pts = points.map(([t, v]) => [hm(t), v]).sort((a, b) => a[0] - b[0]);
  return (sec) => {
    if (sec <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [t1, v1] = pts[i], [t0, v0] = pts[i - 1];
      if (sec <= t1) return v0 + ((v1 - v0) * (sec - t0)) / (t1 - t0 || 1);
    }
    return pts.at(-1)[1];
  };
}

/**
 * Run a script through simulated time.
 * opts:
 *   src            script text
 *   start          "YYYY-MM-DD" (default 2026-01-14) and startTime "hh:mm" (default "00:00")
 *   hours          how long to run (default 24)
 *   indoor         starting room temperature (default 66)
 *   outdoor        [["hh:mm", °F], ...] curve (default flat 30)
 *   extvars        {0: 72, 2: 68, ...} initial external variables
 *   relays         {2: 1, ...} initial relay states (e.g. switches pressed on the panel)
 *   feed           {extvar: 4, everyMinutes: 10, dead: [["08:00","20:00"]], marker: true}
 *                  marker: alternate -0.05 so every push is a new value (scripts can detect a fresh push)
 *   powerCuts      ["13:00", ...]
 *   events         [["hh:mm", (machine) => {...}], ...] e.g. press a panel button
 *   stepSeconds    simulated seconds per tick (default 10)
 *   statementsPerTick  how many statements run per tick (default 400)
 * Returns { machine, samples: [{t, day, inside, outside, relays:[..]}], log: [...] }
 */
export function simulate(opts) {
  const log = [];
  const m = new Machine({ onEvent: (e) => log.push({ t: clock(m.seconds), ...e }) });
  const start = opts.start || "2026-01-14";
  m.day = Math.round(Date.parse(start) / 86400000);
  m.seconds = hm(opts.startTime || "00:00");
  m.temps[0] = opts.indoor ?? 66;
  for (const [k, v] of Object.entries(opts.extvars || {})) m.ext[+k] = v;
  for (const [k, v] of Object.entries(opts.relays || {})) m.relay[+k - 1] = v;
  const outside = curve(opts.outdoor || [["00:00", 30]]);
  const step = opts.stepSeconds ?? 10, per = opts.statementsPerTick ?? 400;
  const feed = opts.feed || null;
  const cuts = new Set((opts.powerCuts || []).map(hm));
  const events = (opts.events || []).map(([t, f]) => [hm(t), f]);
  let pushes = 0, nextFeed = m.seconds, elapsed = 0;
  const total = (opts.hours ?? 24) * 3600, samples = [];
  const feedDead = (sec) => (feed?.dead || []).some(([a, b]) => {
    const x = hm(a), y = hm(b);
    return x <= y ? sec >= x && sec < y : sec >= x || sec < y;
  });

  m.load(opts.src);
  while (elapsed < total) {
    const sec = Math.floor(m.seconds);
    const out = outside(sec);
    if (feed && sec >= nextFeed) {
      if (!feedDead(sec)) {
        m.ext[feed.extvar] = Math.round(out * 10) / 10 - (feed.marker ? (pushes++ % 2) * 0.05 : 0);
      }
      nextFeed = sec + (feed.everyMinutes ?? 10) * 60;
    }
    for (const c of cuts) if (sec >= c && sec < c + step) m.powerCycle();
    for (const [t, f] of events) if (sec >= t && sec < t + step) f(m);
    m.run(per);
    // room physics
    const t = m.temps[0];
    m.temps[0] = Math.min(ROOM.max, Math.max(ROOM.min,
      t + ((m.relay[0] ? ROOM.heatPerHour : 0) - ROOM.lossPerHourPerDegree * (t - out)) * (step / 3600)));
    samples.push({ t: clock(m.seconds), sec, day: m.day, inside: +m.temps[0].toFixed(2), outside: +out.toFixed(1), relays: [...m.relay] });
    m.tick(step);
    if (nextFeed >= 86400 && m.seconds < sec) nextFeed -= 86400;
    elapsed += step;
  }
  return { machine: m, samples, log };
}

// Fraction of samples in [from, to) ("hh:mm"; wraps midnight) where relay `r` was on.
export function dutyCycle(samples, from, to, r = 1) {
  const a = hm(from), b = hm(to === "24:00" ? "23:59" : to) + (to === "24:00" ? 60 : 0);
  const inWin = (s) => (a <= b ? s >= a && s < b : s >= a || s < b);
  const win = samples.filter((s) => inWin(s.sec));
  return win.length ? win.filter((s) => s.relays[r - 1]).length / win.length : 0;
}

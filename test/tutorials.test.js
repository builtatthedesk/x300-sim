// Every tutorial script: passes the static check, fits the unit, and does what its
// tutorial page says it does.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { check, Machine, LIMITS } from "../src/lib/x300.js";
import { simulate, dutyCycle, hm } from "../src/lib/world.js";

const dir = new URL("../src/examples/learn/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".bas"));
const src = (f) => readFileSync(new URL(f, dir), "utf8");
const at = (r, t) => r.samples.find((s) => s.sec >= hm(t));

test("every tutorial script passes the static check, with no warnings", () => {
  assert.ok(files.length >= 7);
  for (const f of files) {
    const p = check(src(f));
    assert.ok(p.bytes <= LIMITS.maxBytes, f);
    assert.deepEqual(p.warnings, [], f);
  }
});

test("01 schedule: on 07:00-19:00 only", () => {
  const r = simulate({ src: src("01-schedule.bas") });
  assert.equal(dutyCycle(r.samples, "07:01", "18:59"), 1);
  assert.equal(dutyCycle(r.samples, "19:01", "06:59"), 0);
});

test("02 thermostat: holds setpoint within the swing", () => {
  const r = simulate({ src: src("02-thermostat.bas"), extvars: { 0: 70, 1: 1 }, indoor: 60, outdoor: [["00:00", 20]] });
  const settled = r.samples.filter((s) => s.sec > 6 * 3600).map((s) => s.inside);
  assert.ok(Math.min(...settled) > 68.7 && Math.max(...settled) < 70.3, `${Math.min(...settled)}..${Math.max(...settled)}`);
});

test("02 thermostat: ignores an impossible reading", () => {
  const m = new Machine();
  m.temps[0] = -40;
  m.ext[0] = 70; m.ext[1] = 1;
  m.load(src("02-thermostat.bas"));
  m.run(2000);
  assert.equal(m.relay[0], 0);
});

test("03 day/night: night setpoint from 22:00 to 06:00", () => {
  const r = simulate({ src: src("03-day-night.bas"), extvars: { 0: 70, 1: 0.5, 2: 62 }, indoor: 70, outdoor: [["00:00", 20]] });
  assert.ok(Math.abs(at(r, "05:30").inside - 62) < 1);
  assert.ok(Math.abs(at(r, "15:00").inside - 70) < 1);
});

test("04 weekdays: occupied setpoint on Wednesday office hours, setback on Saturday", () => {
  const o = { extvars: { 0: 70, 1: 0.5, 2: 60 }, indoor: 60, outdoor: [["00:00", 20]] };
  const wed = simulate({ src: src("04-weekdays.bas"), start: "2026-01-14", ...o });
  const sat = simulate({ src: src("04-weekdays.bas"), start: "2026-01-17", ...o });
  assert.ok(Math.abs(at(wed, "15:00").inside - 70) < 1);
  assert.ok(Math.abs(at(sat, "15:00").inside - 60) < 1);
});

test("05 timers: the heat never comes back on within 5 minutes of going off", () => {
  const r = simulate({ src: src("05-timers.bas"), extvars: { 0: 70, 1: 0.2 }, indoor: 65, outdoor: [["00:00", 0]], stepSeconds: 5 });
  let offAt = null;
  for (let i = 1; i < r.samples.length; i++) {
    const [a, b] = [r.samples[i - 1].relays[0], r.samples[i].relays[0]];
    if (a === 1 && b === 0) offAt = r.samples[i].sec;
    if (a === 0 && b === 1 && offAt !== null) assert.ok(r.samples[i].sec - offAt >= 300, `back on after ${r.samples[i].sec - offAt}s`);
  }
});

test("06 outside feed: off while warm outside, thermostat again when the feed stops", () => {
  const o = { extvars: { 0: 70, 1: 0.5, 3: 55 }, indoor: 66, outdoor: [["00:00", 60]] };
  const live = simulate({ src: src("06-outside-feed.bas"), ...o, feed: { extvar: 4, marker: true } });
  assert.equal(dutyCycle(live.samples, "00:00", "24:00"), 0);
  const dead = simulate({ src: src("06-outside-feed.bas"), ...o, feed: { extvar: 4, marker: true, dead: [["06:00", "23:59"]] } });
  assert.equal(dutyCycle(dead.samples, "06:00", "06:45"), 0, "trusts the 05:50 reading for an hour");
  assert.ok(dutyCycle(dead.samples, "08:00", "23:00") > 0);
});

test("07 seasons: heat in January and October, none in July unless relay 2 is on", () => {
  const o = { extvars: { 0: 70, 1: 0.5 }, indoor: 62, outdoor: [["00:00", 40]] };
  for (const [day, want] of [["2026-01-14", true], ["2026-10-01", true], ["2026-05-31", true], ["2026-06-01", false], ["2026-09-30", false], ["2028-07-15", false]]) {
    const r = simulate({ src: src("07-seasons.bas"), start: day, hours: 2, ...o });
    assert.equal(dutyCycle(r.samples, "00:00", "02:00") > 0, want, day);
  }
  const r = simulate({ src: src("07-seasons.bas"), start: "2026-07-15", hours: 2, relays: { 2: 1 }, ...o });
  assert.ok(dutyCycle(r.samples, "00:00", "02:00") > 0);
});

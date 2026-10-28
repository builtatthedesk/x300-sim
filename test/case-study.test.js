// Behaviour of the four case-study scripts (src/examples/case-study) over simulated days.
// These double as the facts the case-study pages state, so a page can't drift from the code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { simulate, dutyCycle } from "../src/lib/world.js";

const script = (f) => readFileSync(new URL(`../src/examples/case-study/${f}.bas`, import.meta.url), "utf8");
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const inside = (r, from, to) => mean(r.samples.filter((s) => s.sec >= from * 3600 && s.sec < to * 3600).map((s) => s.inside));

// v1/v2 setpoints: extvar0 day, extvar1 swing, extvar2 night
const V1 = { 0: 72, 1: 0.5, 2: 68 };
// v3/v4 setpoints: extvar0 day, extvar1 weekday daytime, extvar2 night, extvar3 anticipation, extvar4 = outside (fed)
const V3 = { 0: 72, 1: 70, 2: 68, 3: 0.3 };
const FEED = { extvar: 4, everyMinutes: 10, marker: true };
const WEDNESDAY = "2026-01-14", SATURDAY = "2026-01-17", JULY = "2026-07-15";

test("v1 holds the day setpoint by day and the night setpoint at night", () => {
  const r = simulate({ src: script("v1-thermostat"), extvars: V1, outdoor: [["00:00", 25]], indoor: 70 });
  assert.equal(r.machine.state, "Running");
  assert.ok(Math.abs(inside(r, 10, 20) - 72) < 1, `day ${inside(r, 10, 20)}`);
  assert.ok(Math.abs(inside(r, 23.5, 24) - 68) < 1.2, `night ${inside(r, 23.5, 24)}`);
});

test("v3 uses the weekday temperature 08:00-16:00 Monday to Friday only", () => {
  const wd = simulate({ src: script("v3-outdoor"), start: WEDNESDAY, extvars: V3, outdoor: [["00:00", 25]], feed: FEED, indoor: 70 });
  const we = simulate({ src: script("v3-outdoor"), start: SATURDAY, extvars: V3, outdoor: [["00:00", 25]], feed: FEED, indoor: 70 });
  assert.ok(Math.abs(inside(wd, 10, 15.5) - 70) < 1, `weekday ${inside(wd, 10, 15.5)}`);
  assert.ok(Math.abs(inside(we, 10, 15.5) - 72) < 1, `weekend ${inside(we, 10, 15.5)}`);
});

test("v3 keeps the heat off by day when it is over 55 F outside", () => {
  const r = simulate({ src: script("v3-outdoor"), start: SATURDAY, extvars: V3, feed: FEED, indoor: 66,
    outdoor: [["00:00", 50], ["06:00", 58], ["20:00", 58], ["23:59", 50]] });
  assert.equal(dutyCycle(r.samples, "07:00", "21:00"), 0);
  assert.ok(dutyCycle(r.samples, "22:30", "24:00") > 0, "night still heats");
});

test("v3 falls back to a plain thermostat when the outdoor feed goes quiet for an hour", () => {
  const r = simulate({ src: script("v3-outdoor"), start: SATURDAY, extvars: V3, indoor: 66,
    feed: { ...FEED, dead: [["08:00", "20:00"]] }, outdoor: [["00:00", 58]] });
  assert.equal(dutyCycle(r.samples, "08:00", "08:50"), 0, "still trusts the last reading for the first hour");
  assert.ok(dutyCycle(r.samples, "10:00", "19:00") > 0, "then heats by thermostat");
});

test("v4 behaves like v3 in season", () => {
  const opts = { start: SATURDAY, extvars: V3, feed: FEED, indoor: 66, outdoor: [["00:00", 50], ["06:00", 58], ["20:00", 58], ["23:59", 50]] };
  const a = simulate({ src: script("v3-outdoor"), ...opts }), b = simulate({ src: script("v4-season"), ...opts });
  assert.deepEqual(b.samples.map((s) => s.relays[0]), a.samples.map((s) => s.relays[0]));
});

test("v4 keeps the heat off June to September unless Season ON (relay 2) is on", () => {
  const cold = { start: JULY, extvars: V3, feed: FEED, indoor: 62, outdoor: [["00:00", 50]] };
  assert.equal(dutyCycle(simulate({ src: script("v4-season"), ...cold }).samples, "00:00", "24:00"), 0);
  const on = simulate({ src: script("v4-season"), ...cold, relays: { 2: 1 } });
  assert.ok(dutyCycle(on.samples, "00:00", "24:00") > 0);
});

test("v4 Test heat (relay 3) forces the heat on for at most 30 minutes", () => {
  const r = simulate({ src: script("v4-season"), start: SATURDAY, extvars: V3, feed: FEED, indoor: 70,
    outdoor: [["00:00", 62]], events: [["12:00", (m) => (m.relay[2] = 1)]] });
  assert.equal(dutyCycle(r.samples, "11:00", "12:00"), 0);
  assert.equal(dutyCycle(r.samples, "12:01", "12:29"), 1);
  assert.equal(dutyCycle(r.samples, "12:31", "14:00"), 0);
  assert.equal(r.samples.find((s) => s.t === "12:40:00").relays[2], 0, "relay 3 releases itself");
});

test("v4 Test heat also stops above 80 F", () => {
  const r = simulate({ src: script("v4-season"), start: SATURDAY, startTime: "11:55", hours: 1, extvars: V3, feed: FEED,
    indoor: 79.5, outdoor: [["00:00", 62]], events: [["12:00", (m) => (m.relay[2] = 1)]] });
  const stop = r.samples.find((s) => s.sec > 12 * 3600 + 60 && s.relays[2] === 0);
  assert.ok(stop && stop.sec < 12.5 * 3600, "relay 3 released before the 30-minute limit");
  assert.ok(stop.inside >= 80, `because the room reached 80 F (${stop.inside})`);
  assert.ok(r.samples.filter((s) => s.sec > stop.sec).every((s) => s.relays[2] === 0), "and stays released");
});

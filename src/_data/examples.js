// One entry per example script. The playground loads these (via /examples.json),
// the tutorial pages link to them, and the tests exercise the same .bas files.
//   ext:    initial external variables          labels: what each one means (shown on the panel)
//   relays: names for relays 2/3 when the example uses them as panel switches
//   feed:   outside-temperature sender to simulate {extvar, everyMinutes, marker}
//   world:  starting date / time / temperatures
export default [
  {
    id: "learn/01-schedule", title: "1. A time schedule", file: "learn/01-schedule.bas",
    ext: {}, labels: {}, world: { outside: 40, inside: 68, time: "06:30" },
  },
  {
    id: "learn/02-thermostat", title: "2. A thermostat", file: "learn/02-thermostat.bas",
    ext: { 0: 70, 1: 1 }, labels: { 0: "setpoint", 1: "swing" }, world: { outside: 25, inside: 66 },
  },
  {
    id: "learn/03-day-night", title: "3. Day and night", file: "learn/03-day-night.bas",
    ext: { 0: 70, 1: 0.5, 2: 62 }, labels: { 0: "day setpoint", 1: "swing", 2: "night setpoint" },
    world: { outside: 25, inside: 68, time: "21:00" },
  },
  {
    id: "learn/04-weekdays", title: "4. Weekdays", file: "learn/04-weekdays.bas",
    ext: { 0: 70, 1: 0.5, 2: 60 }, labels: { 0: "occupied", 1: "swing", 2: "setback" },
    world: { outside: 25, inside: 64, time: "07:30", date: "2026-01-16" },
  },
  {
    id: "learn/05-timers", title: "5. Timers", file: "learn/05-timers.bas",
    ext: { 0: 70, 1: 0.2 }, labels: { 0: "setpoint", 1: "swing" }, world: { outside: 5, inside: 69 },
  },
  {
    id: "learn/06-outside-feed", title: "6. Data from outside", file: "learn/06-outside-feed.bas",
    ext: { 0: 70, 1: 0.5, 3: 55 }, labels: { 0: "setpoint", 1: "swing", 3: "outside cut-off", 4: "outside (fed)" },
    feed: { extvar: 4, everyMinutes: 10, marker: true }, world: { outside: 58, inside: 67 },
  },
  {
    id: "learn/07-seasons", title: "7. Seasons", file: "learn/07-seasons.bas",
    ext: { 0: 70, 1: 0.5 }, labels: { 0: "setpoint", 1: "swing" }, relays: { 2: ["Season override", "ON", "AUTO"] },
    world: { outside: 50, inside: 64, date: "2026-07-15" },
  },
  {
    id: "case-study/v1", title: "Case study v1: thermostat", file: "case-study/v1-thermostat.bas",
    ext: { 0: 72, 1: 0.5, 2: 68 }, labels: { 0: "day temp", 1: "swing", 2: "night temp" },
    world: { outside: 30, inside: 70 },
  },
  {
    id: "case-study/v2", title: "Case study v2: weekday temperature", file: "case-study/v2-weekday.bas",
    ext: { 0: 72, 1: 70, 2: 68, 3: 0.3 }, labels: { 0: "day temp", 1: "weekday temp", 2: "night temp", 3: "anticipation" },
    world: { outside: 30, inside: 70, date: "2026-01-14" },
  },
  {
    id: "case-study/v3", title: "Case study v3: outside temperature", file: "case-study/v3-outdoor.bas",
    ext: { 0: 72, 1: 70, 2: 68, 3: 0.3 }, labels: { 0: "day temp", 1: "weekday temp", 2: "night temp", 3: "anticipation", 4: "outside (fed)" },
    feed: { extvar: 4, everyMinutes: 10, marker: true }, world: { outside: 58, inside: 70, date: "2026-01-17" },
  },
  {
    id: "case-study/v4", title: "Case study v4: season and test button", file: "case-study/v4-season.bas",
    ext: { 0: 72, 1: 70, 2: 68, 3: 0.3 }, labels: { 0: "day temp", 1: "weekday temp", 2: "night temp", 3: "anticipation", 4: "outside (fed)" },
    relays: { 2: ["Season ON", "ON", "AUTO"], 3: ["Test heat", "START", "STOP"] },
    feed: { extvar: 4, everyMinutes: 10, marker: true }, world: { outside: 58, inside: 70, date: "2026-07-15" },
  },
];

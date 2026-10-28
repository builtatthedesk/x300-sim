// Language-level tests: parsing, static checks, statements, variables.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Machine, check, BasicError, byteCount, weekday, LIMITS } from "../src/lib/x300.js";

const run = (src, setup = () => {}, max = 10000) => {
  const m = new Machine();
  setup(m);
  assert.ok(m.load(src), m.error);
  m.run(max);
  return m;
};
const rejects = (src, re) => assert.throws(() => check(src), (e) => e instanceof BasicError && re.test(e.message));

test("arithmetic: one operation per line", () => {
  const m = run("let a = 2 + 3\nlet b = a - 10\nlet c = 17 % 5\nlet d = -3\nend");
  assert.deepEqual([m.v.a, m.v.b, m.v.c, m.v.d], [5, -5, 2, -3]);
  rejects("let a = 1 + 2 + 3\nend", /one operation per line/);
  rejects("let a = ( 1 + 2 )\nend", /one operation|parentheses/);
});

test("* and / run but are flagged as unverified on the X-300", () => {
  const p = check("let a = 6 * 7\nlet b = a / 2\nend");
  assert.equal(p.warnings.length, 2);
  assert.equal(run("let a = 6 * 7\nend").v.a, 42);
  assert.equal(check("let a = 7 % 2\nend").warnings.length, 0);
});

test("IF / ELSE / END IF picks one branch", () => {
  const m = run("let a = 5\nif a > 3 then\nlet b = 1\nelse\nlet b = 2\nend if\nend");
  assert.equal(m.v.b, 1);
  const n = run("let a = 1\nif a > 3 then\nlet b = 1\nelse\nlet b = 2\nend if\nend");
  assert.equal(n.v.b, 2);
});

test("DO WHILE / LOOP and FOR / NEXT", () => {
  const m = run("let a = 0\ndo while a < 5\nlet a = a + 1\nloop\nlet c = 0\nfor b = 1 to 4\nlet c = c + b\nnext\nend");
  assert.equal(m.v.a, 5);
  assert.equal(m.v.c, 10);
});

test("SUB / CALL returns to the line after CALL", () => {
  const m = run("let a = 1\ncall bump\ncall bump\nend\nsub bump\nlet a = a * 10\nend sub");
  assert.equal(m.v.a, 100);
});

test("keywords and predefined names are case-insensitive; user variables are lower case", () => {
  const m = run("Let Relay1 = 1\nLET a = 2\nend");
  assert.equal(m.relay[0], 1);
  rejects("let A = 1\nend", /unknown variable 'A'/);
});

test("relay values: 0 off, 1 on, 5 toggles", () => {
  const m = run("let relay2 = 1\nlet relay3 = 5\nlet relay3 = 5\nlet relay3 = 5\nend");
  assert.deepEqual(m.relay, [0, 1, 1]);
  const bad = new Machine();
  bad.load("let relay1 = 3\nend");
  bad.run();
  assert.equal(bad.state, "Error");
});

test("comments and REM lines are ignored", () => {
  const m = run("rem setup\nlet a = 1 ' trailing comment\n' whole-line comment\nend");
  assert.equal(m.v.a, 1);
});

test("time literals hh:mm:ss are seconds since midnight", () => {
  const m = run("let a = 03:30:00\nend");
  assert.equal(m.v.a, 12600);
});

test("timers count down in tenths of a second and stop at zero", () => {
  const m = run("let t1 = 50\nend");
  m.tick(3);
  assert.equal(m.timers[1], 20);
  m.tick(10);
  assert.equal(m.timers[1], 0);
});

test("date is days since 1970-01-01; (date + 3) % 7 is 0 on Mondays", () => {
  const m = run("let a = date + 3\nlet b = a % 7\nend", (m) => (m.day = Math.round(Date.parse("2026-10-19") / 864e5)));
  assert.equal(weekday(m.day), "Mon");
  assert.equal(m.v.b, 0);
});

test("static check: missing spaces around operators", () => {
  rejects("let a = 1+2\nend", /missing spaces/);
  rejects("if a>1 then\nend if\nend", /missing spaces/);
});

test("static check: structure errors", () => {
  rejects("let a = 1", /no END/);
  rejects("do\nlet a = 1\nend", /never closed/);
  rejects("loop\nend", /LOOP without DO/);
  rejects("else\nend", /ELSE without IF/);
  rejects("goto 10\nend", /unknown statement/);
});

test("static check: nesting limit", () => {
  const deep = (n) => "let a = 1\n" + "if a = 1 then\n".repeat(n) + "let b = 1\n" + "end if\n".repeat(n) + "end";
  assert.doesNotThrow(() => check(deep(LIMITS.maxNest)));
  assert.equal(check(deep(LIMITS.maxNest)).warnings.length, 0);
  assert.match(check(deep(LIMITS.maxNest + 1)).warnings[0].message, /nesting depth 6/);
});

test("static check: size limit counts CR LF line endings", () => {
  assert.equal(byteCount("ab\ncd"), 6);
  const big = "let a = 1\n".repeat(200) + "end";
  rejects(big, /bytes, more than/);
});

test("static check: a condition is one variable, a comparison, an expression", () => {
  rejects("if a + 1 > 2 then\nend if\nend", /bad condition/);
  assert.doesNotThrow(() => check("if a > b + 1 then\nend if\nend"));
});

test("runtime error stops the script with a line number", () => {
  const m = new Machine();
  m.load("let a = 0\nlet b = 5 / a\nend");
  m.run();
  assert.equal(m.state, "Error");
  assert.match(m.error, /line 2: divide by zero/);
});

test("power cycle drops relays, resets user variables, restarts the script", () => {
  const m = run("let a = 7\nlet relay1 = 1\ndo while a = 7\nloop\nend", () => {}, 50);
  m.ext[0] = 72;
  m.powerCycle();
  assert.equal(m.relay[0], 0);
  assert.equal(m.v.a, 0);
  assert.equal(m.ext[0], 72, "external variables kept by default");
  assert.equal(m.state, "Running");
  m.powerCycle({ keepExtvars: false });
  assert.equal(m.ext[0], 0);
});

test("date literals mm/dd/yyyy compare against date", () => {
  const m = run("if date = 01/01/2027 then\nlet a = 1\nend if\nend", (m) => (m.day = Math.round(Date.UTC(2027, 0, 1) / 864e5)));
  assert.equal(m.v.a, 1);
});

test("event variables: et past midnight rolls into ed", () => {
  const m = run("let ed1 = 01/01/2027\nlet et1 = 23:30:00\nlet et1 = et1 + 3600\nend");
  assert.equal(m.et[0], 1800);
  assert.equal(m.ed[0], Math.round(Date.UTC(2027, 0, 2) / 864e5));
});

test("remote relays can be set but not read; time, date and temps are read-only", () => {
  assert.match(run("let rmt_relay1 = 1\nend").state, /reached END/);
  const m = new Machine();
  m.load("let a = rmt_relay1\nend");
  m.run();
  assert.match(m.error, /can be set but not read/);
  const n = new Machine();
  n.load("let time = 5\nend");
  n.run();
  assert.match(n.error, /can't be set/);
});

test("PRINT is rejected (it only works in the vendor's PC checker)", () => {
  rejects("print a\nend", /PC checker/);
});

test("subroutines: after END, case-sensitive names, 20 characters max", () => {
  rejects("sub early\nend sub\nend", /after END/);
  rejects("call Bump\nend\nsub bump\nend sub", /no SUB Bump/);
  rejects("end\nsub abcdefghijklmnopqrstu\nend sub", /20 characters/);
});

test("EMAIL and LOG forms", () => {
  assert.doesNotThrow(() => check("email\nemail relay1\nlog\nend"));
  rejects("email someone\nend", /EMAIL takes/);
  rejects("log a\nend", /LOG takes nothing/);
});

test("review fixes: lone keywords, one ELSE, NEXT variable, FOR form, writable targets", () => {
  rejects("let a = 1\nif a = 1 then\nelse let b = 2\nend if\nend", /by itself/);
  rejects("if a = 1 then\nelse\nelse\nend if\nend", /one ELSE/);
  rejects("do\nloop until a\nend", /by itself/);
  rejects("for a = 1 to 3\nnext b\nend", /does not match/);
  assert.doesNotThrow(() => check("for a = 1 to 3\nnext a\nend"));
  rejects("for a 1 to 3\nnext\nend", /FOR needs/);
  rejects("for a = 1 3\nnext\nend", /FOR needs/);
  rejects("let temp1 = 5\nend", /can't be set/);
  rejects("for time = 1 to 3\nnext\nend", /can't be set/);
  rejects("call toString\nend", /no SUB/);
  rejects("end\nsub s\nend sub\nsub s\nend sub", /defined twice/);
  rejects("end foo", /not a statement/);
});

test("review fixes: IF without THEN warns; bare DO WHILE loops forever", () => {
  const p = check("let a = 1\nif a = 1\nlet b = 2\nend if\nend");
  assert.match(p.warnings[0].message, /without THEN/);
  assert.equal(run("let a = 1\nif a = 1\nlet b = 2\nend if\nend").v.b, 2);
  const m = run("do while\nlet a = a + 1\nloop\nend", () => {}, 30);
  assert.ok(m.v.a > 5 && m.state === "Running");
});

test("review fixes: timers count down at small time steps; pulse turns the relay off", () => {
  const m = run("let t0 = 10\nend");
  for (let i = 0; i < 60; i++) m.tick(1 / 60);
  assert.equal(m.timers[0], 0);
  const p = run("let relay1 = 2\nend");
  assert.equal(p.relay[0], 1);
  p.tick(1.5);
  assert.equal(p.relay[0], 0);
});

test("review fixes: runaway recursion stops with an error", () => {
  const m = new Machine();
  m.load("call s\nend\nsub s\ncall s\nend sub");
  m.run();
  assert.match(m.error, /CALL nested/);
});

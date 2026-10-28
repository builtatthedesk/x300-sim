// Unofficial simulator of the ControlByWeb X-300 BASIC script interpreter.
// Not affiliated with or endorsed by ControlByWeb / Xytronix Research & Design.
//
// Pure module: no DOM, no timers. The playground, the tutorials and the test
// suite all drive the same Machine, so a tutorial example that passes the tests
// behaves the same way in the browser.
//
// Dialect: X-300 Users Manual v1.8, Appendix G "BASIC Scripts" (described, not copied).
// Where the manual is silent the choice made here is marked ASSUMPTION; where real
// units were observed to accept something the manual does not mention, OBSERVED.

export const LIMITS = { maxBytes: 1900, maxNest: 5 };
export const COMPARE = ["=", "<", ">", "<=", ">=", "<>"];
const PREDEF = /^(relay[1-3]|rmt_relay[1-3]|temp[1-8]|extvar[0-4]|t[0-5]|ed[1-5]|et[1-5]|time|date)$/i;
// Arithmetic: the manual documents + and -. OBSERVED: % runs on real X-300s.
// * and / are documented for the 400 series only, so check() warns about them.
export const ARITH = ["+", "-", "*", "/", "%"];
export const UNVERIFIED_OPS = ["*", "/"];
const USER = /^[a-j]$/;                       // user variables: a-j, lower case only
const STATEMENTS = ["let", "if", "else", "end", "do", "loop", "for", "next", "call", "sub", "log", "email"];

export class BasicError extends Error {
  constructor(message, line = null) {
    super(line ? `line ${line}: ${message}` : message);
    this.line = line;
  }
}

/* ---------------------------------------------------------------- parse */

// One statement per line; ' starts a comment; REM lines are ignored.
export function parse(src) {
  const lines = [];
  src.replace(/\r/g, "").split("\n").forEach((raw, i) => {
    const code = raw.split("'")[0].trim();
    if (!code || /^rem\b/i.test(code)) return;
    lines.push({ n: i + 1, code, tk: code.split(/\s+/) });
  });
  return lines;
}

// Match block statements into a jump table and enforce the nesting limit.
function link(lines) {
  const jump = {}, stack = [], subs = {};
  let endAt = null;
  lines.forEach((L, i) => {
    const k = L.tk[0].toLowerCase(), k2 = (L.tk[1] || "").toLowerCase();
    const err = (m) => { throw new BasicError(m, L.n); };
    if (k === "if") {
      if (L.tk.at(-1).toLowerCase() !== "then") err("IF needs THEN at the end of the line");
      stack.push({ k: "if", i, els: [] });
    } else if (k === "else") {
      if (stack.at(-1)?.k !== "if") err("ELSE without IF");
      stack.at(-1).els.push(i);
    } else if (k === "end" && k2 === "if") {
      if (stack.at(-1)?.k !== "if") err("END IF without IF");
      const s = stack.pop();
      jump[s.i] = s.els.length ? s.els[0] : i;    // false -> ELSE (or END IF)
      s.els.forEach((e) => (jump[e] = i));        // true branch reaching ELSE -> END IF
    } else if (k === "do") {
      stack.push({ k: "do", i });
    } else if (k === "loop") {
      if (stack.at(-1)?.k !== "do") err("LOOP without DO");
      const s = stack.pop();
      jump[s.i] = i;                              // DO WHILE false -> past LOOP
      jump[i] = s.i;                              // LOOP -> back to DO
    } else if (k === "for") {
      stack.push({ k: "for", i });
    } else if (k === "next") {
      if (stack.at(-1)?.k !== "for") err("NEXT without FOR");
      const s = stack.pop();
      jump[s.i] = i;
      jump[i] = s.i;
    } else if (k === "sub") {
      if (!L.tk[1]) err("SUB needs a name");
      if (L.tk[1].length > 20) err("SUB names are at most 20 characters");
      if (endAt === null) err("subroutines go after END");
      subs[L.tk[1]] = i;                          // names are case-sensitive
      stack.push({ k: "sub", i });
    } else if (k === "end" && k2 === "sub") {
      if (stack.at(-1)?.k !== "sub") err("END SUB without SUB");
      stack.pop();
    } else if (k === "end" && !k2) {
      if (endAt === null) endAt = i;
    }
    const depth = stack.filter((s) => s.k !== "sub").length;
    if (depth > LIMITS.maxNest) err(`nesting depth ${depth} is more than ${LIMITS.maxNest}`);
  });
  if (stack.length) {
    const s = stack.at(-1);
    throw new BasicError(`${s.k.toUpperCase()} is never closed`, lines[s.i].n);
  }
  if (endAt === null) throw new BasicError("no END statement");
  return { jump, subs };
}

// Bytes as the unit counts them: lines end in CR LF.
export function byteCount(src) {
  return new TextEncoder().encode(src.replace(/\r?\n/g, "\r\n")).length;
}

/* ---------------------------------------------------------------- machine */

export class Machine {
  constructor(opts = {}) {
    this.onEvent = opts.onEvent || (() => {});   // ({type, ...}) for logs / UI
    this.v = {};
    this.ext = [0, 0, 0, 0, 0];
    this.timers = [0, 0, 0, 0, 0, 0];             // tenths of a second, count down to 0
    this.relay = [0, 0, 0];
    this.temps = [70, null, null, null, null, null, null, null];   // null = no sensor
    this.seconds = 12 * 3600;                     // time of day
    this.day = 20745;                             // days since 1970-01-01 (2026-10-19, a Monday)
    this.prog = null;
    this.state = "Stopped";
    this.error = "";
    this.ed = [0, 0, 0, 0, 0];
    this.et = [0, 0, 0, 0, 0];
    this.resetVars();
  }

  resetVars() {
    "abcdefghij".split("").forEach((c) => (this.v[c] = 0));
    this.timers = [0, 0, 0, 0, 0, 0];
  }

  /* --- variables --- */
  read(name, L) {
    if (USER.test(name)) return this.v[name];
    if (/^-?\d+(\.\d+)?$/.test(name)) return parseFloat(name);
    if (/^\d\d:\d\d:\d\d$/.test(name)) {
      const [h, m, s] = name.split(":").map(Number);
      return h * 3600 + m * 60 + s;
    }
    if (/^\d\d\/\d\d\/\d{4}$/.test(name)) {         // mm/dd/yyyy -> days since 1970
      const [mo, d, y] = name.split("/").map(Number);
      return Math.round(Date.UTC(y, mo - 1, d) / 86400000);
    }
    const low = name.toLowerCase();
    if (!PREDEF.test(low)) throw new BasicError(`unknown variable or value '${name}'`, L?.n);
    if (low.startsWith("relay")) return this.relay[+low.at(-1) - 1];
    if (low.startsWith("rmt_relay")) throw new BasicError(`${name} can be set but not read`, L?.n);
    if (/^ed[1-5]$/.test(low)) return this.ed[+low[2] - 1];
    if (/^et[1-5]$/.test(low)) return this.et[+low[2] - 1];
    if (low.startsWith("temp")) {
      const t = this.temps[+low.slice(4) - 1];
      return t === null ? 0 : Math.round(t * 10) / 10;   // ASSUMPTION: missing sensor reads 0
    }
    if (low.startsWith("extvar")) return this.ext[+low.at(-1)];
    if (/^t[0-5]$/.test(low)) return this.timers[+low[1]];
    if (low === "time") return Math.floor(this.seconds) % 86400;
    if (low === "date") return this.day;
    return 0;
  }

  write(name, val, L) {
    const low = name.toLowerCase();
    if (USER.test(name)) { this.v[name] = val; return; }
    if (/^relay[1-3]$/.test(low)) {
      const i = +low.at(-1) - 1, iv = Math.trunc(val);
      const nv = iv === 5 ? this.relay[i] ^ 1 : iv === 2 ? 1 : iv;   // ASSUMPTION: 2 (pulse) = on, 5 = toggle
      if (nv !== 0 && nv !== 1) throw new BasicError(`relay value ${val} must be 0, 1, 2 or 5`, L?.n);
      if (nv !== this.relay[i]) this.onEvent({ type: "relay", relay: i + 1, value: nv, line: L?.n, code: L?.code });
      this.relay[i] = nv;
      return;
    }
    if (/^extvar[0-4]$/.test(low)) { this.ext[+low.at(-1)] = val; return; }
    if (/^t[0-5]$/.test(low)) {
      if (val < 0) throw new BasicError("timer set negative", L?.n);
      this.timers[+low[1]] = Math.trunc(val);
      return;
    }
    if (/^rmt_relay[1-3]$/.test(low)) return;
    if (/^ed[1-5]$/.test(low)) { this.ed[+low[2] - 1] = Math.trunc(val); return; }
    if (/^et[1-5]$/.test(low)) {                  // past midnight rolls into the paired ed
      const i = +low[2] - 1;
      let v = Math.trunc(val);
      while (v >= 86400) { v -= 86400; this.ed[i]++; }
      this.et[i] = v;
      return;
    }
    if (low === "time" || low === "date" || /^temp[1-8]$/.test(low)) throw new BasicError(`${name} is read-only`, L?.n);
    throw new BasicError(`cannot assign to '${name}'`, L?.n);
  }

  /* --- expressions --- */
  // An expression is one value, or two values and one operator: X-300 scripts do
  // one operation per line (no parentheses, no chains).
  expr(tk, L) {
    if (tk.length === 1) return this.read(tk[0], L);
    if (tk.length === 3 && ARITH.includes(tk[1])) {
      const a = this.read(tk[0], L), b = this.read(tk[2], L), op = tk[1];
      if ((op === "/" || op === "%") && b === 0) throw new BasicError("divide by zero", L.n);
      return op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? a / b : a % b;
    }
    if (tk.length === 0) throw new BasicError(`missing value: ${L.code}`, L.n);
    if (tk.includes("(") || tk.includes(")")) throw new BasicError("no parentheses: one operation per line", L.n);
    throw new BasicError(`one operation per line (split it with a variable): ${L.code}`, L.n);
  }

  // A condition is one variable or value, a comparison, then an expression.
  cond(tk, L) {
    if (tk.length < 3 || !COMPARE.includes(tk[1]))
      throw new BasicError(`bad condition (one variable, then a comparison): ${L.code}`, L.n);
    const l = this.read(tk[0], L), r = this.expr(tk.slice(2), L);
    return { "=": l === r, "<": l < r, ">": l > r, "<=": l <= r, ">=": l >= r, "<>": l !== r }[tk[1]];
  }

  /* --- program --- */
  load(src) {
    try {
      this.prog = check(src);
      this.pc = 0;
      this.calls = [];
      this.fors = {};
      this.resetVars();
      this.state = "Running";
      this.error = "";
      this.onEvent({ type: "start" });
    } catch (e) {
      if (!(e instanceof BasicError)) throw e;
      this.prog = null;
      this.state = "Error";
      this.error = e.message;
      this.onEvent({ type: "error", message: e.message });
    }
    return this.state === "Running";
  }

  // Execute one statement. Returns false when the script stops.
  step() {
    const P = this.prog, i = this.pc, L = P.lines[i];
    if (!L) throw new BasicError("ran off the end of the script (missing END?)");
    const k = L.tk[0].toLowerCase(), k2 = (L.tk[1] || "").toLowerCase();
    let nxt = i + 1;
    if (k === "let") this.write(L.tk[1], this.expr(L.tk.slice(3), L), L);
    else if (k === "if") { if (!this.cond(L.tk.slice(1, -1), L)) nxt = P.jump[i] + 1; }
    else if (k === "else") nxt = P.jump[i] + 1;
    else if (k === "end" && k2 === "if") {}
    else if (k === "do") { if (k2 === "while" && !this.cond(L.tk.slice(2), L)) nxt = P.jump[i] + 1; }
    else if (k === "loop") nxt = P.jump[i];
    else if (k === "for") {
      const v = L.tk[1], to = L.tk.findIndex((t) => t.toLowerCase() === "to");
      if (!(i in this.fors)) {
        this.write(v, this.expr(L.tk.slice(3, to), L), L);
        this.fors[i] = this.expr(L.tk.slice(to + 1), L);
      }
      if (this.read(v, L) > this.fors[i]) { delete this.fors[i]; nxt = P.jump[i] + 1; }
    } else if (k === "next") {
      const s = P.jump[i], v = P.lines[s].tk[1];
      this.write(v, this.read(v, L) + 1, L);
      nxt = s;
    } else if (k === "call") {
      const name = L.tk[1] || "";
      if (!(name in P.subs)) throw new BasicError(`no SUB ${L.tk[1]}`, L.n);
      this.calls.push(i + 1);
      nxt = P.subs[name] + 1;
    } else if (k === "end" && k2 === "sub") nxt = this.calls.pop();
    else if (k === "sub") throw new BasicError(`ran into SUB ${L.tk[1]} (put END before the subroutines)`, L.n);
    else if (k === "end") { this.state = "Stopped (reached END)"; return false; }
    else if (k === "log" || k === "email") this.onEvent({ type: k, line: L.n, code: L.code });
    this.pc = nxt;
    return true;
  }

  // Run up to `max` statements; errors stop the script like the unit does.
  run(max = 4000) {
    if (!this.prog || this.state !== "Running") return 0;
    let n = 0;
    try {
      for (; n < max; n++) if (!this.step()) break;
    } catch (e) {
      if (!(e instanceof BasicError)) throw e;
      this.state = "Error";
      this.error = e.message;
      this.onEvent({ type: "error", message: e.message });
    }
    return n;
  }

  // Advance the clock; timers count down in tenths of a second.
  tick(dtSeconds) {
    this.seconds += dtSeconds;
    while (this.seconds >= 86400) { this.seconds -= 86400; this.day++; }
    const ticks = Math.floor(dtSeconds * 10);
    this.timers = this.timers.map((x) => Math.max(0, x - ticks));
  }

  // Power cut: relays drop, user variables and timers reset, the script restarts.
  // ASSUMPTION: the manual does not say whether external variables survive; by
  // default they are kept (the unit's setup page gives them values).
  powerCycle({ keepExtvars = true } = {}) {
    this.relay = [0, 0, 0];
    if (!keepExtvars) this.ext = [0, 0, 0, 0, 0];
    this.onEvent({ type: "power" });
    if (this.prog) this.load(this.prog.src);
  }
}

/* ---------------------------------------------------------------- static check */

// Everything the unit would reject before running: size, structure, spacing,
// unknown names. Throws BasicError; returns the linked program.
export function check(src) {
  const bytes = byteCount(src);
  if (bytes > LIMITS.maxBytes)
    throw new BasicError(`script is ${bytes} bytes, more than ${LIMITS.maxBytes}: the unit cuts it off, which usually shows up as MISSING END OF LINE`);
  const lines = parse(src);
  const ln = link(lines);
  const dry = new Machine();
  const warnings = [];
  for (const L of lines) {
    for (const t of L.tk) {
      if (/[=<>+\-*/%]/.test(t) && !/^(<=|>=|<>|[=<>+*\/%-]|-?[\d.]+|\d\d:\d\d:\d\d|\d\d\/\d\d\/\d{4})$/.test(t))
        throw new BasicError(`missing spaces around the operator in '${t}'`, L.n);
    }
    const k = L.tk[0].toLowerCase();
    if (k === "print") throw new BasicError("PRINT works only in the vendor's PC checker, not on the unit", L.n);
    if (!STATEMENTS.includes(k)) throw new BasicError(`unknown statement '${L.tk[0]}'`, L.n);
    if (k === "email" && L.tk.length > 1 && !(L.tk.length === 2 && /^(relay[1-3]|temp[1-8]|input\d)$/i.test(L.tk[1])))
      throw new BasicError("EMAIL takes nothing, or one of relayN / tempN / inputN", L.n);
    if (k === "log" && L.tk.length > 1) throw new BasicError("LOG takes nothing", L.n);
    if (k === "call" && !(L.tk[1] in ln.subs)) throw new BasicError(`no SUB ${L.tk[1] ?? ""} (names are case-sensitive)`, L.n);
    if (["let", "if", "do", "for"].includes(k))
      for (const t of L.tk) if (UNVERIFIED_OPS.includes(t))
        warnings.push({ line: L.n, message: `'${t}' is documented for the 400 series, not the X-300: test it on a unit` });
    if (["let", "if", "for", "do"].includes(k)) {
      for (const t of L.tk.slice(1)) {
        if (/^[A-Za-z_]\w*$/.test(t) && !["then", "to", "while"].includes(t.toLowerCase())
            && !PREDEF.test(t) && !USER.test(t))
          throw new BasicError(`unknown variable '${t}' (your own variables are a to j, lower case)`, L.n);
      }
    }
    try {
      if (k === "let") {
        if (L.tk.length < 4 || L.tk[2] !== "=") throw new BasicError("LET needs 'LET var = value'", L.n);
        dry.expr(L.tk.slice(3), L);
      } else if (k === "if") dry.cond(L.tk.slice(1, -1), L);
      else if (k === "do" && L.tk.length > 1) {
        if (L.tk[1].toLowerCase() !== "while") throw new BasicError("DO takes only WHILE", L.n);
        dry.cond(L.tk.slice(2), L);
      }
    } catch (e) {
      if (!/divide by zero/.test(e.message)) throw e;
    }
  }
  return { src, lines, bytes, warnings, ...ln };
}

/* ---------------------------------------------------------------- helpers */

export const DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];   // day 0 = 1970-01-01, a Thursday
export const weekday = (day) => DAYS[((day % 7) + 7) % 7];
export const isoDate = (day) => new Date(day * 86400000).toISOString().slice(0, 10);
export const dayFromIso = (iso) => Math.round(Date.parse(iso) / 86400000);
export const clock = (s) => {
  s = Math.floor(((s % 86400) + 86400) % 86400);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, "0")).join(":");
};

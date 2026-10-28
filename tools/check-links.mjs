// Resolves every internal href in _site against what was actually built.
// Catches the failure mode this site is most prone to: a page that cross-links
// to a sibling guide whose slug drifted, which no build step would ever notice.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, posix } from "node:path";

const SITE = resolve(import.meta.dirname, "..", "_site");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(SITE);
const built = new Set();
for (const f of files) {
  const url = "/" + relative(SITE, f).split("\\").join("/");
  built.add(url);
  if (url.endsWith("/index.html")) built.add(url.replace(/index\.html$/, ""));
}

let bad = 0, checked = 0;
const anchorsSeen = [];

for (const f of files.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(f, "utf8");
  const from = "/" + relative(SITE, f).split("\\").join("/");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(raw)) {
      if (raw.startsWith("#") && raw !== "#" && !ids.has(raw.slice(1))) {
        console.error(`MISSING ANCHOR  ${from}  ->  ${raw}`);
        bad++;
      }
      continue;
    }
    checked++;
    const [path, hash] = raw.split("#");
    // Assets carry a ?v=<content-hash> cache-buster (src/_data/assets.js). It is
    // part of the URL but not of the path on disk, so strip it before resolving.
    const [bare] = path.split("?");
    const target = bare.startsWith("/") ? bare : posix.join(posix.dirname(from), bare);
    const ok = built.has(target) || built.has(target + "index.html");
    if (!ok) {
      console.error(`BROKEN LINK     ${from}  ->  ${raw}`);
      bad++;
    } else if (hash) {
      anchorsSeen.push([from, target, hash]);
    }
  }
}

// Cross-page anchors: verify the id exists in the target document.
for (const [from, target, hash] of anchorsSeen) {
  const file = built.has(target + "index.html") ? join(SITE, target, "index.html") : join(SITE, target);
  const html = readFileSync(file, "utf8");
  if (!new RegExp(`\\sid="${hash}"`).test(html)) {
    console.error(`MISSING ANCHOR  ${from}  ->  ${target}#${hash}`);
    bad++;
  }
}

console.log(`checked ${checked} internal links across ${files.filter((f) => f.endsWith(".html")).length} pages`);
if (bad) { console.error(`\n${bad} problem(s)`); process.exit(1); }
console.log("all internal links resolve");

import { readFileSync } from "node:fs";
import { HtmlBasePlugin } from "@11ty/eleventy";

// PATH_PREFIX lets the whole site move under a subpath (e.g. "/x300-sim/") when
// several projects are collected under one domain. Write every internal link as
// root-relative ("/learn/"); HtmlBasePlugin rewrites them at build time.
const pathPrefix = process.env.PATH_PREFIX || "/";

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/lib": "lib" });
  eleventyConfig.addPassthroughCopy({ "src/examples": "examples" });
  eleventyConfig.addPassthroughCopy({ "src/root": "." });
  eleventyConfig.addGlobalData("layout", "layouts/page.njk");

  // {% bas "learn/02-thermostat.bas" %} -> the script, verbatim, from src/examples.
  // Pages show the same file the tests run, so they can't drift apart.
  eleventyConfig.addShortcode("bas", (file) => {
    const src = readFileSync(`src/examples/${file}`, "utf8").replace(/\s+$/, "");
    return `<pre class="bas"><code>${escapeHtml(src)}</code></pre>`;
  });
  // {% play "learn/02-thermostat" %} -> button that opens it in the playground
  eleventyConfig.addShortcode("play", (id, label = "Run it in the playground") =>
    `<p><a class="btn" href="/playground/?example=${encodeURIComponent(id)}">${label} &rarr;</a></p>`);

  eleventyConfig.addFilter("byOrder", (coll) => [...coll].sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99)));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
    pathPrefix,
  };
}

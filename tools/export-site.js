#!/usr/bin/env node
// Turns one site config into a ready-to-upload static site.
//   node tools/export-site.js detailing            -> dist/detailing/
//   node tools/export-site.js detailing some/folder
// The exported page has all its text in the HTML, which is what search engines want.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..", "templates");
const name = (process.argv[2] || "").replace(/[^a-z0-9-]/gi, "");
const configPath = path.join(root, "sites", name + ".js");
if (!name || !fs.existsSync(configPath)) {
  console.error("Usage: node tools/export-site.js <site-name> [output-folder]");
  console.error("Sites: " + fs.readdirSync(path.join(root, "sites")).map((f) => f.replace(/\.js$/, "")).join(", "));
  process.exit(1);
}

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(configPath, "utf8"), sandbox);
const site = sandbox.window.SITE;
const { render, themeCss, fontsUrl, esc } = require(path.join(root, "site", "render.js"));

const out = path.resolve(process.argv[3] || path.join("dist", name));
fs.mkdirSync(out, { recursive: true });
const b = site.business;
const title = (site.hero && site.hero.title ? site.hero.title + " | " : "") + b.name;
const description = (site.quote && site.quote.text ? b.tagline + ". " + site.quote.text : b.tagline) || b.name;
const fonts = fontsUrl(site);
const config = JSON.stringify(site).replace(/</g, "\\u003c");

fs.writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${fonts ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link rel="stylesheet" href="${esc(fonts)}">` : ""}
  <link rel="stylesheet" href="site.css">
  <style>${themeCss(site)}</style>
</head>
<body data-prerendered="1">
<div id="app">${render(site)}</div>
<script>window.SITE = ${config};</script>
<script src="render.js"></script>
<script src="site.js"></script>
</body>
</html>
`
);
for (const file of ["site.css", "site.js", "render.js"]) fs.copyFileSync(path.join(root, "site", file), path.join(out, file));
console.log("Exported " + b.name + " to " + out);

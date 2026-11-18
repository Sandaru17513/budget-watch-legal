// Builds the static legal site (index.html, privacy/, terms/) from the app's data/legal.ts.
// Usage: node build.mjs [path/to/legal.ts]   (default: ../Budget-Watch/data/legal.ts)
// Needs Node 22.18+ (built-in TypeScript type stripping). Only privacyPolicy and termsOfUse are published.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const source = resolve(process.argv[2] ?? resolve(root, "../Budget-Watch/data/legal.ts"));
const { privacyPolicy, termsOfUse } = await import(pathToFileURL(source).href);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Contact email: first email address found in the Contact section of the privacy policy.
const contactText = privacyPolicy.sections.find((s) => s.heading === "Contact")?.body.join(" ") ?? "";
const email = contactText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0];
if (!email) throw new Error("No contact email found in the Contact section");

const css = `
:root{color-scheme:light dark;--bg:#fff;--fg:#1c1c1e;--muted:#636366;--line:#e5e5ea;--link:#0a6b3d}
@media (prefers-color-scheme:dark){:root{--bg:#121214;--fg:#f2f2f7;--muted:#a1a1a6;--line:#2c2c2e;--link:#5ad58f}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main,footer{max-width:720px;margin:0 auto;padding:24px 16px}
h1{font-size:1.9rem;line-height:1.25;margin:.5rem 0}
h2{font-size:1.2rem;margin:2rem 0 .5rem}
p{margin:.6rem 0}
a{color:var(--link)}
.muted{color:var(--muted)}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:.9rem;margin-top:2rem}
footer a{margin-right:1rem}
ul.docs{padding-left:1.2rem}
`;

const page = ({ title, description, body, base }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<style>${css}</style>
</head>
<body>
${body}
<footer>
<nav><a href="${base}privacy/">Privacy Policy</a><a href="${base}terms/">Terms of Use</a></nav>
<p>Contact: <a href="mailto:${esc(email)}">${esc(email)}</a></p>
</footer>
</body>
</html>
`;

const docPage = (doc) =>
  page({
    title: `${doc.title} | Budget Watch`,
    description: `Budget Watch ${doc.title}. Last updated ${doc.updated}.`,
    base: "../",
    body: `<main>
<p class="muted"><a href="../">Budget Watch</a></p>
<h1>${esc(doc.title)}</h1>
<p class="muted">Last updated: ${esc(doc.updated)}</p>
${doc.sections
  .map((s) => `<section>\n<h2>${esc(s.heading)}</h2>\n${s.body.map((p) => `<p>${esc(p)}</p>`).join("\n")}\n</section>`)
  .join("\n")}
</main>`,
  });

const write = (file, html) => {
  const path = resolve(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  console.log("wrote", file);
};

write(
  "index.html",
  page({
    title: "Budget Watch: Legal",
    description: "Privacy Policy and Terms of Use for the Budget Watch app.",
    base: "",
    body: `<main>
<h1>Budget Watch: Legal</h1>
<p>Legal documents for the Budget Watch app.</p>
<ul class="docs">
<li><a href="privacy/">${esc(privacyPolicy.title)}</a> <span class="muted">(updated ${esc(privacyPolicy.updated)})</span></li>
<li><a href="terms/">${esc(termsOfUse.title)}</a> <span class="muted">(updated ${esc(termsOfUse.updated)})</span></li>
</ul>
</main>`,
  }),
);
write("privacy/index.html", docPage(privacyPolicy));
write("terms/index.html", docPage(termsOfUse));

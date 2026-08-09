import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const outputPath = resolve(
  process.argv[2] ?? resolve(projectRoot, "single-file", "index.html"),
);

const stylesheet = readFileSync(
  resolve(projectRoot, "frontend", "dist", "style.css"),
  "utf8",
).replace(/<\/style/gi, "<\\/style");

const applicationBundle = readFileSync(
  resolve(projectRoot, "frontend", "dist", "rnd-bundle.umd.cjs"),
  "utf8",
).replace(/<\/script/gi, "<\\/script");

const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#05090d" />
  <meta name="description" content="HydroNexis-AI R&D and Planning cockpit developer review" />
  <title>HydroNexis-AI R&D & Planning · Nexi Engineering</title>
  <style>
${stylesheet}
  </style>
</head>
<body>
  <div id="hnx-rnd-root" style="width:100%;height:100%;margin:0;background:#05090d"></div>
  <script>
${applicationBundle}
  </script>
  <script>
    (() => {
      const host = document.getElementById("hnx-rnd-root");
      if (!host) return;

      if (typeof window.__initRNDv2 !== "function") {
        host.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;color:white;background:#05090d;font:16px system-ui"><p>The embedded HydroNexis application could not start.</p></main>';
        return;
      }

      window.__rndController = window.__initRNDv2(host);
      window.__rndController.open();
    })();
  </script>
</body>
</html>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, document, "utf8");

console.log(`Created self-contained HydroNexis file: ${outputPath}`);

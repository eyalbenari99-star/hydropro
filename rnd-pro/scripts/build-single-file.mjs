import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const outputPath = resolve(
  process.argv[2] ?? resolve(projectRoot, "single-file", "index.html"),
);
const developerSourcePath = process.argv[3]
  ? resolve(process.argv[3])
  : undefined;

const stylesheet = readFileSync(
  resolve(projectRoot, "frontend", "dist", "style.css"),
  "utf8",
).replace(/<\/style/gi, "<\\/style");

const applicationBundle = readFileSync(
  resolve(projectRoot, "frontend", "dist", "rnd-bundle.umd.cjs"),
  "utf8",
).replace(/<\/script/gi, "<\\/script");

const developerSource = developerSourcePath
  ? readFileSync(developerSourcePath)
  : Buffer.alloc(0);
const developerSourceBase64 = developerSource.toString("base64");
const developerSourceSha256 = developerSource.length
  ? createHash("sha256").update(developerSource).digest("hex")
  : "not-embedded";
const developerSourceFileName = "HydroNexis_RND_PRO_V2_Full_Developer_Source.zip";

const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#05090d" />
  <meta name="description" content="HydroNexis-AI R&D and Planning full standalone developer handoff" />
  <title>HydroNexis-AI R&D Pro V2 · Full Developer Handoff</title>
  <style>
${stylesheet}
    .hnx-dev-trigger {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483000;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid rgba(67, 232, 216, 0.5);
      border-radius: 999px;
      color: #eaffff;
      background: linear-gradient(135deg, rgba(6, 33, 43, 0.96), rgba(8, 20, 29, 0.96));
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42), 0 0 24px rgba(39, 207, 191, 0.14);
      font: 700 12px/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      backdrop-filter: blur(16px);
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }
    .hnx-dev-trigger:hover {
      transform: translateY(-2px);
      border-color: rgba(103, 255, 231, 0.9);
      box-shadow: 0 16px 42px rgba(0, 0, 0, 0.48), 0 0 30px rgba(39, 207, 191, 0.22);
    }
    .hnx-dev-trigger:focus-visible,
    .hnx-dev-action:focus-visible,
    .hnx-dev-close:focus-visible {
      outline: 2px solid #6fffe9;
      outline-offset: 3px;
    }
    .hnx-dev-trigger-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #55f7d4;
      box-shadow: 0 0 14px rgba(85, 247, 212, 0.85);
      animation: hnx-dev-pulse 2.2s ease-in-out infinite;
    }
    .hnx-dev-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483001;
      display: grid;
      place-items: center;
      padding: 22px;
      background: rgba(1, 7, 11, 0.76);
      backdrop-filter: blur(14px);
      animation: hnx-dev-fade 180ms ease both;
    }
    .hnx-dev-backdrop[hidden] { display: none !important; }
    .hnx-dev-dialog {
      position: relative;
      width: min(680px, 100%);
      max-height: min(780px, calc(100vh - 44px));
      overflow: auto;
      padding: 30px;
      border: 1px solid rgba(71, 226, 211, 0.34);
      border-radius: 22px;
      color: #eaf8fb;
      background:
        radial-gradient(circle at 82% 0%, rgba(36, 200, 184, 0.16), transparent 35%),
        linear-gradient(160deg, #091821 0%, #071119 68%, #061016 100%);
      box-shadow: 0 30px 90px rgba(0, 0, 0, 0.68), inset 0 1px rgba(255, 255, 255, 0.04);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      animation: hnx-dev-rise 220ms cubic-bezier(.2,.75,.25,1) both;
    }
    .hnx-dev-kicker {
      margin: 0 0 8px;
      color: #55e9d2;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .hnx-dev-dialog h2 {
      margin: 0;
      color: #f3ffff;
      font-size: clamp(25px, 4vw, 38px);
      line-height: 1.04;
      letter-spacing: -0.035em;
    }
    .hnx-dev-lead {
      margin: 14px 0 22px;
      color: #a9c1cb;
      font-size: 14px;
      line-height: 1.65;
    }
    .hnx-dev-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 0 0 22px;
    }
    .hnx-dev-item {
      min-height: 68px;
      padding: 13px 14px;
      border: 1px solid rgba(96, 170, 184, 0.18);
      border-radius: 13px;
      color: #c9dde4;
      background: rgba(3, 16, 23, 0.62);
      font-size: 12px;
      line-height: 1.45;
    }
    .hnx-dev-item strong {
      display: block;
      margin-bottom: 4px;
      color: #efffff;
      font-size: 12px;
    }
    .hnx-dev-action {
      width: 100%;
      min-height: 50px;
      border: 1px solid rgba(86, 255, 221, 0.65);
      border-radius: 13px;
      color: #03201c;
      background: linear-gradient(135deg, #6fffe9, #30cdb8);
      box-shadow: 0 10px 30px rgba(28, 211, 184, 0.2);
      font: 800 13px/1 Inter, ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.035em;
      cursor: pointer;
      transition: transform 160ms ease, filter 160ms ease;
    }
    .hnx-dev-action:hover { transform: translateY(-1px); filter: brightness(1.06); }
    .hnx-dev-meta {
      display: grid;
      gap: 5px;
      margin-top: 13px;
      color: #6f8c98;
      font: 10px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      word-break: break-all;
    }
    .hnx-dev-note {
      margin: 18px 0 0;
      padding: 13px 14px;
      border-left: 3px solid #ffc74a;
      border-radius: 4px 10px 10px 4px;
      color: #b8c8ce;
      background: rgba(255, 190, 56, 0.07);
      font-size: 11px;
      line-height: 1.55;
    }
    .hnx-dev-close {
      position: absolute;
      top: 17px;
      right: 17px;
      width: 34px;
      height: 34px;
      border: 1px solid rgba(136, 190, 198, 0.24);
      border-radius: 50%;
      color: #d8edef;
      background: rgba(3, 15, 21, 0.72);
      font: 22px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    @keyframes hnx-dev-pulse { 50% { opacity: .42; transform: scale(.78); } }
    @keyframes hnx-dev-fade { from { opacity: 0; } }
    @keyframes hnx-dev-rise { from { opacity: 0; transform: translateY(18px) scale(.985); } }
    @media (max-width: 620px) {
      .hnx-dev-grid { grid-template-columns: 1fr; }
      .hnx-dev-dialog { padding: 26px 20px 22px; border-radius: 17px; }
      .hnx-dev-trigger { right: 12px; bottom: 12px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hnx-dev-trigger-dot,
      .hnx-dev-backdrop,
      .hnx-dev-dialog { animation: none !important; }
    }
  </style>
</head>
<body>
  <div id="hnx-rnd-root" style="width:100%;height:100%;margin:0;background:#05090d"></div>
  <button id="hnx-dev-open" class="hnx-dev-trigger" type="button" aria-haspopup="dialog" aria-controls="hnx-dev-backdrop">
    <span class="hnx-dev-trigger-dot" aria-hidden="true"></span>
    Developer handoff
  </button>
  <div id="hnx-dev-backdrop" class="hnx-dev-backdrop" hidden>
    <section class="hnx-dev-dialog" role="dialog" aria-modal="true" aria-labelledby="hnx-dev-title">
      <button id="hnx-dev-close" class="hnx-dev-close" type="button" aria-label="Close developer handoff">×</button>
      <p class="hnx-dev-kicker">R&amp;D Pro V2 · embedded implementation package</p>
      <h2 id="hnx-dev-title">Everything developers need is inside this HTML.</h2>
      <p class="hnx-dev-lead">The interface is fully runnable here. The button below extracts the complete structured source package embedded inside this same <strong>index.html</strong>.</p>
      <div class="hnx-dev-grid">
        <div class="hnx-dev-item"><strong>Frontend</strong>React/TypeScript source, project intake, animated cockpit, CAD workspace, image controls, scene engine, and compiled build.</div>
        <div class="hnx-dev-item"><strong>Backend</strong>FastAPI contracts, governed Nexi analysis, change previews, service adapters, and tests.</div>
        <div class="hnx-dev-item"><strong>Data & engineering</strong>PostgreSQL migrations, synchronized 3D twin, calculations, BOM, Gantt, DXF, approvals, and audit foundations.</div>
        <div class="hnx-dev-item"><strong>Implementation specification</strong>Master Word/Markdown specification, architecture, motion system, rollout, validation, and developer guides.</div>
      </div>
      <button id="hnx-dev-download" class="hnx-dev-action" type="button">Download full embedded developer source</button>
      <div class="hnx-dev-meta">
        <span>Embedded package: ${developerSourceFileName}</span>
        <span>Size: ${developerSource.length.toLocaleString("en-US")} bytes</span>
        <span>SHA-256: ${developerSourceSha256}</span>
      </div>
      <p class="hnx-dev-note"><strong>Engineering governance:</strong> production deployment still requires security validation, qualified discipline review, licensed CAD components where applicable, and mandatory human approval for safety-critical or issued work.</p>
    </section>
  </div>
  <script id="hnx-dev-source" type="application/octet-stream">${developerSourceBase64}</script>
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

      const openButton = document.getElementById("hnx-dev-open");
      const closeButton = document.getElementById("hnx-dev-close");
      const backdrop = document.getElementById("hnx-dev-backdrop");
      const downloadButton = document.getElementById("hnx-dev-download");
      const sourceElement = document.getElementById("hnx-dev-source");

      const openHandoff = () => {
        if (!backdrop) return;
        backdrop.hidden = false;
        closeButton?.focus();
      };

      const closeHandoff = () => {
        if (!backdrop) return;
        backdrop.hidden = true;
        openButton?.focus();
      };

      openButton?.addEventListener("click", openHandoff);
      closeButton?.addEventListener("click", closeHandoff);
      backdrop?.addEventListener("click", (event) => {
        if (event.target === backdrop) closeHandoff();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && backdrop && !backdrop.hidden) closeHandoff();
      });

      downloadButton?.addEventListener("click", () => {
        const encodedSource = sourceElement?.textContent?.replace(/\\s/g, "") ?? "";
        if (!encodedSource) {
          window.alert("The embedded developer package is unavailable in this build.");
          return;
        }

        const binarySource = window.atob(encodedSource);
        const chunkSize = 64 * 1024;
        const chunks = [];
        for (let offset = 0; offset < binarySource.length; offset += chunkSize) {
          const slice = binarySource.slice(offset, offset + chunkSize);
          const bytes = new Uint8Array(slice.length);
          for (let index = 0; index < slice.length; index += 1) {
            bytes[index] = slice.charCodeAt(index);
          }
          chunks.push(bytes);
        }

        const sourceBlob = new Blob(chunks, { type: "application/zip" });
        const sourceUrl = URL.createObjectURL(sourceBlob);
        const sourceLink = document.createElement("a");
        sourceLink.href = sourceUrl;
        sourceLink.download = "${developerSourceFileName}";
        document.body.appendChild(sourceLink);
        sourceLink.click();
        sourceLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(sourceUrl), 2000);
      });
    })();
  </script>
</body>
</html>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, document, "utf8");

console.log(`Created self-contained HydroNexis file: ${outputPath}`);

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Dream Island application and PWA assets", async () => {
  await Promise.all([
    access(new URL("../dist/server/index.js", import.meta.url)),
    access(new URL("../dist/.openai/hosting.json", import.meta.url)),
    access(new URL("../public/icon-192.png", import.meta.url)),
    access(new URL("../public/icon-512.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);

  const [app, layout, manifestText, serviceWorker] = await Promise.all([
    readFile(new URL("../app/DreamApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "梦屿 · 私人梦境档案");
  assert.equal(manifest.display, "standalone");
  assert.match(app, /保存，继续睡/);
  assert.match(app, /深度分析梦境/);
  assert.match(app, /造梦日历/);
  assert.match(layout, /og\.png/);
  assert.match(serviceWorker, /pathname\.startsWith\(\"\/api\/\"\)/);
  assert.doesNotMatch(app, /codex-preview|Your site is taking shape/i);
});

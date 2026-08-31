import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../docs/styles.css", import.meta.url), "utf8");
const index = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const library = await readFile(new URL("../docs/library.html", import.meta.url), "utf8");
const app = await readFile(new URL("../docs/app.js", import.meta.url), "utf8");

test("mobile checkboxes are vertically centered beside full-width content", () => {
  assert.match(styles, /\.check-row \{ gap: 10px; align-items: center; padding: 12px; \}/);
  assert.match(styles, /\.check-content \{ grid-template-columns: 1fr; gap: 9px; \}/);
  assert.match(styles, /\.action-meta \{ margin-left: 0; \}/);
  assert.match(styles, /\.action-metric:first-child \{ padding-left: 0; border-left: 0; \}/);
  assert.doesNotMatch(styles, /\.action-meta \{ margin-left: -/);
  assert.doesNotMatch(styles, /\.check-row input \{ position: absolute/);
});

test("the page requests the mobile layout stylesheet version", () => {
  assert.match(index, /styles\.css\?v=20260831-1/);
  assert.match(library, /styles\.css\?v=20260831-1/);
});

test("Notes and Insight actions are adjacent in the mobile header", () => {
  assert.match(index, /<div class="topbar-actions">\s*<button id="notes-open"[^>]*data-library="notes"[^>]*>Notes<\/button>\s*<button id="insights-open"[^>]*data-library="insights"[^>]*>Insight<\/button>/);
  assert.match(styles, /\.topbar-actions \{[\s\S]*display: flex;[\s\S]*gap: 8px;/);
});

test("Notes and Insight open a bottom-sheet menu that links into the library", () => {
  assert.match(index, /id="library-sheet"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(index, /id="library-sheet-list"/);
  assert.match(app, /\.\/library\.html\?type=\$\{encodeURIComponent\(library\.id\)\}&id=\$\{encodeURIComponent\(entry\.id\)\}/);
  assert.match(styles, /\.library-sheet-backdrop\[hidden\] \{\s*display: none;/);
  assert.match(styles, /\.library-sheet \{[\s\S]*transform: translateY\(100%\);/);
  assert.match(library, /<body class="library-page">/);
  assert.match(library, /id="library-menu"/);
  assert.match(library, /id="library-reader"/);
  assert.match(styles, /\.library-shell \{[\s\S]*min-height: 100dvh;/);
});

test("all twelve weeks remain visible as a four-column timeline", () => {
  assert.match(app, /Array\.from\(\{ length: 12 \}/);
  assert.match(styles, /\.week-tabs \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
  assert.match(app, /この週のアクションはまだ設定されていません。/);
});

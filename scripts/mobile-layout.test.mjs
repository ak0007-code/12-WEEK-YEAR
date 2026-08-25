import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../docs/styles.css", import.meta.url), "utf8");
const index = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");

test("mobile checkboxes are vertically centered beside full-width content", () => {
  assert.match(styles, /\.check-row \{ gap: 10px; align-items: center; padding: 12px; \}/);
  assert.match(styles, /\.check-content \{ grid-template-columns: 1fr; gap: 9px; \}/);
  assert.match(styles, /\.action-meta \{ margin-left: 0; \}/);
  assert.doesNotMatch(styles, /\.action-meta \{ margin-left: -/);
  assert.doesNotMatch(styles, /\.check-row input \{ position: absolute/);
});

test("the page requests the mobile layout stylesheet version", () => {
  assert.match(index, /styles\.css\?v=20260824-7/);
});

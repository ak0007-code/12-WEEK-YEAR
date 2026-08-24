import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildWeeklyIssue,
  formatJapaneseDate,
  getWeekDates,
  validatePlan
} from "./weekly-check.mjs";

const plan = JSON.parse(
  await readFile(new URL("../plans/week-01.json", import.meta.url), "utf8")
);

test("Week 1 plan contains the 17 Notion actions", () => {
  assert.equal(validatePlan(plan).actions.length, 17);
});

test("renders one weekly issue with weekdays as parent sections", () => {
  const issue = buildWeeklyIssue(plan);
  assert.equal(issue.title, "Weekly Check | Week 1 | 2026-06-29 - 2026-07-05");
  assert.equal((issue.body.match(/^<details>$/gm) ?? []).length, 7);
  assert.equal((issue.body.match(/^<summary><strong>.+<\/strong><\/summary>$/gm) ?? []).length, 7);
  assert.match(issue.body, /<summary><strong>月曜日（6\/29）<\/strong><\/summary>/);
  assert.match(issue.body, /<summary><strong>日曜日（7\/5）<\/strong><\/summary>/);
  assert.equal((issue.body.match(/^- \[[ x]\]/gm) ?? []).length, 119);
  assert.equal((issue.body.match(/^- \[x\]/gm) ?? []).length, 61);
  for (const area of ["英語", "仕事", "健康", "人間性"]) {
    assert.equal((issue.body.match(new RegExp(`^### ${area}$`, "gm")) ?? []).length, 7);
  }
});

test("Monday retains the eight historical checks", () => {
  const issue = buildWeeklyIssue(plan);
  const monday = issue.body.match(/月曜日（6\/29）<\/strong><\/summary>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(monday);
  assert.equal((monday.match(/^- \[x\]/gm) ?? []).length, 8);
  assert.equal((monday.match(/^- \[[ x]\]/gm) ?? []).length, 17);
});

test("can render a blank weekly issue for mobile interaction testing", () => {
  const issue = buildWeeklyIssue(plan, { prefill: false });
  assert.equal((issue.body.match(/^- \[x\]/gm) ?? []).length, 0);
  assert.equal((issue.body.match(/^- \[ \]/gm) ?? []).length, 119);
});

test("returns all seven dates in order", () => {
  assert.deepEqual(getWeekDates(plan), [
    "2026-06-29",
    "2026-06-30",
    "2026-07-01",
    "2026-07-02",
    "2026-07-03",
    "2026-07-04",
    "2026-07-05"
  ]);
});

test("formats the final day using the expected Japanese weekday", () => {
  assert.equal(formatJapaneseDate("2026-07-05"), "2026-07-05（日）");
});

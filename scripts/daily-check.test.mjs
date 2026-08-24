import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildDailyIssue, formatJapaneseDate, validatePlan } from "./daily-check.mjs";

const plan = JSON.parse(
  await readFile(new URL("../plans/week-01.json", import.meta.url), "utf8")
);

test("Week 1 plan contains the 17 Notion actions", () => {
  assert.equal(validatePlan(plan).actions.length, 17);
});

test("renders Monday with the historical completion state", () => {
  const issue = buildDailyIssue(plan, "2026-06-29");
  assert.equal(issue.title, "Daily Check | Week 1 | 2026-06-29（月）");
  assert.equal((issue.body.match(/^- \[[ x]\]/gm) ?? []).length, 17);
  assert.equal((issue.body.match(/^- \[x\]/gm) ?? []).length, 8);
  for (const area of ["英語", "仕事", "健康", "人間性"]) {
    assert.match(issue.body, new RegExp(`^## ${area}$`, "m"));
  }
});

test("can render a blank issue for mobile interaction testing", () => {
  const issue = buildDailyIssue(plan, "2026-06-29", { prefill: false });
  assert.equal((issue.body.match(/^- \[x\]/gm) ?? []).length, 0);
  assert.equal((issue.body.match(/^- \[ \]/gm) ?? []).length, 17);
});

test("rejects a date outside the selected week", () => {
  assert.throws(
    () => buildDailyIssue(plan, "2026-07-06"),
    /date must be within 2026-06-29 and 2026-07-05/
  );
});

test("formats the final day using the expected Japanese weekday", () => {
  assert.equal(formatJapaneseDate("2026-07-05"), "2026-07-05（日）");
});

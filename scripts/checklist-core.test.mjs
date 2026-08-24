import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildGitHubSaveUrl,
  countChecks,
  createInitialState,
  createSnapshot,
  getWeekDates,
  mergeStoredState,
  setCheck
} from "../docs/checklist-core.mjs";

const plan = JSON.parse(await readFile(new URL("../plans/week-08.json", import.meta.url), "utf8"));

test("Week 8 starts from the 46 imported Notion checks", () => {
  const state = createInitialState(plan);
  assert.equal(countChecks(state).checked, 46);
  assert.equal(countChecks(state).total, 98);
  assert.equal(getWeekDates(plan).length, 7);
});

test("a check changes locally without mutating the previous state", () => {
  const state = createInitialState(plan);
  const next = setCheck(state, "2026-08-17", "week-08-action-02", true);
  assert.equal(state["2026-08-17"]["week-08-action-02"], false);
  assert.equal(next["2026-08-17"]["week-08-action-02"], true);
  assert.equal(countChecks(next).checked, 47);
});

test("stored values are limited to known dates and actions", () => {
  const state = mergeStoredState(plan, {
    "2026-08-17": { "week-08-action-02": true, unknown: true },
    "2099-01-01": { "week-08-action-02": true }
  });
  assert.equal(state["2026-08-17"]["week-08-action-02"], true);
  assert.equal(state["2026-08-17"].unknown, undefined);
  assert.equal(state["2099-01-01"], undefined);
});

test("GitHub save uses a compact complete snapshot", () => {
  const state = createInitialState(plan);
  const savedAt = "2026-08-24T12:34:56.000Z";
  const snapshot = createSnapshot(plan, state, savedAt);
  assert.equal(snapshot.bits.length, 7);
  assert.ok(snapshot.bits.every((bits) => bits.length === 14));

  const url = new URL(buildGitHubSaveUrl({ repo: "ak0007-code/12-WEEK-YEAR", plan, state, savedAt }));
  assert.equal(url.hostname, "github.com");
  assert.equal(url.searchParams.get("title"), "Week 8 Check-in | 2026-08-24");
  assert.match(url.searchParams.get("body"), /weekly-check-snapshot/);
  assert.ok(url.href.length < 4000);
});

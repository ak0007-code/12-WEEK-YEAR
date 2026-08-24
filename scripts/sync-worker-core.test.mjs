import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyStateToPlan,
  buildRepositoryUpdate,
  getCorsOrigin,
  renderCurrentActions,
  replaceCurrentActions
} from "../sync-worker/core.mjs";

test("the Pages path is reduced to its CORS origin", () => {
  assert.equal(
    getCorsOrigin("https://ak0007-code.github.io/12-WEEK-YEAR/"),
    "https://ak0007-code.github.io"
  );
});

const plan = JSON.parse(await readFile(new URL("../plans/week-09.json", import.meta.url), "utf8"));
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const dates = [
  "2026-08-24",
  "2026-08-25",
  "2026-08-26",
  "2026-08-27",
  "2026-08-28",
  "2026-08-29",
  "2026-08-30"
];

function blankState() {
  return Object.fromEntries(
    dates.map((date) => [
      date,
      Object.fromEntries(plan.actions.map(({ id }) => [id, false]))
    ])
  );
}

test("browser state becomes completedDays in the active plan", () => {
  const state = blankState();
  state["2026-08-24"]["week-09-action-04"] = true;
  state["2026-08-26"]["week-09-action-04"] = true;
  const updated = applyStateToPlan(plan, state);
  assert.deepEqual(updated.actions[3].completedDays, ["2026-08-24", "2026-08-26"]);
  assert.deepEqual(plan.actions[3].completedDays, []);
});

test("unknown dates and actions are rejected", () => {
  assert.throws(() => applyStateToPlan(plan, { "2099-01-01": {} }), /unknown date/);
  const state = blankState();
  state["2026-08-24"].unknown = true;
  assert.throws(() => applyStateToPlan(plan, state), /unknown action/);
});

test("the Week 9 README matrix is generated from completed days", () => {
  const state = blankState();
  state["2026-08-24"]["week-09-action-01"] = true;
  state["2026-08-29"]["week-09-action-04"] = true;
  const updatedPlan = applyStateToPlan(plan, state);
  const section = renderCurrentActions(updatedPlan);
  assert.match(section, /### Week 9/);
  assert.match(section, /\| 項目 \| Goal \| Frequency \| 月 \| 火 \| 水 \| 木 \| 金 \| 土 \| 日 \| Progress \|/);
  assert.match(section, /スピーキングテストを受ける \| 英語 \| 1 time \| ✅ \|  \|  \|  \|  \|  \|  \| Completed \|/);
  assert.match(section, /3時間以上英語を勉強する \| 英語 \| 7 times \|  \|  \|  \|  \|  \| ✅ \|  \| 14% \|/);
  for (const action of plan.actions) {
    assert.match(
      section,
      new RegExp(`${action.title} \\| ${action.area} \\| ${action.targetPerWeek} ${action.targetPerWeek === 1 ? "time" : "times"}`)
    );
  }
});

test("only the current action section is replaced", () => {
  const updated = replaceCurrentActions(readme, plan);
  assert.match(updated, /^# ビジョン/);
  assert.match(updated, /## 全体戦略/);
  assert.match(updated, /## Planning & Reflections/);
  assert.equal((updated.match(/## 今週のアクション/g) ?? []).length, 1);
});

test("the checked-in README matches the current Week 9 plan", () => {
  assert.ok(readme.includes(renderCurrentActions(plan)));
});

test("README and plan JSON are produced together", () => {
  const state = blankState();
  state["2026-08-30"]["week-09-action-02"] = true;
  const updated = buildRepositoryUpdate(readme, plan, state);
  assert.match(updated.readme, /日本人と週2回以上遊ばない \| 英語 \| 1 time \|  \|  \|  \|  \|  \|  \| ✅ \| Completed \|/);
  assert.deepEqual(JSON.parse(updated.plan).actions[1].completedDays, ["2026-08-30"]);
});

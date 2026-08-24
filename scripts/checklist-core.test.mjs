import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseInitialWeek,
  countChecks,
  createInitialState,
  formatMonthDay,
  getActionDisplay,
  getAutomaticSelection,
  getActionProgress,
  getDateInTimeZone,
  getDayIndex,
  getInitialState,
  getPlanUrl,
  getWeekDates,
  mergeStoredState,
  setCheck
} from "../docs/checklist-core.mjs";

const plan = JSON.parse(await readFile(new URL("../plans/week-08.json", import.meta.url), "utf8"));

test("Week 1 through 9 use zero-padded plan URLs", () => {
  assert.equal(getPlanUrl(1), "./plans/week-01.json");
  assert.equal(getPlanUrl(9), "./plans/week-09.json");
  assert.throws(() => getPlanUrl(0), /positive integer/);
});

test("the requested week is selected when available, otherwise the latest week is used", () => {
  const plans = [{ week: 1 }, { week: 4 }, { week: 8 }];
  assert.equal(chooseInitialWeek(plans, 4), 4);
  assert.equal(chooseInitialWeek(plans, 9), 8);
  assert.equal(chooseInitialWeek(plans, 0), 8);
});

test("Vancouver date changes at local midnight, not UTC midnight", () => {
  assert.equal(getDateInTimeZone(new Date("2026-08-17T06:30:00Z")), "2026-08-16");
  assert.equal(getDateInTimeZone(new Date("2026-08-17T07:30:00Z")), "2026-08-17");
});

test("weekday tabs format the date from the plan without a timezone shift", () => {
  assert.equal(formatMonthDay("2026-06-29"), "6/29");
  assert.equal(formatMonthDay("2026-07-01"), "7/1");
  assert.equal(formatMonthDay("2026-08-23"), "8/23");
});

test("the current Vancouver date selects its week and weekday", () => {
  const plans = [
    { week: 7, startDate: "2026-08-10", endDate: "2026-08-16" },
    { week: 8, startDate: "2026-08-17", endDate: "2026-08-23" }
  ];
  assert.deepEqual(getAutomaticSelection(plans, "2026-08-16"), { week: 7, dayIndex: 6 });
  assert.deepEqual(getAutomaticSelection(plans, "2026-08-17"), { week: 8, dayIndex: 0 });
  assert.equal(getDayIndex("2026-08-22"), 5);
});

test("a date without a plan uses the latest week and today's weekday", () => {
  const plans = [
    { week: 7, startDate: "2026-08-10", endDate: "2026-08-16" },
    { week: 8, startDate: "2026-08-17", endDate: "2026-08-23" }
  ];
  assert.deepEqual(getAutomaticSelection(plans, "2026-08-24"), { week: 8, dayIndex: 0 });
});

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

test("action progress reports when the weekly target is met", () => {
  const action = plan.actions.find(({ targetPerWeek }) => targetPerWeek === 2);
  const dates = getWeekDates(plan);
  const state = Object.fromEntries(dates.map((date) => [date, { [action.id]: false }]));
  const initial = getActionProgress(state, action);
  assert.equal(initial.checked, 0);
  assert.equal(initial.target, 2);

  let next = state;
  for (const date of dates.slice(0, 2)) {
    next = setCheck(next, date, action.id, true);
  }
  assert.deepEqual(getActionProgress(next, action), { checked: 2, target: 2, required: 2, met: true });
});

test("six of seven checks meets the 85 percent achievement rule", () => {
  const action = { id: "daily", targetPerWeek: 7 };
  const dates = getWeekDates(plan);
  const state = Object.fromEntries(
    dates.map((date, index) => [date, { daily: index < 6 }])
  );
  assert.deepEqual(getActionProgress(state, action), {
    checked: 6,
    target: 7,
    required: 6,
    met: true
  });
});

test("action display exposes goal, English frequency, and percentage or completion", () => {
  const action = { id: "daily", area: "英語", targetPerWeek: 5 };
  const dates = getWeekDates(plan);
  const state = Object.fromEntries(
    dates.map((date, index) => [date, { daily: index < 3 }])
  );
  assert.deepEqual(getActionDisplay(state, action), {
    goal: "英語",
    frequency: "5 times",
    progress: "60%",
    completed: false
  });

  const completed = setCheck(setCheck(state, dates[3], "daily", true), dates[4], "daily", true);
  assert.equal(getActionDisplay(completed, action).progress, "Completed");
  assert.equal(getActionDisplay(state, { ...action, targetPerWeek: 1 }).frequency, "1 time");
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

test("GitHub plan state wins over stale device state after connection", () => {
  const stored = { "2026-08-17": { "week-08-action-01": false } };
  const disconnected = getInitialState(plan, stored, false);
  const connected = getInitialState(plan, stored, true);
  assert.equal(disconnected["2026-08-17"]["week-08-action-01"], false);
  assert.equal(
    connected["2026-08-17"]["week-08-action-01"],
    plan.actions[0].completedDays.includes("2026-08-17")
  );
});

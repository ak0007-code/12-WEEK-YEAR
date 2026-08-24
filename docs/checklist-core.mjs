export const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export function getPlanUrl(week, base = "./plans") {
  if (!Number.isInteger(week) || week < 1) throw new TypeError("week must be a positive integer");
  return `${base}/week-${String(week).padStart(2, "0")}.json`;
}

export function chooseInitialWeek(plans, requestedWeek) {
  const weeks = plans.map((plan) => plan.week).filter(Number.isInteger);
  if (weeks.includes(requestedWeek)) return requestedWeek;
  return Math.max(...weeks);
}

export function getWeekDates(plan) {
  const start = new Date(`${plan.startDate}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function createInitialState(plan) {
  const dates = getWeekDates(plan);
  return Object.fromEntries(
    dates.map((date) => [
      date,
      Object.fromEntries(
        plan.actions.map((action) => [action.id, action.completedDays.includes(date)])
      )
    ])
  );
}

export function mergeStoredState(plan, stored) {
  const initial = createInitialState(plan);
  if (!stored || typeof stored !== "object") return initial;

  for (const [date, actions] of Object.entries(initial)) {
    for (const actionId of Object.keys(actions)) {
      if (typeof stored[date]?.[actionId] === "boolean") {
        actions[actionId] = stored[date][actionId];
      }
    }
  }
  return initial;
}

export function setCheck(state, date, actionId, checked) {
  if (!(date in state) || !(actionId in state[date])) return state;
  return {
    ...state,
    [date]: { ...state[date], [actionId]: Boolean(checked) }
  };
}

export function countChecks(state, date) {
  const values = date ? Object.values(state[date] ?? {}) : Object.values(state).flatMap(Object.values);
  return { checked: values.filter(Boolean).length, total: values.length };
}

export function createSnapshot(plan, state, savedAt = new Date().toISOString()) {
  const dates = getWeekDates(plan);
  return {
    version: 1,
    week: plan.week,
    startDate: plan.startDate,
    endDate: plan.endDate,
    savedAt,
    actionIds: plan.actions.map((action) => action.id),
    bits: dates.map((date) =>
      plan.actions.map((action) => (state[date]?.[action.id] ? "1" : "0")).join("")
    )
  };
}

export function buildGitHubSaveUrl({ repo, plan, state, savedAt }) {
  const snapshot = createSnapshot(plan, state, savedAt);
  const dates = getWeekDates(plan);
  const totals = dates.map((date, index) => {
    const count = countChecks(state, date);
    return `- ${WEEKDAYS[index]}曜日: ${count.checked}/${count.total}`;
  });
  const body = [
    `## Week ${plan.week} チェック結果`,
    "",
    ...totals,
    "",
    "<!-- weekly-check-snapshot",
    JSON.stringify(snapshot),
    "-->",
    "",
    `元データ: https://github.com/${repo}/blob/main/plans/week-${String(plan.week).padStart(2, "0")}.json`
  ].join("\n");
  const title = `Week ${plan.week} Check-in | ${savedAt.slice(0, 10)}`;
  return `https://github.com/${repo}/issues/new?${new URLSearchParams({ title, body })}`;
}

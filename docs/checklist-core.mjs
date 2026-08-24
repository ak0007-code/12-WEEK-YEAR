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

export function getDateInTimeZone(now, timeZone = "America/Vancouver") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getDayIndex(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return (day + 6) % 7;
}

export function formatMonthDay(date) {
  const value = new Date(`${date}T12:00:00Z`);
  return `${value.getUTCMonth() + 1}/${value.getUTCDate()}`;
}

export function getAutomaticSelection(plans, date) {
  const matchingPlan = plans.find((plan) => plan.startDate <= date && date <= plan.endDate);
  return {
    week: matchingPlan?.week ?? chooseInitialWeek(plans),
    dayIndex: getDayIndex(date)
  };
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

export function getInitialState(plan, stored, connected) {
  return connected ? createInitialState(plan) : mergeStoredState(plan, stored);
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

export function getActionProgress(state, action) {
  const checked = Object.values(state).filter((actions) => actions?.[action.id] === true).length;
  const target = action.targetPerWeek;
  const required = Math.ceil(target * 0.85);
  return { checked, target, required, met: checked >= required };
}

export function getActionDisplay(state, action) {
  const progress = getActionProgress(state, action);
  const percentage = progress.target > 0
    ? Math.min(100, Math.round((progress.checked / progress.target) * 100))
    : 0;
  return {
    frequency: `${progress.target} ${progress.target === 1 ? "time" : "times"}`,
    progress: progress.met ? "Completed" : `${percentage}%`,
    completed: progress.met
  };
}

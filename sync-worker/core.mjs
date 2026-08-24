const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export function getCorsOrigin(frontendUrl) {
  return new URL(frontendUrl).origin;
}

function getWeekDates(plan) {
  const start = new Date(`${plan.startDate}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderFrequency(target) {
  return `${target} ${target === 1 ? "time" : "times"}`;
}

function renderProgress(action) {
  const checked = action.completedDays.length;
  const required = Math.ceil(action.targetPerWeek * 0.85);
  if (checked >= required) return "Completed";
  return `${Math.min(100, Math.round((checked / action.targetPerWeek) * 100))}%`;
}

export function applyStateToPlan(plan, state) {
  if (!plan || !Array.isArray(plan.actions)) throw new TypeError("invalid plan");
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new TypeError("invalid state");

  const dates = getWeekDates(plan);
  const knownDates = new Set(dates);
  const knownActions = new Set(plan.actions.map(({ id }) => id));

  for (const [date, actions] of Object.entries(state)) {
    if (!knownDates.has(date) || !actions || typeof actions !== "object" || Array.isArray(actions)) {
      throw new TypeError("state contains an unknown date");
    }
    for (const [actionId, checked] of Object.entries(actions)) {
      if (!knownActions.has(actionId) || typeof checked !== "boolean") {
        throw new TypeError("state contains an unknown action or non-boolean value");
      }
    }
  }

  return {
    ...plan,
    actions: plan.actions.map((action) => ({
      ...action,
      completedDays: dates.filter((date) => state[date]?.[action.id] === true)
    }))
  };
}

export function renderCurrentActions(plan) {
  const dates = getWeekDates(plan);
  const lines = [
    "## 今週のアクション",
    "",
    `### Week ${plan.week}`,
    "",
    `| 項目 | Goal | Frequency | ${WEEKDAYS.join(" | ")} | Progress |`,
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const action of plan.actions) {
    const completed = new Set(action.completedDays);
    const cells = dates.map((date) => completed.has(date) ? "✅" : "");
    lines.push(
      `| ${escapeTableCell(action.title)} | ${escapeTableCell(action.area)} | ${renderFrequency(action.targetPerWeek)} | ${cells.join(" | ")} | ${renderProgress(action)} |`
    );
  }
  return lines.join("\n");
}

export function replaceCurrentActions(readme, plan) {
  const start = readme.indexOf("## 今週のアクション");
  const end = readme.indexOf("\n## 全体戦略", start);
  if (start < 0 || end < 0) throw new Error("README action section was not found");
  return `${readme.slice(0, start)}${renderCurrentActions(plan)}\n${readme.slice(end)}`;
}

export function buildRepositoryUpdate(readme, plan, state) {
  const updatedPlan = applyStateToPlan(plan, state);
  return {
    readme: replaceCurrentActions(readme, updatedPlan),
    plan: `${JSON.stringify(updatedPlan, null, 2)}\n`
  };
}

import {
  WEEKDAYS,
  buildGitHubSaveUrl,
  createInitialState,
  formatMonthDay,
  getAutomaticSelection,
  getDateInTimeZone,
  getPlanUrl,
  getWeekDates,
  mergeStoredState,
  setCheck
} from "./checklist-core.mjs";

const REPO = "ak0007-code/12-WEEK-YEAR";
const AVAILABLE_WEEKS = Array.from({ length: 8 }, (_, index) => index + 1);
const AREA_ORDER = ["英語", "仕事", "健康", "人間性"];

const elements = {
  app: document.querySelector("#app"),
  error: document.querySelector("#error"),
  week: document.querySelector("#week-label"),
  period: document.querySelector("#period"),
  weeks: document.querySelector("#week-tabs"),
  tabs: document.querySelector("#day-tabs"),
  heading: document.querySelector("#day-heading"),
  checklist: document.querySelector("#checklist"),
  save: document.querySelector("#save")
};

const plans = new Map();
const states = new Map();
let plan;
let dates;
let state;
let activeDate;
let activeDayIndex = 0;

function storageKey(week = plan.week) {
  return `12-week-year:week-${week}:checks:v1`;
}

function loadStoredState(week) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(week)));
  } catch {
    return null;
  }
}

function persist() {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function renderWeeks() {
  elements.weeks.replaceChildren(...AVAILABLE_WEEKS.map((week) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-tab";
    button.dataset.active = String(week === plan.week);
    button.setAttribute("aria-pressed", String(week === plan.week));
    button.textContent = `Week ${week}`;
    button.addEventListener("click", () => selectWeek(week));
    return button;
  }));
}

function renderTabs() {
  elements.tabs.replaceChildren(...dates.map((date, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-tab";
    button.dataset.active = String(date === activeDate);
    button.setAttribute("aria-pressed", String(date === activeDate));
    button.innerHTML = `<span>${WEEKDAYS[index]}</span><small>${formatMonthDay(date)}</small>`;
    button.addEventListener("click", () => {
      activeDayIndex = index;
      activeDate = date;
      render();
    });
    return button;
  }));
}

function renderChecklist() {
  const dayIndex = dates.indexOf(activeDate);
  elements.heading.textContent = `${WEEKDAYS[dayIndex]}曜日 · ${formatMonthDay(activeDate)}`;
  const groups = AREA_ORDER.map((area) => {
    const actions = plan.actions.filter((action) => action.area === area);
    if (actions.length === 0) return null;

    const section = document.createElement("section");
    section.className = "area";
    const title = document.createElement("h3");
    title.textContent = area;
    section.append(title);

    for (const action of actions) {
      const label = document.createElement("label");
      label.className = "check-row";
      label.dataset.checked = String(Boolean(state[activeDate][action.id]));
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(state[activeDate][action.id]);
      input.addEventListener("change", () => {
        state = setCheck(state, activeDate, action.id, input.checked);
        states.set(plan.week, state);
        persist();
        label.dataset.checked = String(input.checked);
      });
      const copy = document.createElement("span");
      const frequency = action.targetPerWeek === 7 ? "毎日" : `${action.targetPerWeek}回/週`;
      copy.innerHTML = `<strong>${action.title}</strong><small>${frequency}</small>`;
      label.append(input, copy);
      section.append(label);
    }
    return section;
  }).filter(Boolean);
  elements.checklist.replaceChildren(...groups);
}

function render() {
  renderWeeks();
  renderTabs();
  renderChecklist();
}

function selectWeek(week) {
  if (week === plan.week) return;
  plan = plans.get(week);
  state = states.get(week);
  dates = getWeekDates(plan);
  activeDate = dates[activeDayIndex];
  elements.week.textContent = `Week ${plan.week}`;
  elements.period.textContent = `${formatMonthDay(plan.startDate)} – ${formatMonthDay(plan.endDate)}`;
  render();
}

async function start() {
  try {
    const loadedPlans = await Promise.all(AVAILABLE_WEEKS.map(async (week) => {
      const response = await fetch(getPlanUrl(week));
      if (!response.ok) throw new Error(`Week ${week} unavailable`);
      return response.json();
    }));

    for (const loadedPlan of loadedPlans) {
      plans.set(loadedPlan.week, loadedPlan);
      states.set(
        loadedPlan.week,
        mergeStoredState(
          loadedPlan,
          loadStoredState(loadedPlan.week) ?? createInitialState(loadedPlan)
        )
      );
    }

    const today = getDateInTimeZone(new Date(), "America/Vancouver");
    const selection = getAutomaticSelection(loadedPlans, today);
    activeDayIndex = selection.dayIndex;
    plan = plans.get(selection.week);
    state = states.get(selection.week);
    dates = getWeekDates(plan);
    activeDate = dates[activeDayIndex];
    elements.week.textContent = `Week ${plan.week}`;
    elements.period.textContent = `${formatMonthDay(plan.startDate)} – ${formatMonthDay(plan.endDate)}`;
    elements.save.addEventListener("click", () => {
      persist();
      location.assign(buildGitHubSaveUrl({ repo: REPO, plan, state, savedAt: new Date().toISOString() }));
    });
    elements.save.disabled = false;
    elements.app.hidden = false;
    render();
  } catch {
    elements.error.hidden = false;
  }
}

start();

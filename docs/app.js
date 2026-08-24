import {
  WEEKDAYS,
  buildGitHubSaveUrl,
  countChecks,
  createInitialState,
  getWeekDates,
  mergeStoredState,
  setCheck
} from "./checklist-core.mjs";

const REPO = "ak0007-code/12-WEEK-YEAR";
const PLAN_URL = "./plans/week-08.json";
const AREA_ORDER = ["英語", "仕事", "健康", "人間性"];

const elements = {
  app: document.querySelector("#app"),
  error: document.querySelector("#error"),
  week: document.querySelector("#week-label"),
  period: document.querySelector("#period"),
  progress: document.querySelector("#progress"),
  tabs: document.querySelector("#day-tabs"),
  heading: document.querySelector("#day-heading"),
  checklist: document.querySelector("#checklist"),
  save: document.querySelector("#save")
};

let plan;
let dates;
let state;
let activeDate;

function storageKey() {
  return `12-week-year:week-${plan.week}:checks:v1`;
}

function loadStoredState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey()));
  } catch {
    return null;
  }
}

function persist() {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function formatDate(date) {
  const value = new Date(`${date}T12:00:00Z`);
  return `${value.getUTCMonth() + 1}/${value.getUTCDate()}`;
}

function renderProgress() {
  const count = countChecks(state);
  elements.progress.textContent = `${count.checked} / ${count.total}`;
}

function renderTabs() {
  elements.tabs.replaceChildren(...dates.map((date, index) => {
    const button = document.createElement("button");
    const count = countChecks(state, date);
    button.type = "button";
    button.className = "day-tab";
    button.dataset.active = String(date === activeDate);
    button.setAttribute("aria-pressed", String(date === activeDate));
    button.innerHTML = `<span>${WEEKDAYS[index]}</span><small>${count.checked}/${count.total}</small>`;
    button.addEventListener("click", () => {
      activeDate = date;
      render();
    });
    return button;
  }));
}

function renderChecklist() {
  const dayIndex = dates.indexOf(activeDate);
  elements.heading.textContent = `${WEEKDAYS[dayIndex]}曜日 · ${formatDate(activeDate)}`;
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
        persist();
        label.dataset.checked = String(input.checked);
        renderProgress();
        renderTabs();
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
  renderProgress();
  renderTabs();
  renderChecklist();
}

async function start() {
  try {
    const response = await fetch(PLAN_URL);
    if (!response.ok) throw new Error("plan unavailable");
    plan = await response.json();
    dates = getWeekDates(plan);
    state = mergeStoredState(plan, loadStoredState() ?? createInitialState(plan));
    activeDate = dates[0];
    elements.week.textContent = `Week ${plan.week}`;
    elements.period.textContent = `${formatDate(plan.startDate)} – ${formatDate(plan.endDate)}`;
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

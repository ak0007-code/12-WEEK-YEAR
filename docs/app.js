import {
  WEEKDAYS,
  createInitialState,
  formatMonthDay,
  getActionDisplay,
  getAutomaticSelection,
  getDateInTimeZone,
  getPlanUrl,
  getWeekDates,
  mergeStoredState,
  setCheck
} from "./checklist-core.mjs?v=20260824-2";

const AVAILABLE_WEEKS = Array.from({ length: 9 }, (_, index) => index + 1);
const AREA_ORDER = ["英語", "仕事", "健康", "人間性"];
const SYNC_API = document.querySelector('meta[name="sync-api"]')?.content.replace(/\/$/, "") ?? "";
const SESSION_KEY = "12-week-year:github-session:v1";
const SYNC_DELAY_MS = 2500;

const elements = {
  app: document.querySelector("#app"),
  error: document.querySelector("#error"),
  week: document.querySelector("#week-label"),
  period: document.querySelector("#period"),
  weeks: document.querySelector("#week-tabs"),
  tabs: document.querySelector("#day-tabs"),
  heading: document.querySelector("#day-heading"),
  checklist: document.querySelector("#checklist"),
  syncStatus: document.querySelector("#sync-status"),
  syncDetail: document.querySelector("#sync-detail"),
  save: document.querySelector("#save")
};

const plans = new Map();
const states = new Map();
let plan;
let dates;
let state;
let activeDate;
let activeDayIndex = 0;
let syncTimer;
let syncing = false;

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function setSyncCopy(status, detail) {
  elements.syncStatus.textContent = status;
  elements.syncDetail.textContent = detail;
}

function captureOAuthSession() {
  const params = new URLSearchParams(location.hash.slice(1));
  const session = params.get("session");
  if (!session) return;
  localStorage.setItem(SESSION_KEY, session);
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

function updateSyncButton() {
  if (!SYNC_API) {
    elements.save.disabled = true;
    elements.save.textContent = "同期設定が必要";
    setSyncCopy("端末に自動保存済み", "GitHub同期Workerは未設定です");
    return;
  }
  if (plan?.status !== "active") {
    elements.save.disabled = true;
    elements.save.textContent = "完了済み";
    return;
  }
  elements.save.disabled = false;
  elements.save.textContent = getSession() ? "今すぐ同期" : "GitHubと接続";
}

async function syncCurrentState() {
  clearTimeout(syncTimer);
  if (!SYNC_API || syncing || plan?.status !== "active") return;
  const session = getSession();
  if (!session) {
    setSyncCopy("端末に自動保存済み", "GitHubへ接続するとREADMEへ自動同期します");
    updateSyncButton();
    return;
  }

  syncing = true;
  elements.save.disabled = true;
  setSyncCopy("GitHubへ同期中…", `Week ${plan.week}の変更を保存しています`);
  try {
    const response = await fetch(`${SYNC_API}/api/sync`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${session}`, "Content-Type": "application/json" },
      body: JSON.stringify({ week: plan.week, state })
    });
    if (response.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      throw new Error("GitHubへ再接続してください");
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "同期に失敗しました");
    setSyncCopy("GitHubと同期済み", result.changed ? "READMEを更新しました" : "変更はありません");
  } catch (error) {
    setSyncCopy("端末には保存済み", error.message);
  } finally {
    syncing = false;
    updateSyncButton();
  }
}

function scheduleSync() {
  clearTimeout(syncTimer);
  if (!SYNC_API || plan?.status !== "active") return;
  setSyncCopy("端末に自動保存済み", getSession() ? "まもなくGitHubへ同期します" : "GitHubへの接続が必要です");
  syncTimer = setTimeout(syncCurrentState, SYNC_DELAY_MS);
}

async function checkConnection() {
  const session = getSession();
  if (!SYNC_API || !session) return updateSyncButton();
  try {
    const response = await fetch(`${SYNC_API}/api/status`, {
      headers: { "Authorization": `Bearer ${session}` }
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    setSyncCopy("GitHub接続済み", `${result.login}としてREADMEへ自動同期します`);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    setSyncCopy("端末に自動保存済み", "GitHubへ再接続してください");
  }
  updateSyncButton();
}

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
      const content = document.createElement("span");
      content.className = "check-content";
      const title = document.createElement("strong");
      title.className = "action-title";
      title.textContent = action.title;
      const meta = document.createElement("span");
      meta.className = "action-meta";

      const createMetric = (labelText, className = "") => {
        const metric = document.createElement("span");
        metric.className = `action-metric ${className}`.trim();
        const label = document.createElement("small");
        label.textContent = labelText;
        const value = document.createElement("b");
        metric.append(label, value);
        meta.append(metric);
        return value;
      };
      const goal = createMetric("Goal");
      const frequency = createMetric("Frequency");
      const progress = createMetric("Progress", "progress-metric");

      const updateProgress = () => {
        const display = getActionDisplay(state, action);
        goal.textContent = display.goal;
        frequency.textContent = display.frequency;
        progress.textContent = display.progress;
        progress.parentElement.dataset.completed = String(display.completed);
      };

      input.addEventListener("change", () => {
        state = setCheck(state, activeDate, action.id, input.checked);
        states.set(plan.week, state);
        persist();
        label.dataset.checked = String(input.checked);
        updateProgress();
        scheduleSync();
      });
      updateProgress();
      content.append(title, meta);
      label.append(input, content);
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
  updateSyncButton();
  render();
}

async function start() {
  try {
    captureOAuthSession();
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
      if (!getSession()) {
        location.assign(`${SYNC_API}/auth/login`);
        return;
      }
      syncCurrentState();
    });
    elements.app.hidden = false;
    render();
    await checkConnection();
  } catch {
    elements.error.hidden = false;
  }
}

start();

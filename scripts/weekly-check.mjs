import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const AREA_ORDER = ["英語", "仕事", "健康", "人間性"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePlan(plan) {
  if (!Number.isInteger(plan?.week) || plan.week < 1) {
    throw new Error("week must be a positive integer");
  }
  if (!ISO_DATE.test(plan.startDate) || !ISO_DATE.test(plan.endDate)) {
    throw new Error("startDate and endDate must use YYYY-MM-DD");
  }
  if (plan.startDate > plan.endDate) {
    throw new Error("startDate must not be after endDate");
  }
  if (!Array.isArray(plan.actions) || plan.actions.length === 0) {
    throw new Error("actions must be a non-empty array");
  }

  const ids = new Set();
  for (const action of plan.actions) {
    if (!action.id || ids.has(action.id)) {
      throw new Error(`action id must be present and unique: ${action.id ?? "missing"}`);
    }
    ids.add(action.id);
    if (!AREA_ORDER.includes(action.area)) {
      throw new Error(`unknown area for ${action.id}: ${action.area}`);
    }
    if (!action.title) {
      throw new Error(`title is required for ${action.id}`);
    }
    if (!Number.isInteger(action.targetPerWeek) || action.targetPerWeek < 1 || action.targetPerWeek > 7) {
      throw new Error(`targetPerWeek must be between 1 and 7 for ${action.id}`);
    }
    if (!Array.isArray(action.completedDays) || action.completedDays.some((date) => !ISO_DATE.test(date))) {
      throw new Error(`completedDays must contain YYYY-MM-DD values for ${action.id}`);
    }
  }

  return plan;
}

export function formatJapaneseDate(date) {
  if (!ISO_DATE.test(date)) {
    throw new Error("date must use YYYY-MM-DD");
  }
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
  return `${date}（${weekday}）`;
}

export function getWeekDates(plan) {
  validatePlan(plan);
  const start = new Date(`${plan.startDate}T12:00:00Z`);
  const end = new Date(`${plan.endDate}T12:00:00Z`);
  const dates = [];
  for (let cursor = start; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  if (dates.length !== 7) throw new Error("a weekly plan must contain exactly 7 days");
  return dates;
}

function formatDayHeading(date) {
  const value = new Date(`${date}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "long",
    timeZone: "UTC"
  }).format(value);
  return `${weekday}（${value.getUTCMonth() + 1}/${value.getUTCDate()}）`;
}

export function buildWeeklyIssue(plan, { prefill = true } = {}) {
  const dates = getWeekDates(plan);
  const lines = [
    `**Week ${plan.week} / ${plan.startDate}〜${plan.endDate}**`,
    "",
    "> 曜日を開き、その日に実行した項目をチェックします。各項目の太字は週の目標回数です。"
  ];

  for (const date of dates) {
    lines.push("", "<details>", `<summary><strong>${formatDayHeading(date)}</strong></summary>`, "");
    for (const area of AREA_ORDER) {
      const actions = plan.actions.filter((action) => action.area === area);
      if (actions.length === 0) continue;
      lines.push(`### ${area}`, "");
      for (const action of actions) {
        const checked = prefill && action.completedDays.includes(date) ? "x" : " ";
        const frequency = action.targetPerWeek === 7 ? "毎日" : `${action.targetPerWeek}回/週`;
        lines.push(`- [${checked}] **${frequency}** ${action.title}`);
      }
      lines.push("");
    }
    lines.push("</details>");
  }

  lines.push(
    "",
    "---",
    "",
    `期間: ${plan.startDate}〜${plan.endDate}`,
    `データ状態: ${plan.status === "completed" ? "終了済みのWeekをNotionから移植" : "進行中"}`
  );

  return {
    title: `Weekly Check | Week ${plan.week} | ${plan.startDate} - ${plan.endDate}`,
    body: `${lines.join("\n")}\n`
  };
}

function parseArguments(argv) {
  const args = { prefill: true };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--blank") {
      args.prefill = false;
    } else if (value.startsWith("--")) {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) throw new Error(`missing value for ${value}`);
      args[value.slice(2)] = next;
      index += 1;
    } else {
      throw new Error(`unexpected argument: ${value}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.plan) {
    throw new Error("usage: node scripts/weekly-check.mjs --plan <file> [--blank] [--body-file <file>] [--title-only true]");
  }

  const plan = JSON.parse(await readFile(args.plan, "utf8"));
  const issue = buildWeeklyIssue(plan, { prefill: args.prefill });

  if (args["body-file"]) {
    await writeFile(args["body-file"], issue.body, "utf8");
  }
  if (args["title-only"] === "true") {
    process.stdout.write(`${issue.title}\n`);
  } else if (!args["body-file"]) {
    process.stdout.write(issue.body);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

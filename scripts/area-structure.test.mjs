import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const areas = ["English", "Health", "Work", "Humanity"];

test("4分野にREADMEとAI指示とdetailsが用意されている", async () => {
  for (const area of areas) {
    await Promise.all([
      access(new URL(`${area}/README.md`, root)),
      access(new URL(`${area}/AGENTS.md`, root)),
      access(new URL(`${area}/CLAUDE.md`, root)),
      access(new URL(`${area}/INSIGHT.md`, root)),
      access(new URL(`${area}/details/`, root)),
    ]);
  }
});

test("CLAUDEが正本で、AGENTSは同じ階層のCLAUDEを参照する", async () => {
  const directories = ["", ...areas.map((area) => `${area}/`)];

  for (const directory of directories) {
    const agents = await readFile(new URL(`${directory}AGENTS.md`, root), "utf8");
    assert.match(agents, /CLAUDE\.md/);
    assert.match(agents, /正本/);
  }
});

test("各分野のCLAUDEが保存先を示している", async () => {
  for (const area of areas) {
    const claude = await readFile(new URL(`${area}/CLAUDE.md`, root), "utf8");
    assert.match(claude, new RegExp(`${area}/details`));
    assert.match(claude, /conversations/);
  }
});

test("ルートのCLAUDEが4分野を正本として扱う", async () => {
  const claude = await readFile(new URL("CLAUDE.md", root), "utf8");

  for (const area of areas) {
    assert.match(claude, new RegExp(`${area}/`));
  }
});

test("Codexの呼び出し方はルートのCLAUDEだけに記載されている", async () => {
  const rootClaude = await readFile(new URL("CLAUDE.md", root), "utf8");
  assert.match(rootClaude, /Codex\s*の呼び出し方/);
  assert.match(rootClaude, /CODEX_WEB_SERVER_URL/);
  assert.match(rootClaude, /CODEX_WEB_SERVER_SECRECT_KEY/);
  assert.match(rootClaude, /"effort":"medium","fast":true/);

  for (const area of areas) {
    const [agents, claude] = await Promise.all([
      readFile(new URL(`${area}/AGENTS.md`, root), "utf8"),
      readFile(new URL(`${area}/CLAUDE.md`, root), "utf8"),
    ]);
    assert.doesNotMatch(agents, /Codex\s*の呼び出し方/);
    assert.doesNotMatch(claude, /Codex\s*の呼び出し方/);
  }

  const rootAgents = await readFile(new URL("AGENTS.md", root), "utf8");
  assert.doesNotMatch(rootAgents, /Codex\s*の呼び出し方/);
});

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

test("各分野のAGENTSとCLAUDEが同じ保存先を示している", async () => {
  for (const area of areas) {
    const [agents, claude] = await Promise.all([
      readFile(new URL(`${area}/AGENTS.md`, root), "utf8"),
      readFile(new URL(`${area}/CLAUDE.md`, root), "utf8"),
    ]);

    assert.match(agents, new RegExp(`${area}/details`));
    assert.match(claude, new RegExp(`${area}/details`));
    assert.match(agents, /conversations/);
    assert.match(claude, /conversations/);
  }
});

test("ルートのAI指示が4分野を正本として扱う", async () => {
  const [agents, claude] = await Promise.all([
    readFile(new URL("AGENTS.md", root), "utf8"),
    readFile(new URL("CLAUDE.md", root), "utf8"),
  ]);

  assert.equal(agents, claude);
  for (const area of areas) {
    assert.match(agents, new RegExp(`${area}/`));
  }
});

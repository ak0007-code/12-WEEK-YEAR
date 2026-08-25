import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Englishの主要資料がローカルへ移植されている", async () => {
  const requiredFiles = [
    "English/README.md",
    "English/AGENTS.md",
    "English/CLAUDE.md",
    "English/INSIGHT.md",
    "English/shadowing/LIST.md",
  ];

  await Promise.all(requiredFiles.map((path) => access(new URL(path, root))));

  const details = (await readdir(new URL("English/details/", root))).filter((name) =>
    name.endsWith(".md"),
  );
  const scripts = (await readdir(new URL("English/shadowing/scripts/", root))).filter(
    (name) => name.endsWith(".md"),
  );

  assert.equal(details.length, 5);
  assert.equal(scripts.length, 13);
});

test("Englishの正本と移植元コミットが明記されている", async () => {
  const [agents, claude, englishReadme] = await Promise.all([
    readFile(new URL("AGENTS.md", root), "utf8"),
    readFile(new URL("CLAUDE.md", root), "utf8"),
    readFile(new URL("English/README.md", root), "utf8"),
  ]);

  assert.equal(agents, claude);
  assert.match(agents, /English\/.+正本/s);
  assert.match(englishReadme, /63fd187/);
  assert.match(englishReadme, /以後の正本はこの`English\/`/);
});

test("会話は内容に応じてEnglish/detailsとconversationsへ振り分けられる", async () => {
  const [agents, claude, englishAgents, englishClaude] = await Promise.all([
    readFile(new URL("AGENTS.md", root), "utf8"),
    readFile(new URL("CLAUDE.md", root), "utf8"),
    readFile(new URL("English/AGENTS.md", root), "utf8"),
    readFile(new URL("English/CLAUDE.md", root), "utf8"),
  ]);

  for (const instructions of [agents, claude, englishAgents, englishClaude]) {
    assert.match(instructions, /English\/details/);
    assert.match(instructions, /conversations/);
  }
});

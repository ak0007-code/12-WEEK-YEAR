import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  INSIGHTS,
  NOTES,
  getInsightUrl,
  getLibrary,
  getLibraryItem,
  getLibraryItemUrl,
  getNoteUrl,
  hasReadableContent,
  parseInlineMarkdown,
  parseNoteMarkdown
} from "../docs/note-core.mjs";

test("the two repository notes have deployable URLs", () => {
  assert.deepEqual(NOTES.map(({ title }) => title), ["人間性", "英語学習の方向性"]);
  assert.equal(getNoteUrl(NOTES[0]), "./notes/%E4%BA%BA%E9%96%93%E6%80%A7.md");
  assert.throws(() => getNoteUrl({}), /fileName/);
});

test("the four area insights have deployable URLs", () => {
  assert.deepEqual(INSIGHTS.map(({ title }) => title), ["English", "Health", "Work", "Humanity"]);
  assert.equal(getInsightUrl(INSIGHTS[0]), "./insights/English.md");
  assert.equal(getInsightUrl(INSIGHTS[3]), "./insights/Humanity.md");
  assert.throws(() => getInsightUrl({}), /fileName/);
});

test("a full-page library resolves its collection, item, and Markdown URL", () => {
  const library = getLibrary("insights");
  const item = getLibraryItem(library, "english");
  assert.equal(library.title, "Insight");
  assert.equal(item.title, "English");
  assert.equal(getLibraryItemUrl(library, item), "./insights/English.md");
  assert.equal(getLibrary("unknown").id, "notes");
  assert.equal(getLibraryItem(library, "unknown"), null);
});

test("inline links are parsed without turning ordinary text into HTML", () => {
  assert.deepEqual(parseInlineMarkdown("Source: [Notion](https://notion.so/example)"), [
    { text: "Source: " },
    { text: "Notion", href: "https://notion.so/example" }
  ]);
  assert.deepEqual(parseInlineMarkdown("<script>alert(1)</script>"), [
    { text: "<script>alert(1)</script>" }
  ]);
  assert.deepEqual(parseInlineMarkdown("**自分の実会話を録音する**"), [
    { text: "自分の実会話を録音する", strong: true }
  ]);
});

test("repository notes are parsed into headings, source, and nested list items", async () => {
  const humanity = await readFile(new URL("../notes/人間性.md", import.meta.url), "utf8");
  const blocks = parseNoteMarkdown(humanity);
  assert.equal(blocks[0].type, "quote");
  assert.equal(blocks[0].segments[1].href, "https://app.notion.com/p/394fae8ed03580029dcae84673aa8ca1");
  assert.deepEqual(
    blocks.find(({ type }) => type === "heading"),
    { type: "heading", level: 1, segments: [{ text: "目指すべき人間性" }] }
  );
  assert.ok(blocks.some(({ type, depth }) => type === "list" && depth === 1));
  assert.ok(blocks.filter(({ type }) => type === "list").length >= 28);
});

test("GitHub Pages publishes every area insight", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-checklist-pages.yml", import.meta.url), "utf8");
  for (const area of ["English", "Health", "Work", "Humanity"]) {
    assert.match(workflow, new RegExp(`${area}/INSIGHT\\.md`));
    assert.match(workflow, new RegExp(`_site/insights/${area}\\.md`));
  }
});

test("Markdown tables are parsed into header and rows", () => {
  const blocks = parseNoteMarkdown([
    "- スキンケアプロダクト一覧：",
    "",
    "  | プロダクト | 状況 |",
    "  |---|---|",
    "  | **CeraVe** | 使用中 |",
    "  | エピデュオゲル | 停止中 |"
  ].join("\n"));
  assert.equal(blocks[0].type, "list");
  const table = blocks[1];
  assert.equal(table.type, "table");
  assert.deepEqual(table.header, [[{ text: "プロダクト" }], [{ text: "状況" }]]);
  assert.deepEqual(table.rows, [
    [[{ text: "CeraVe", strong: true }], [{ text: "使用中" }]],
    [[{ text: "エピデュオゲル" }], [{ text: "停止中" }]]
  ]);
});

test("the Health insight table renders as a table block", async () => {
  const health = await readFile(new URL("../Health/INSIGHT.md", import.meta.url), "utf8");
  const blocks = parseNoteMarkdown(health);
  const table = blocks.find(({ type }) => type === "table");
  assert.ok(table);
  assert.equal(table.header.length, 4);
  assert.ok(table.rows.length >= 10);
});

test("invalid note content is rejected", () => {
  assert.throws(() => parseNoteMarkdown(null), /string/);
});

test("an insight with only a title is treated as empty", () => {
  const titleOnly = parseNoteMarkdown("# Health Insights\n");
  assert.deepEqual(titleOnly, [
    { type: "heading", level: 1, segments: [{ text: "Health Insights" }] }
  ]);
  assert.equal(hasReadableContent(titleOnly), false);
  assert.equal(hasReadableContent(parseNoteMarkdown("# Health Insights\n\n- 睡眠を優先する")), true);
  assert.throws(() => hasReadableContent(null), /array/);
});

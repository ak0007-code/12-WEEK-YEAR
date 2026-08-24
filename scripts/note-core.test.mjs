import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { NOTES, getNoteUrl, parseInlineMarkdown, parseNoteMarkdown } from "../docs/note-core.mjs";

test("the two repository notes have deployable URLs", () => {
  assert.deepEqual(NOTES.map(({ title }) => title), ["人間性", "英語学習の方向性"]);
  assert.equal(getNoteUrl(NOTES[0]), "./notes/%E4%BA%BA%E9%96%93%E6%80%A7.md");
  assert.throws(() => getNoteUrl({}), /fileName/);
});

test("inline links are parsed without turning ordinary text into HTML", () => {
  assert.deepEqual(parseInlineMarkdown("Source: [Notion](https://notion.so/example)"), [
    { text: "Source: " },
    { text: "Notion", href: "https://notion.so/example" }
  ]);
  assert.deepEqual(parseInlineMarkdown("<script>alert(1)</script>"), [
    { text: "<script>alert(1)</script>" }
  ]);
});

test("repository notes are parsed into headings, source, and nested list items", async () => {
  const humanity = await readFile(new URL("../notes/人間性.md", import.meta.url), "utf8");
  const blocks = parseNoteMarkdown(humanity);
  assert.deepEqual(blocks[0], { type: "heading", level: 1, segments: [{ text: "人間性" }] });
  assert.equal(blocks.find(({ type }) => type === "quote").segments[1].href, "https://app.notion.com/p/394fae8ed03580029dcae84673aa8ca1");
  assert.ok(blocks.some(({ type, depth }) => type === "list" && depth === 1));
  assert.ok(blocks.filter(({ type }) => type === "list").length >= 28);
});

test("invalid note content is rejected", () => {
  assert.throws(() => parseNoteMarkdown(null), /string/);
});

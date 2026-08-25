export const NOTES = [
  {
    id: "character",
    title: "人間性",
    description: "目指す人間性とIf–Thenルール",
    fileName: "人間性.md"
  },
  {
    id: "english-direction",
    title: "英語学習の方向性",
    description: "研究の振り返りと行動への落とし込み",
    fileName: "英語学習の方向性.md"
  }
];

export const INSIGHTS = [
  {
    id: "english",
    title: "English",
    description: "英語学習の重要な気づき",
    fileName: "English.md"
  },
  {
    id: "health",
    title: "Health",
    description: "心と身体の健康に関する重要な気づき",
    fileName: "Health.md"
  },
  {
    id: "work",
    title: "Work",
    description: "仕事とAI研究に関する重要な気づき",
    fileName: "Work.md"
  },
  {
    id: "humanity",
    title: "Humanity",
    description: "人間性に関する重要な気づき",
    fileName: "Humanity.md"
  }
];

export function getNoteUrl(note, base = "./notes") {
  if (!note?.fileName) throw new TypeError("note must have a fileName");
  return `${base}/${encodeURIComponent(note.fileName)}`;
}

export function getInsightUrl(insight, base = "./insights") {
  if (!insight?.fileName) throw new TypeError("insight must have a fileName");
  return `${base}/${encodeURIComponent(insight.fileName)}`;
}

export function parseInlineMarkdown(text) {
  const segments = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index) });
    segments.push({ text: match[1], href: match[2] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.length ? segments : [{ text }];
}

export function parseNoteMarkdown(markdown) {
  if (typeof markdown !== "string") throw new TypeError("markdown must be a string");
  const blocks = [];
  for (const line of markdown.replaceAll("\r\n", "\n").split("\n")) {
    if (!line.trim()) continue;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const quote = line.match(/^>\s?(.+)$/);
    const list = line.match(/^(\s*)-\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, segments: parseInlineMarkdown(heading[2]) });
    } else if (quote) {
      blocks.push({ type: "quote", segments: parseInlineMarkdown(quote[1]) });
    } else if (list) {
      blocks.push({ type: "list", depth: Math.floor(list[1].length / 2), segments: parseInlineMarkdown(list[2]) });
    } else {
      blocks.push({ type: "paragraph", segments: parseInlineMarkdown(line.trim()) });
    }
  }
  return blocks;
}

export function hasReadableContent(blocks) {
  if (!Array.isArray(blocks)) throw new TypeError("blocks must be an array");
  return blocks.some(({ type }) => type !== "heading");
}

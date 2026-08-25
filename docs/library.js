import {
  getLibrary,
  getLibraryItem,
  getLibraryItemUrl,
  hasReadableContent,
  parseNoteMarkdown
} from "./note-core.mjs?v=20260824-7";

const params = new URLSearchParams(location.search);
const library = getLibrary(params.get("type"));
const item = getLibraryItem(library, params.get("id"));

const elements = {
  back: document.querySelector("#library-back"),
  title: document.querySelector("#library-title"),
  menu: document.querySelector("#library-menu"),
  reader: document.querySelector("#library-reader"),
  error: document.querySelector("#library-error")
};

function appendInlineText(parent, segments) {
  for (const segment of segments) {
    if (segment.href) {
      const link = document.createElement("a");
      link.href = segment.href;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = segment.text;
      parent.append(link);
    } else if (segment.strong) {
      const strong = document.createElement("strong");
      strong.textContent = segment.text;
      parent.append(strong);
    } else {
      parent.append(document.createTextNode(segment.text));
    }
  }
}

function createBlock(block) {
  let element;
  if (block.type === "heading") {
    element = document.createElement(`h${Math.min(3, block.level + 1)}`);
  } else if (block.type === "quote") {
    element = document.createElement("blockquote");
  } else if (block.type === "list") {
    element = document.createElement("div");
    element.className = "note-list-item";
    element.style.setProperty("--depth", block.depth);
  } else {
    element = document.createElement("p");
  }
  appendInlineText(element, block.segments);
  return element;
}

function renderMenu() {
  elements.title.textContent = library.title;
  elements.menu.replaceChildren(...library.items.map((entry) => {
    const link = document.createElement("a");
    link.className = "note-card";
    link.href = `./library.html?type=${encodeURIComponent(library.id)}&id=${encodeURIComponent(entry.id)}`;
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const detail = document.createElement("span");
    detail.textContent = entry.description;
    link.append(title, detail);
    return link;
  }));
}

async function renderItem() {
  elements.title.textContent = item.title;
  elements.back.href = `./library.html?type=${encodeURIComponent(library.id)}`;
  elements.back.textContent = `← ${library.title}`;
  elements.menu.hidden = true;
  elements.reader.hidden = false;
  elements.reader.textContent = "読み込み中…";

  try {
    const response = await fetch(getLibraryItemUrl(library, item));
    if (!response.ok) throw new Error();
    const blocks = parseNoteMarkdown(await response.text());
    elements.reader.replaceChildren(...blocks.map(createBlock));
    if (!hasReadableContent(blocks)) {
      const empty = document.createElement("p");
      empty.className = "library-empty";
      empty.textContent = library.emptyMessage;
      elements.reader.append(empty);
    }
  } catch {
    elements.reader.hidden = true;
    elements.error.hidden = false;
    elements.error.textContent = library.errorMessage;
  }
}

if (item) {
  renderItem();
} else {
  renderMenu();
}

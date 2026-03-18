const tilForm = document.querySelector("#til-form");
const tilList = document.querySelector("#til-list");
const tilDateInput = document.querySelector("#til-date");
const tilTitleInput = document.querySelector("#til-title");
const tilContentInput = document.querySelector("#til-content");
const scrollToTilButton = document.querySelector("#scroll-to-til");
const TIL_STORAGE_KEY = "today-i-learn-items";

function getTodayText() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createTilItem(date, title, content) {
  const article = document.createElement("article");
  article.className = "til-item";

  const time = document.createElement("time");
  time.dateTime = date;
  time.textContent = date;

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = content;

  article.append(time, heading, paragraph);
  return article;
}

function renderEmptyStateIfNeeded() {
  if (!tilList || tilList.children.length > 0) {
    return;
  }

  const empty = document.createElement("p");
  empty.className = "til-empty";
  empty.textContent = "첫 TIL을 등록해보세요.";
  tilList.appendChild(empty);
}

function readTilItemsFromMarkup() {
  if (!tilList) {
    return [];
  }

  return Array.from(tilList.querySelectorAll(".til-item"))
    .map((item) => {
      const time = item.querySelector("time");
      const heading = item.querySelector("h3");
      const paragraph = item.querySelector("p");

      const date = (time?.dateTime || time?.textContent || "").trim();
      const title = (heading?.textContent || "").trim();
      const content = (paragraph?.textContent || "").trim();

      if (!date || !title || !content) {
        return null;
      }

      return { date, title, content };
    })
    .filter(Boolean);
}

function normalizeTilItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      date: typeof item.date === "string" ? item.date.trim() : "",
      title: typeof item.title === "string" ? item.title.trim() : "",
      content: typeof item.content === "string" ? item.content.trim() : "",
    }))
    .filter((item) => item.date && item.title && item.content);
}

function loadTilItems() {
  if (!tilList) {
    return [];
  }

  try {
    const saved = localStorage.getItem(TIL_STORAGE_KEY);
    if (saved) {
      return normalizeTilItems(JSON.parse(saved));
    }
  } catch (_error) {
    return readTilItemsFromMarkup();
  }

  const initialItems = readTilItemsFromMarkup();
  if (initialItems.length > 0) {
    saveTilItems(initialItems);
  }
  return initialItems;
}

function saveTilItems(items) {
  try {
    localStorage.setItem(TIL_STORAGE_KEY, JSON.stringify(items));
  } catch (_error) {
    // 저장소 접근이 제한된 환경에서는 메모리 렌더만 유지한다.
  }
}

function renderTilItems(items) {
  if (!tilList) {
    return;
  }

  tilList.innerHTML = "";

  if (items.length === 0) {
    renderEmptyStateIfNeeded();
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    fragment.appendChild(createTilItem(item.date, item.title, item.content));
  });
  tilList.appendChild(fragment);
}

if (tilDateInput) {
  tilDateInput.value = getTodayText();
}

let tilItems = [];
if (tilList) {
  tilItems = loadTilItems();
  renderTilItems(tilItems);
}

if (tilForm && tilList && tilDateInput && tilTitleInput && tilContentInput) {
  tilForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const date = tilDateInput.value;
    const title = tilTitleInput.value.trim();
    const content = tilContentInput.value.trim();

    if (!date || !title || !content) {
      return;
    }

    tilItems = [{ date, title, content }, ...tilItems];
    saveTilItems(tilItems);
    renderTilItems(tilItems);

    tilForm.reset();
    tilDateInput.value = getTodayText();
    tilTitleInput.focus();
  });

  tilForm.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      if (tilDateInput) {
        tilDateInput.value = getTodayText();
      }
    });
  });
}

if (scrollToTilButton) {
  scrollToTilButton.addEventListener("click", () => {
    const tilSection = document.querySelector("#til");
    if (tilSection) {
      tilSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

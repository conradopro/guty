// Generuje strony aktualności (aktualnosc-<slug>.html) oraz wstrzykuje karty
// do aktualnosci.html i index.html na podstawie plików content/news/*.json.
// Uruchamiane automatycznie przez GitHub Actions po każdej zmianie w content/news/.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NEWS_DIR = path.join(ROOT, "content", "news");
const TEMPLATES_DIR = path.join(ROOT, "templates");

function readNewsItems() {
  const files = fs.readdirSync(NEWS_DIR).filter((f) => f.endsWith(".json"));
  const items = files.map((f) => {
    const raw = fs.readFileSync(path.join(NEWS_DIR, f), "utf8");
    try {
      return JSON.parse(raw);
    } catch (e) {
      throw new Error(`Błąd w pliku content/news/${f}: ${e.message}`);
    }
  });
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return items;
}

function escapeAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function renderAttachmentBlock(item) {
  if (!item.attachment) return "";
  const label = escapeHtml(item.attachment_label || "Pobierz plik");
  return `<div style="margin-top:26px; padding-top:22px; border-top:1px solid var(--border);">
        <a href="${item.attachment}" target="_blank" rel="noopener" class="btn btn-solid">${label} &rarr;</a>
      </div>`;
}

function renderCard(item) {
  const tagClass = item.tag_variant === "warn" ? " warn" : "";
  return `      <a href="aktualnosc-${item.slug}.html" class="card reveal news-card">
        <span class="tag${tagClass}">${item.tag_label}</span>
        <div class="date-pill">${item.date_label}</div>
        <h3 style="font-size:1.08rem; margin-top:8px;">${item.title}</h3>
        <p>${item.excerpt}</p>
        <span class="card-link">Czytaj więcej &rarr;</span>
      </a>`;
}

function renderArticle(item, header, footer, template) {
  const tagClass = item.tag_variant === "warn" ? " warn" : "";
  return template
    .split("{{TITLE}}").join(item.title)
    .split("{{EXCERPT}}").join(escapeAttr(item.excerpt))
    .split("{{TAG_CLASS}}").join(tagClass)
    .split("{{TAG_LABEL}}").join(item.tag_label)
    .split("{{DATE_LABEL}}").join(item.date_label)
    .split("{{BODY}}").join(item.body)
    .split("{{ATTACHMENT_BLOCK}}").join(renderAttachmentBlock(item))
    .split("{{HEADER}}").join(header)
    .split("{{FOOTER}}").join(footer);
}

function replaceBetweenMarkers(fileContents, markerName, newInner) {
  const startMarker = `<!-- ${markerName}:START -->`;
  const endMarker = `<!-- ${markerName}:END -->`;
  const startIdx = fileContents.indexOf(startMarker);
  const endIdx = fileContents.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Nie znaleziono znaczników ${markerName} w pliku.`);
  }
  const before = fileContents.slice(0, startIdx + startMarker.length);
  const after = fileContents.slice(endIdx);
  return `${before}\n${newInner}\n    ${after}`;
}

const STATIC_PAGES = [
  "index.html",
  "aktualnosci.html",
  "dokumenty.html",
  "informacje.html",
  "kontakt.html",
  "mapa.html",
  "oplaty.html",
];

function syncFooter(footer) {
  for (const page of STATIC_PAGES) {
    const pagePath = path.join(ROOT, page);
    const html = fs.readFileSync(pagePath, "utf8");
    const updated = html.replace(/<footer>[\s\S]*?<\/footer>/, footer);
    if (updated !== html) {
      fs.writeFileSync(pagePath, updated, "utf8");
      console.log(`Zsynchronizowano stopkę w ${pagePath}`);
    }
  }
}

function main() {
  const items = readNewsItems();
  const header = fs.readFileSync(path.join(TEMPLATES_DIR, "_header.html"), "utf8").trim();
  const footer = fs.readFileSync(path.join(TEMPLATES_DIR, "_footer.html"), "utf8").trim();
  const articleTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "article.html"), "utf8");

  // 1) Wygeneruj pojedyncze strony aktualności
  for (const item of items) {
    const html = renderArticle(item, header, footer, articleTemplate);
    const outPath = path.join(ROOT, `aktualnosc-${item.slug}.html`);
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`Zapisano ${outPath}`);
  }

  // 2) Zaktualizuj pełną listę w aktualnosci.html
  const allCardsHtml = items.map(renderCard).join("\n");
  const aktualnosciPath = path.join(ROOT, "aktualnosci.html");
  let aktualnosciHtml = fs.readFileSync(aktualnosciPath, "utf8");
  aktualnosciHtml = replaceBetweenMarkers(aktualnosciHtml, "NEWS-LIST", allCardsHtml);
  fs.writeFileSync(aktualnosciPath, aktualnosciHtml, "utf8");
  console.log(`Zaktualizowano ${aktualnosciPath}`);

  // 3) Zaktualizuj wyróżnione karty na index.html (max 3, tylko featured)
  const featuredCardsHtml = items
    .filter((i) => i.featured)
    .slice(0, 3)
    .map(renderCard)
    .join("\n");
  const indexPath = path.join(ROOT, "index.html");
  let indexHtml = fs.readFileSync(indexPath, "utf8");
  indexHtml = replaceBetweenMarkers(indexHtml, "NEWS-FEATURED", featuredCardsHtml);
  fs.writeFileSync(indexPath, indexHtml, "utf8");
  console.log(`Zaktualizowano ${indexPath}`);

  // 4) Zsynchronizuj wspólną stopkę we wszystkich statycznych podstronach
  syncFooter(footer);
}

main();

import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "media");
const dataFile = path.join(root, "src", "data", "site-content.json");
const api = "https://poaestudio.com/wp-json/wp/v2";
const requestHeaders = { "User-Agent": "POA redesign content importer" };

const clean = (value = "") =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();

const decode = (value = "") => clean(cheerio.load(`<span>${value}</span>`)("span").text());

async function getJson(url) {
  const response = await fetch(url, { headers: requestHeaders });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function bestImage($element) {
  const candidates = [];
  const srcset = $element.attr("srcset") || $element.attr("data-srcset") || "";
  for (const candidate of srcset.split(",")) {
    const match = candidate.trim().match(/^(\S+)\s+(\d+)w$/);
    if (match) candidates.push({ url: match[1], width: Number(match[2]) });
  }
  const preferred = candidates
    .filter(({ width }) => width <= 1920)
    .sort((a, b) => b.width - a.width)[0];
  return (
    preferred?.url ||
    $element.closest("a").attr("href") ||
    $element.attr("data-lazy-src") ||
    $element.attr("src") ||
    ""
  );
}

function extractImages($, scope) {
  const seen = new Set();
  const result = [];
  scope.find("img").each((_, element) => {
    const $image = $(element);
    const rawUrl = bestImage($image);
    if (!rawUrl || rawUrl.includes("/plugins/visual-portfolio/") || !rawUrl.includes("poaestudio.com")) return;
    let url;
    try {
      url = new URL(rawUrl, "https://poaestudio.com").href;
    } catch {
      return;
    }
    if (!["http:", "https:"].includes(new URL(url).protocol)) return;
    if (seen.has(url)) return;
    seen.add(url);
    result.push({
      originalUrl: url,
      alt: clean($image.attr("alt") || ""),
      width: Number($image.attr("width")) || null,
      height: Number($image.attr("height")) || null,
    });
  });
  return result;
}

function extractBlocks($, scope) {
  const blocks = [];
  const seen = new Set();
  scope.find("h1,h2,h3,h4,p,li,blockquote,.elementor-widget-text-editor").each((_, element) => {
    const $element = $(element);
    if ($element.is(".elementor-widget-text-editor") && $element.find("h1,h2,h3,h4,p,li,blockquote").length) return;
    if ($element.is("p") && $element.closest("li,blockquote").length) return;
    const text = clean($element.text());
    if (!text || text.length < 2) return;
    const key = `${element.tagName}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    const tag = element.tagName?.toLowerCase();
    blocks.push({
      type: tag?.startsWith("h") ? "heading" : tag === "li" ? "list" : tag === "blockquote" ? "quote" : "text",
      level: tag?.startsWith("h") ? Number(tag.slice(1)) : null,
      text,
    });
  });
  return blocks;
}

function parseContent(html = "") {
  const $ = cheerio.load(html);
  let scopes = $("section.elementor-top-section").toArray();
  if (!scopes.length) scopes = [$("body").get(0)];

  const sections = scopes
    .map((element) => {
      const scope = $(element);
      return {
        blocks: extractBlocks($, scope),
        images: extractImages($, scope),
      };
    })
    .filter((section) => section.blocks.length || section.images.length);

  const gallery = extractImages($, $("body"));
  return { sections, gallery };
}

function featured(item) {
  const media = item?._embedded?.["wp:featuredmedia"]?.[0];
  if (!media?.source_url) return null;
  const sizes = media.media_details?.sizes || {};
  const preferred = sizes["1536x1536"] || sizes.large || sizes.full;
  return {
    originalUrl: preferred?.source_url || media.source_url,
    alt: decode(media.alt_text || media.caption?.rendered || ""),
    width: preferred?.width || media.media_details?.width || null,
    height: preferred?.height || media.media_details?.height || null,
  };
}

function normalizeItem(item, type, language) {
  const parsed = parseContent(item.content?.rendered || "");
  const hero = featured(item);
  const gallery = hero
    ? [hero, ...parsed.gallery.filter((image) => image.originalUrl !== hero.originalUrl)]
    : parsed.gallery;
  return {
    id: item.id,
    type,
    language,
    slug: item.slug,
    url: item.link,
    title: decode(item.title?.rendered || ""),
    excerpt: decode(item.excerpt?.rendered || ""),
    date: item.date || null,
    hero,
    gallery,
    sections: parsed.sections,
  };
}

async function fetchCollection(endpoint, lang) {
  const params = new URLSearchParams({
    per_page: "100",
    _embed: "1",
  });
  if (lang) params.set("lang", lang);
  return getJson(`${api}/${endpoint}?${params}`);
}

function assetName(url) {
  const parsed = new URL(url);
  const extension = path.extname(parsed.pathname).toLowerCase() || ".jpg";
  const base = path.basename(parsed.pathname, extension).replace(/[^a-z0-9-]+/gi, "-").slice(0, 52);
  const digest = crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
  return `${base}-${digest}${extension}`;
}

async function downloadImage(image) {
  if (!image?.originalUrl) return image;
  const name = assetName(image.originalUrl);
  const destination = path.join(outputDir, name);
  try {
    await fs.access(destination);
  } catch {
    try {
      const response = await fetch(image.originalUrl, { headers: requestHeaders });
      if (!response.ok) throw new Error(`${response.status}`);
      await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.warn(`Could not localize ${image.originalUrl}: ${error.message}`);
      return { ...image, src: "" };
    }
  }
  return { ...image, src: `/media/${name}` };
}

async function mapPool(values, worker, concurrency = 6) {
  const result = new Array(values.length);
  let index = 0;
  async function run() {
    while (index < values.length) {
      const current = index++;
      result[current] = await worker(values[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, run));
  return result;
}

async function localize(items) {
  const allImages = [];
  for (const item of items) {
    if (item.hero) allImages.push(item.hero);
    allImages.push(...item.gallery);
    for (const section of item.sections) allImages.push(...section.images);
  }
  const unique = [...new Map(allImages.map((image) => [image.originalUrl, image])).values()];
  const localized = await mapPool(unique, downloadImage);
  const lookup = new Map(localized.map((image) => [image.originalUrl, image]));
  return items.map((item) => ({
    ...item,
    hero: item.hero ? lookup.get(item.hero.originalUrl) : null,
    gallery: item.gallery.map((image) => lookup.get(image.originalUrl)),
    sections: item.sections.map((section) => ({
      ...section,
      images: section.images.map((image) => lookup.get(image.originalUrl)),
    })),
  }));
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(dataFile), { recursive: true });

const [rawEnglishPages, rawSpanishPages, rawEnglishProjects, rawSpanishProjects, rawPosts] = await Promise.all([
  fetchCollection("pages", "en"),
  fetchCollection("pages", "es"),
  fetchCollection("portfolio", "en"),
  fetchCollection("portfolio", "es"),
  fetchCollection("posts"),
]);

const all = [
  ...rawEnglishPages.map((item) => normalizeItem(item, "page", "en")),
  ...rawSpanishPages.map((item) => normalizeItem(item, "page", "es")),
  ...rawEnglishProjects.map((item) => normalizeItem(item, "project", "en")),
  ...rawSpanishProjects.map((item) => normalizeItem(item, "project", "es")),
  ...rawPosts.map((item) => normalizeItem(item, "post", "es")),
];
const localized = await localize(all);
const pages = localized.filter((item) => item.type === "page");
const projects = localized.filter((item) => item.type === "project");
const posts = localized.filter((item) => item.type === "post");

await fs.writeFile(
  dataFile,
  `${JSON.stringify(
    {
      source: "https://poaestudio.com",
      importedAt: new Date().toISOString(),
      counts: {
        pages: pages.length,
        projects: projects.length,
        posts: posts.length,
        en: {
          pages: pages.filter((item) => item.language === "en").length,
          projects: projects.filter((item) => item.language === "en").length,
        },
        es: {
          pages: pages.filter((item) => item.language === "es").length,
          projects: projects.filter((item) => item.language === "es").length,
          posts: posts.length,
        },
      },
      pages,
      projects,
      posts,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Imported ${pages.length} pages (${rawEnglishPages.length} EN, ${rawSpanishPages.length} ES), ` +
    `${projects.length} projects (${rawEnglishProjects.length} EN, ${rawSpanishProjects.length} ES), ` +
    `${posts.length} journal posts.`,
);
console.log(`Localized ${localized.length} entries and ${new Set(all.flatMap((item) => item.gallery.map((image) => image.originalUrl))).size} gallery assets.`);

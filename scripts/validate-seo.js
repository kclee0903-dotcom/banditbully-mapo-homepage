const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = "https://bandibuli-saejip.com";
const SKIP_DIRS = new Set([".git", "node_modules"]);
const htmlFiles = [];
const errors = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    if (entry.isFile() && filePath.endsWith(".html")) htmlFiles.push(filePath);
  }
}

function captures(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1].trim());
}

function requireOne(filePath, name, values) {
  if (values.length !== 1 || !values[0]) {
    errors.push(`${filePath}: ${name} must appear exactly once and be non-empty`);
    return "";
  }
  return values[0];
}

function requireAbsoluteUrl(filePath, name, value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      errors.push(`${filePath}: ${name} must use https`);
    }
  } catch {
    errors.push(`${filePath}: ${name} must be an absolute URL`);
  }
}

walk(".");

const canonicalByFile = new Map();
const indexableCanonicals = new Set();
const noindexCanonicals = new Set();

for (const filePath of htmlFiles) {
  const html = fs.readFileSync(filePath, "utf8");
  const titles = captures(html, /<title>([\s\S]*?)<\/title>/gi);
  const descriptions = captures(html, /<meta\s+name="description"\s+content="([^"]*)"\s*\/?\s*>/gi);
  const robotsValues = captures(html, /<meta\s+name="robots"\s+content="([^"]*)"\s*\/?\s*>/gi);
  const canonicals = captures(html, /<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?\s*>/gi);
  const ogTitles = captures(html, /<meta\s+property="og:title"\s+content="([^"]*)"\s*\/?\s*>/gi);
  const ogDescriptions = captures(html, /<meta\s+property="og:description"\s+content="([^"]*)"\s*\/?\s*>/gi);
  const ogUrls = captures(html, /<meta\s+property="og:url"\s+content="([^"]*)"\s*\/?\s*>/gi);
  const ogImages = captures(html, /<meta\s+property="og:image"\s+content="([^"]*)"\s*\/?\s*>/gi);

  const title = requireOne(filePath, "title", titles);
  const robots = requireOne(filePath, "robots meta", robotsValues);
  const isNoindex = /\bnoindex\b/i.test(robots);
  const isIndexable = /\bindex\b/i.test(robots) && !isNoindex;

  if (!title) continue;

  for (const block of captures(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block);
    } catch (error) {
      errors.push(`${filePath}: invalid JSON-LD (${error.message})`);
    }
  }

  if (isIndexable) {
    requireOne(filePath, "meta description", descriptions);
    const canonical = requireOne(filePath, "canonical", canonicals);
    requireOne(filePath, "og:title", ogTitles);
    requireOne(filePath, "og:description", ogDescriptions);
    const ogUrl = requireOne(filePath, "og:url", ogUrls);
    const ogImage = requireOne(filePath, "og:image", ogImages);

    if (canonical) {
      requireAbsoluteUrl(filePath, "canonical", canonical);
      if (!canonical.startsWith(`${SITE_ORIGIN}/`)) {
        errors.push(`${filePath}: canonical must use ${SITE_ORIGIN}`);
      }
      if (indexableCanonicals.has(canonical)) {
        errors.push(`${filePath}: duplicate canonical ${canonical}`);
      }
      indexableCanonicals.add(canonical);
      canonicalByFile.set(filePath, canonical);
    }

    if (ogUrl) {
      requireAbsoluteUrl(filePath, "og:url", ogUrl);
      if (canonical && canonical !== ogUrl) {
        errors.push(`${filePath}: canonical and og:url must match`);
      }
    }
    if (ogImage) requireAbsoluteUrl(filePath, "og:image", ogImage);
  }

  if (isNoindex && canonicals[0]) noindexCanonicals.add(canonicals[0]);
}

const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const sitemapUrls = new Set(captures(sitemap, /<loc>([^<]+)<\/loc>/gi));

for (const canonical of indexableCanonicals) {
  if (!sitemapUrls.has(canonical)) {
    errors.push(`sitemap.xml: missing indexable canonical ${canonical}`);
  }
}
for (const sitemapUrl of sitemapUrls) {
  if (!indexableCanonicals.has(sitemapUrl)) {
    errors.push(`sitemap.xml: URL is not an indexable canonical ${sitemapUrl}`);
  }
  if (noindexCanonicals.has(sitemapUrl)) {
    errors.push(`sitemap.xml: noindex URL must not be listed ${sitemapUrl}`);
  }
}

const homeHtml = fs.readFileSync("index.html", "utf8");
const jsonLdBlocks = captures(homeHtml, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi).map((block) => JSON.parse(block));
const organization = jsonLdBlocks.find((block) => block["@type"] === "Organization");
const faq = jsonLdBlocks.find((block) => block["@type"] === "FAQPage");

if (!organization) {
  errors.push("index.html: Organization JSON-LD is missing");
} else {
  for (const property of ["@id", "url", "logo", "image"]) {
    requireAbsoluteUrl("index.html Organization", property, organization[property] || "");
  }
  if (!Array.isArray(organization.sameAs) || !organization.sameAs.includes("https://blog.naver.com/kueeun")) {
    errors.push("index.html: Organization sameAs must include the kueeun Naver blog");
  }
}

if (!faq || !Array.isArray(faq.mainEntity)) {
  errors.push("index.html: FAQPage JSON-LD is missing or invalid");
} else {
  const visibleSummaries = new Set(captures(homeHtml, /<summary>([\s\S]*?)<\/summary>/gi).map((text) => text.replace(/<[^>]+>/g, "").trim()));
  for (const question of faq.mainEntity) {
    if (!visibleSummaries.has(question.name)) {
      errors.push(`index.html: FAQ question is not visible on the page: ${question.name}`);
    }
    if (!question.acceptedAnswer || !question.acceptedAnswer.text) {
      errors.push(`index.html: FAQ answer is missing: ${question.name}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`SEO validation passed: ${indexableCanonicals.size} indexable canonical pages, ${jsonLdBlocks.length} homepage JSON-LD blocks.`);

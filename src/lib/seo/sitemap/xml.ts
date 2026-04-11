import { SITEMAP_CACHE_CONTROL } from "@/lib/seo/sitemap/constants";
import type { SitemapUrlEntry } from "@/lib/seo/sitemap/types";

const FALLBACK_LOC = "https://classes360.online/";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ensureIsoDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function isValidAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePriority(value: number): number {
  if (!Number.isFinite(value)) return 0.7;
  return Math.max(0, Math.min(1, value));
}

function normalizeChangefreq(value: SitemapUrlEntry["changefreq"]): SitemapUrlEntry["changefreq"] {
  const allowed = new Set([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
  ]);

  return allowed.has(value) ? value : "weekly";
}

function sanitizeUrlEntries(urls: SitemapUrlEntry[]): SitemapUrlEntry[] {
  const unique = new Set<string>();
  const out: SitemapUrlEntry[] = [];

  for (const url of urls ?? []) {
    if (!url || typeof url.loc !== "string") continue;
    const loc = url.loc.trim();
    if (!loc || !isValidAbsoluteHttpUrl(loc) || unique.has(loc)) continue;

    unique.add(loc);
    out.push({
      loc,
      lastmod: ensureIsoDate(url.lastmod),
      changefreq: normalizeChangefreq(url.changefreq),
      priority: normalizePriority(url.priority),
    });
  }

  if (out.length) return out;

  return [
    {
      loc: FALLBACK_LOC,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1,
    },
  ];
}

function sanitizeSitemapUrls(sitemapUrls: string[]): string[] {
  const unique = new Set<string>();
  const validUrls: string[] = [];

  for (const item of sitemapUrls ?? []) {
    if (typeof item !== "string") continue;
    const loc = item.trim();
    if (!loc || !isValidAbsoluteHttpUrl(loc) || unique.has(loc)) continue;

    unique.add(loc);
    validUrls.push(loc);
  }

  return validUrls.length ? validUrls : [FALLBACK_LOC];
}

function normalizeXml(xml: string): string {
  let out = xml.trim();

  // Ensure a standard XML declaration
  if (!out.startsWith("<?xml")) {
    out = `<?xml version="1.0" encoding="UTF-8"?>\n${out}`;
  } else {
    out = out.replace(/<\?xml[^>]*\?>/, '<?xml version="1.0" encoding="UTF-8"?>');
  }

  // Normalize namespace attribute: xmlns = " url " -> xmlns="url"
  out = out.replace(/xmlns\s*=\s*"([^"]*)"/g, (_m, p1) => `xmlns="${p1.trim()}"`);

  // Remove stray spaces before closing bracket in tags: <url > -> <url>
  out = out.replace(/\s+>/g, ">");

  // Fix closing tags with extra spaces: </url > -> </url>
  out = out.replace(/<\/\s*([a-zA-Z0-9:_-]+)\s*>/g, "</$1>");

  return out;
}

export function buildUrlsetXml(urls: SitemapUrlEntry[]): string {
  const safeUrls = sanitizeUrlEntries(urls);
  const body = safeUrls
    .map(
      (url) => `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  return normalizeXml(xml);
}

export function buildSitemapIndexXml(sitemapUrls: string[], lastmodIso: string): string {
  const safeSitemapUrls = sanitizeSitemapUrls(sitemapUrls);
  const safeLastmod = ensureIsoDate(lastmodIso);
  const body = safeSitemapUrls
    .map(
      (loc) =>
        `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(safeLastmod)}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
  return normalizeXml(xml);
}

export function xmlResponse(xml: string, status = 200): Response {
  const body = xml.trim();
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

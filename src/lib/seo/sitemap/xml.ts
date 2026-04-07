import { SITEMAP_CACHE_CONTROL } from "@/lib/seo/sitemap/constants";
import type { SitemapUrlEntry } from "@/lib/seo/sitemap/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
  const body = urls
    .map(
      (url) => `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  return normalizeXml(xml);
}

export function buildSitemapIndexXml(sitemapUrls: string[], lastmodIso: string): string {
  const body = sitemapUrls
    .map(
      (loc) =>
        `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmodIso)}</lastmod>\n  </sitemap>`,
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
    },
  });
}

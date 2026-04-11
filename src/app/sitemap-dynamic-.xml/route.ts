import { BASE_URL } from "@/lib/seo/sitemap/constants";
import { buildUrlsetXml, xmlResponse } from "@/lib/seo/sitemap/xml";

export function GET(): Response {
  const xml = buildUrlsetXml([
    {
      loc: `${BASE_URL}/`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1,
    },
  ]);

  return xmlResponse(xml, 404);
}

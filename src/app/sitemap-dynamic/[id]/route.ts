import { BASE_URL } from "@/lib/seo/sitemap/constants";
import { getDynamicSitemapChunk } from "@/lib/seo/sitemap/data";
import { buildUrlsetXml, xmlResponse } from "@/lib/seo/sitemap/xml";

type RouteContext = {
  params: { id?: string } | Promise<{ id?: string }>;
};

function parseChunkId(idParam?: string): number | null {
  if (idParam == null) return 0;
  if (!/^\d+$/.test(idParam)) return null;

  const parsed = Number.parseInt(idParam, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function fallbackSitemapXml(): string {
  return buildUrlsetXml([
    {
      loc: `${BASE_URL}/`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1,
    },
  ]);
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params;
  const chunkId = parseChunkId(params?.id);

  if (chunkId == null) {
    return xmlResponse(fallbackSitemapXml(), 404);
  }

  try {
    const chunkEntries = await getDynamicSitemapChunk(chunkId);
    if (!chunkEntries.length) {
      return xmlResponse(fallbackSitemapXml());
    }

    const xml = buildUrlsetXml(chunkEntries);
    return xmlResponse(xml);
  } catch {
    return xmlResponse(fallbackSitemapXml());
  }
}

import {
  getDynamicSitemapEntries,
  getStaticSitemapEntries,
} from "@/lib/seo/sitemap/data";
import type { SitemapUrlEntry } from "@/lib/seo/sitemap/types";
import { buildUrlsetXml, xmlResponse } from "@/lib/seo/sitemap/xml";

function mergeUniqueEntries(entries: SitemapUrlEntry[]): SitemapUrlEntry[] {
  const byLoc = new Map<string, SitemapUrlEntry>();

  for (const entry of entries) {
    if (!entry?.loc) continue;
    byLoc.set(entry.loc, entry);
  }

  return [...byLoc.values()];
}

export async function GET(): Promise<Response> {
  try {
    const [staticEntries, dynamicEntries] = await Promise.all([
      Promise.resolve(getStaticSitemapEntries()),
      getDynamicSitemapEntries(),
    ]);

    const mergedEntries = mergeUniqueEntries([...staticEntries, ...dynamicEntries]);
    const xml = buildUrlsetXml(mergedEntries);
    return xmlResponse(xml);
  } catch {
    const fallbackXml = buildUrlsetXml(getStaticSitemapEntries());
    return xmlResponse(fallbackXml);
  }
}

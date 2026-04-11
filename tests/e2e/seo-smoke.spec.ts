import { expect, test } from "@playwright/test";

test("robots.txt is reachable", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("Sitemap:");
});

test("sitemap.xml is reachable", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/xml");
    const body = await response.text();
    expect(body).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    expect(body).toContain("<urlset");
    expect(body).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
});

test("dynamic sitemap chunk is valid XML", async ({ request }) => {
    const response = await request.get("/sitemap-dynamic-0.xml");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/xml");

    const body = await response.text();
    expect(body.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
    expect(body).toContain("<urlset");
    expect(body).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(body).not.toContain("<html");
});

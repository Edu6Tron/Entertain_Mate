import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("standalone HTML companion", () => {
  const html = readFileSync(resolve(process.cwd(), "client/public/companion.html"), "utf8");

  it("ships the declared themes and browser-local watchlist controls", () => {
    expect(html).toContain('value="paper"');
    expect(html).toContain('value="midnight"');
    expect(html).toContain('value="noir"');
    expect(html).toContain("localStorage");
    expect(html).toContain("crypto.randomUUID()");
    expect(html).toContain("Export local list");
  });

  it("does not embed production secrets or private import integrations", () => {
    expect(html).not.toContain("TMDB_API_KEY");
    expect(html).not.toContain("OMDB_API_KEY");
    expect(html).not.toContain("DATABASE_URL");
    expect(html).not.toContain("extension/import");
    expect(html).toContain("no Google, Brave, database, or account connection");
  });
});

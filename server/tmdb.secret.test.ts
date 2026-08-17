import { describe, expect, it } from "vitest";

describe("TMDb server credential", () => {
  it("authorizes a lightweight configuration request", async () => {
    const apiKey = process.env.TMDB_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey ?? "")}`,
      { headers: { accept: "application/json" } }
    );

    expect(response.ok).toBe(true);
    const body = await response.json() as { images?: { secure_base_url?: string } };
    expect(body.images?.secure_base_url).toMatch(/^https:\/\//);
  });
});

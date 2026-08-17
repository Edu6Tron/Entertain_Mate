import { afterEach, describe, expect, it, vi } from "vitest";
import { findTmdbMatch } from "./tmdb";

const originalKey = process.env.TMDB_API_KEY;

afterEach(() => {
  process.env.TMDB_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

describe("TMDb title matching", () => {
  it("normalizes a television result into the approved Web Series label and poster URL", async () => {
    process.env.TMDB_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: 991, media_type: "tv", name: "Dhootha", first_air_date: "2023-12-01", poster_path: "/poster.jpg" }],
      }),
    }));

    await expect(findTmdbMatch("Dhootha")).resolves.toEqual({
      tmdbId: 991,
      title: "Dhootha",
      mediaType: "Web Series",
      releaseYear: "2023",
      posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
  });

  it("does not attempt a network match for an unusably short query", async () => {
    process.env.TMDB_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(findTmdbMatch("x")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

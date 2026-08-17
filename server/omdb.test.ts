import { afterEach, describe, expect, it, vi } from "vitest";
import { findOmdbImdbRating } from "./omdb";

const originalKey = process.env.OMDB_API_KEY;

afterEach(() => {
  process.env.OMDB_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

describe("OMDb IMDb rating enrichment", () => {
  it("does not send any title query when an OMDb key is not configured", async () => {
    delete process.env.OMDB_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(findOmdbImdbRating("Kantara", "2022")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts only a source-provided numeric IMDb rating", async () => {
    process.env.OMDB_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Response: "True", imdbRating: "8.3" }) }));

    await expect(findOmdbImdbRating("Kantara", "2022")).resolves.toBe("8.3");
  });
});

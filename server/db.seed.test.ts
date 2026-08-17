import { describe, expect, it } from "vitest";
import { HISTORICAL_ENTRIES, MEDIA_TYPES, WATCH_STATUSES } from "./db";

describe("historical watchlist seed", () => {
  it("keeps the verified June 2026 titles separate from the undated Archive", () => {
    const juneTitles = HISTORICAL_ENTRIES.filter(entry => entry.monthYear === "2026-06");
    const archivedTitles = HISTORICAL_ENTRIES.filter(entry => entry.monthYear === null);

    expect(juneTitles.map(entry => entry.title)).toEqual([
      "Naa Saami Ranga",
      "Bawaal",
      "Thirteen",
      "13 Thirteen",
      "Tinker Tailor Soldier Spy",
    ]);
    expect(archivedTitles).toHaveLength(HISTORICAL_ENTRIES.length - juneTitles.length);
    expect(archivedTitles.length).toBeGreaterThan(0);
  });

  it("uses only the app's exact media and watch-status vocabulary", () => {
    expect(MEDIA_TYPES).toEqual(["Movie", "Web Series", "Short Film"]);
    expect(WATCH_STATUSES).toEqual(["Want to Watch", "Watching", "Watched"]);
    expect(HISTORICAL_ENTRIES.every(entry => MEDIA_TYPES.includes(entry.mediaType))).toBe(true);
  });
});


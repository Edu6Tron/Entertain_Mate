import { describe, expect, it } from "vitest";
import { getMonthKeys, matchesWatchlistFilters } from "../client/src/lib/watchlistFilters";

const entry = {
  title: "A short story",
  notes: null,
  mediaType: "Short Film",
  watchStatus: "Want to Watch",
  genres: "Drama | Mystery",
  monthYear: "2026-08",
};

describe("enriched watchlist filters", () => {
  it("filters an enriched title by exact type, drama category, and month", () => {
    expect(matchesWatchlistFilters(entry, { searchQuery: "", typeFilter: "Short Film", statusFilter: "all", genreFilter: "Drama", monthFilter: "2026-08" })).toBe(true);
    expect(matchesWatchlistFilters(entry, { searchQuery: "", typeFilter: "Web Series", statusFilter: "all", genreFilter: "Drama", monthFilter: "2026-08" })).toBe(false);
    expect(matchesWatchlistFilters(entry, { searchQuery: "", typeFilter: "all", statusFilter: "all", genreFilter: "Drama", monthFilter: "2026-06" })).toBe(false);
  });

  it("sorts explicit month keys newest first and omits the undated Archive", () => {
    expect(getMonthKeys([entry, { ...entry, monthYear: "2026-06" }, { ...entry, monthYear: null }])).toEqual(["2026-08", "2026-06"]);
  });
});

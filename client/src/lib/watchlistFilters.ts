export type WatchlistFilterEntry = {
  title: string;
  notes: string | null;
  mediaType: string;
  watchStatus: string;
  genres: string | null;
  monthYear: string | null;
};

export type WatchlistFilters = {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  genreFilter: string;
  monthFilter: string;
};

export function matchesWatchlistFilters(entry: WatchlistFilterEntry, filters: WatchlistFilters) {
  const query = filters.searchQuery.trim().toLowerCase();
  return (!query || entry.title.toLowerCase().includes(query) || (entry.notes ?? "").toLowerCase().includes(query)) &&
    (filters.typeFilter === "all" || entry.mediaType === filters.typeFilter) &&
    (filters.statusFilter === "all" || entry.watchStatus === filters.statusFilter) &&
    (filters.genreFilter === "all" || (entry.genres ?? "").split(" | ").includes(filters.genreFilter)) &&
    (filters.monthFilter === "all" || entry.monthYear === filters.monthFilter);
}

export function getCategoryLabels(entries: WatchlistFilterEntry[]) {
  return Array.from(new Set(entries.flatMap(entry => (entry.genres ?? "").split(" | ").filter(Boolean)))).sort();
}

export function getMonthKeys(entries: WatchlistFilterEntry[]) {
  return Array.from(new Set(entries.map(entry => entry.monthYear).filter((month): month is string => Boolean(month)))).sort().reverse();
}

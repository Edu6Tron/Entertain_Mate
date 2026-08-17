import { MEDIA_TYPES, type MediaType } from "./db";

type TmdbSearchResult = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbSearchResponse = { results?: TmdbSearchResult[] };

export type TmdbMatch = {
  tmdbId: number;
  title: string;
  mediaType: MediaType;
  releaseYear: string | null;
  posterUrl: string | null;
};

export async function findTmdbMatch(query: string): Promise<TmdbMatch | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || query.trim().length < 2) return null;

  const endpoint = new URL("https://api.themoviedb.org/3/search/multi");
  endpoint.searchParams.set("api_key", apiKey);
  endpoint.searchParams.set("query", query.trim());
  endpoint.searchParams.set("include_adult", "false");

  const response = await fetch(endpoint, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("TMDb title matching is unavailable");

  const payload = await response.json() as TmdbSearchResponse;
  const match = payload.results?.find(result => result.media_type === "movie" || result.media_type === "tv");
  if (!match) return null;

  const title = match.title ?? match.name;
  if (!title) return null;

  const date = match.release_date ?? match.first_air_date ?? "";
  return {
    tmdbId: match.id,
    title,
    mediaType: match.media_type === "tv" ? MEDIA_TYPES[1] : MEDIA_TYPES[0],
    releaseYear: /^\d{4}/.test(date) ? date.slice(0, 4) : null,
    posterUrl: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
  };
}

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
type TmdbDetailsResponse = { genres?: Array<{ name?: string }>; runtime?: number | null };

export type TmdbMatch = {
  tmdbId: number;
  title: string;
  mediaType: MediaType;
  releaseYear: string | null;
  posterUrl: string | null;
  genres: string[];
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
  const detailEndpoint = new URL(`https://api.themoviedb.org/3/${match.media_type}/${match.id}`);
  detailEndpoint.searchParams.set("api_key", apiKey);
  const detailResponse = await fetch(detailEndpoint, { headers: { accept: "application/json" } });
  const details = detailResponse.ok ? await detailResponse.json() as TmdbDetailsResponse : {};

  const mediaType: MediaType = match.media_type === "tv" ? MEDIA_TYPES[1] : details.runtime !== null && details.runtime !== undefined && details.runtime <= 45 ? MEDIA_TYPES[2] : MEDIA_TYPES[0];

  return {
    tmdbId: match.id,
    title,
    mediaType,
    releaseYear: /^\d{4}/.test(date) ? date.slice(0, 4) : null,
    posterUrl: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
    genres: (details.genres ?? []).map(genre => genre.name?.trim()).filter((genre): genre is string => Boolean(genre)),
  };
}

export async function findOmdbImdbRating(title: string, releaseYear?: string | null): Promise<string | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !title.trim()) return null;

  const endpoint = new URL("https://www.omdbapi.com/");
  endpoint.searchParams.set("apikey", apiKey);
  endpoint.searchParams.set("t", title.trim());
  if (releaseYear) endpoint.searchParams.set("y", releaseYear);

  try {
    const response = await fetch(endpoint, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json() as { Response?: string; imdbRating?: string };
    if (payload.Response !== "True" || !payload.imdbRating || payload.imdbRating === "N/A") return null;
    const rating = Number(payload.imdbRating);
    return Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating.toFixed(1) : null;
  } catch {
    return null;
  }
}

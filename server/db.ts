import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  watchlistEntries,
  watchlistExtensionTokens,
  watchlistSeedStates,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { findTmdbMatch } from "./tmdb";

let _db: ReturnType<typeof drizzle> | null = null;

export const MEDIA_TYPES = ["Movie", "Web Series", "Short Film"] as const;
export const WATCH_STATUSES = ["Want to Watch", "Watching", "Watched"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export type CreateWatchlistEntryInput = {
  title: string;
  mediaType: MediaType;
  watchStatus: WatchStatus;
  monthYear: string;
  notes?: string | null;
};

export type UpdateWatchlistEntryInput = {
  title?: string;
  mediaType?: MediaType;
  watchStatus?: WatchStatus;
  monthYear?: string;
  notes?: string | null;
};

const hashExtensionToken = (token: string) => createHash("sha256").update(token).digest("hex");

const HISTORICAL_ENTRIES: Array<{
  title: string;
  mediaType: MediaType;
  monthYear: string | null;
}> = [
  { title: "Naa Saami Ranga", mediaType: "Movie", monthYear: "2026-06" },
  { title: "Bawaal", mediaType: "Movie", monthYear: "2026-06" },
  { title: "Thirteen", mediaType: "Movie", monthYear: "2026-06" },
  { title: "13 Thirteen", mediaType: "Movie", monthYear: "2026-06" },
  { title: "Tinker Tailor Soldier Spy", mediaType: "Movie", monthYear: "2026-06" },
  { title: "Akira", mediaType: "Movie", monthYear: null },
  { title: "Antony", mediaType: "Movie", monthYear: null },
  { title: "Arinthum Ariyamalum", mediaType: "Movie", monthYear: null },
  { title: "Athiradi", mediaType: "Movie", monthYear: null },
  { title: "Boiler Room", mediaType: "Movie", monthYear: null },
  { title: "Boyz", mediaType: "Movie", monthYear: null },
  { title: "Charlie Bartlett", mediaType: "Movie", monthYear: null },
  { title: "De Dhakka", mediaType: "Movie", monthYear: null },
  { title: "Deool", mediaType: "Movie", monthYear: null },
  { title: "Devs", mediaType: "Web Series", monthYear: null },
  { title: "Dhootha", mediaType: "Web Series", monthYear: null },
  { title: "Gatta Kusthi", mediaType: "Movie", monthYear: null },
  { title: "Guru", mediaType: "Movie", monthYear: null },
  { title: "Her", mediaType: "Movie", monthYear: null },
  { title: "Hotspot", mediaType: "Web Series", monthYear: null },
  { title: "Jigarthanda DoubleX", mediaType: "Movie", monthYear: null },
  { title: "Kaantha", mediaType: "Movie", monthYear: null },
  { title: "Kantara", mediaType: "Movie", monthYear: null },
  { title: "Kantara: Chapter 1", mediaType: "Movie", monthYear: null },
  { title: "King of Kotha", mediaType: "Movie", monthYear: null },
  { title: "MAD", mediaType: "Movie", monthYear: null },
  { title: "Rocky", mediaType: "Movie", monthYear: null },
  { title: "Safia Safdar", mediaType: "Short Film", monthYear: null },
  { title: "Seven", mediaType: "Movie", monthYear: null },
  { title: "Shehzada", mediaType: "Movie", monthYear: null },
  { title: "The Apprentice", mediaType: "Movie", monthYear: null },
  { title: "Uppena", mediaType: "Movie", monthYear: null },
  { title: "Yashoda", mediaType: "Movie", monthYear: null },
  { title: "Yodha", mediaType: "Movie", monthYear: null },
  { title: "Zero", mediaType: "Movie", monthYear: null },
];

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };

  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function ensureHistoricalEntries(userId: number) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const state = await db
    .select({ userId: watchlistSeedStates.userId })
    .from(watchlistSeedStates)
    .where(eq(watchlistSeedStates.userId, userId))
    .limit(1);

  if (state.length > 0) return;

  await db.transaction(async tx => {
    const confirmedState = await tx
      .select({ userId: watchlistSeedStates.userId })
      .from(watchlistSeedStates)
      .where(eq(watchlistSeedStates.userId, userId))
      .limit(1);

    if (confirmedState.length > 0) return;

    await tx.insert(watchlistEntries).values(
      HISTORICAL_ENTRIES.map(entry => ({
        userId,
        ...entry,
        watchStatus: "Want to Watch" as const,
      }))
    );
    await tx.insert(watchlistSeedStates).values({ userId });
  });
}

export async function listWatchlistEntries(userId: number) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  await ensureHistoricalEntries(userId);
  return db
    .select()
    .from(watchlistEntries)
    .where(eq(watchlistEntries.userId, userId))
    .orderBy(desc(watchlistEntries.monthYear), asc(watchlistEntries.title));
}

export async function createWatchlistEntry(userId: number, input: CreateWatchlistEntryInput) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  await db.insert(watchlistEntries).values({ userId, ...input });
  return { success: true as const };
}

export async function updateWatchlistEntry(
  userId: number,
  entryId: number,
  input: UpdateWatchlistEntryInput
) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const result = await db
    .update(watchlistEntries)
    .set(input)
    .where(and(eq(watchlistEntries.id, entryId), eq(watchlistEntries.userId, userId)));

  return { success: result[0].affectedRows > 0 };
}

export async function deleteWatchlistEntry(userId: number, entryId: number) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const result = await db
    .delete(watchlistEntries)
    .where(and(eq(watchlistEntries.id, entryId), eq(watchlistEntries.userId, userId)));

  return { success: result[0].affectedRows > 0 };
}

export async function createExtensionToken(userId: number) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const token = randomBytes(32).toString("base64url");
  await db.insert(watchlistExtensionTokens).values({
    userId,
    tokenHash: hashExtensionToken(token),
    tokenHint: token.slice(-8),
    browser: "Brave",
  });
  return { token, tokenHint: token.slice(-8) };
}

export async function revokeExtensionToken(userId: number, tokenHint: string) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  await db
    .update(watchlistExtensionTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(watchlistExtensionTokens.userId, userId), eq(watchlistExtensionTokens.tokenHint, tokenHint)));
  return { success: true as const };
}

export async function getExtensionTokenOwner(token: string) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  const tokenHash = hashExtensionToken(token);
  const result = await db
    .select({ id: watchlistExtensionTokens.id, userId: watchlistExtensionTokens.userId })
    .from(watchlistExtensionTokens)
    .where(and(eq(watchlistExtensionTokens.tokenHash, tokenHash), isNull(watchlistExtensionTokens.revokedAt)))
    .limit(1);

  const record = result[0];
  if (!record) return null;
  await db.update(watchlistExtensionTokens).set({ lastUsedAt: new Date() }).where(eq(watchlistExtensionTokens.id, record.id));
  return record.userId;
}

export async function importExtensionQueries(userId: number, rawQueries: string[]) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  await ensureHistoricalEntries(userId);
  const queries = Array.from(new Set(rawQueries.map(query => query.trim()).filter(query => query.length >= 2 && query.length <= 255))).slice(0, 50);
  let imported = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const query of queries) {
    const existing = await db
      .select({ id: watchlistEntries.id })
      .from(watchlistEntries)
      .where(and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.sourceQuery, query)))
      .limit(1);
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const match = await findTmdbMatch(query);
    if (!match) {
      unmatched += 1;
      continue;
    }

    await db.insert(watchlistEntries).values({
      userId,
      title: match.title,
      mediaType: match.mediaType,
      watchStatus: "Want to Watch",
      monthYear: new Date().toISOString().slice(0, 7),
      tmdbId: match.tmdbId,
      posterUrl: match.posterUrl,
      releaseYear: match.releaseYear,
      sourceQuery: query,
      sourceKind: "Brave search import",
      moctaleUrl: "https://www.moctale.in/",
    });
    imported += 1;
  }

  return { imported, skipped, unmatched, received: queries.length };
}

export async function enrichWatchlistEntries(userId: number) {
  const db = getDb();
  if (!db) throw new Error("Database is not available");

  await ensureHistoricalEntries(userId);
  const entries = await db
    .select({ id: watchlistEntries.id, title: watchlistEntries.title, tmdbId: watchlistEntries.tmdbId })
    .from(watchlistEntries)
    .where(and(eq(watchlistEntries.userId, userId), isNull(watchlistEntries.tmdbId)))
    .limit(50);

  let enriched = 0;
  let unmatched = 0;
  for (const entry of entries) {
    const match = await findTmdbMatch(entry.title);
    if (!match) {
      unmatched += 1;
      continue;
    }
    await db
      .update(watchlistEntries)
      .set({
        tmdbId: match.tmdbId,
        posterUrl: match.posterUrl,
        releaseYear: match.releaseYear,
        mediaType: match.mediaType,
        sourceKind: "TMDb enrichment",
      })
      .where(and(eq(watchlistEntries.id, entry.id), eq(watchlistEntries.userId, userId)));
    enriched += 1;
  }
  return { examined: entries.length, enriched, unmatched };
}

export { HISTORICAL_ENTRIES };

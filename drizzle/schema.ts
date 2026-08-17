import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const watchlistEntries = mysqlTable(
  "watchlistEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    mediaType: mysqlEnum("mediaType", ["Movie", "Web Series", "Short Film"]).notNull(),
    watchStatus: mysqlEnum("watchStatus", ["Want to Watch", "Watching", "Watched"])
      .notNull()
      .default("Want to Watch"),
    monthYear: varchar("monthYear", { length: 7 }),
    notes: text("notes"),
    tmdbId: int("tmdbId"),
    posterUrl: text("posterUrl"),
    imdbRating: decimal("imdbRating", { precision: 3, scale: 1 }),
    releaseYear: varchar("releaseYear", { length: 4 }),
    sourceQuery: varchar("sourceQuery", { length: 255 }),
    sourceKind: varchar("sourceKind", { length: 64 }),
    moctaleUrl: varchar("moctaleUrl", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("watchlist_user_month_idx").on(table.userId, table.monthYear),
    index("watchlist_user_title_idx").on(table.userId, table.title),
    index("watchlist_user_source_query_idx").on(table.userId, table.sourceQuery),
  ]
);

export const watchlistExtensionTokens = mysqlTable(
  "watchlistExtensionTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    tokenHint: varchar("tokenHint", { length: 10 }).notNull(),
    browser: varchar("browser", { length: 32 }).notNull().default("Brave"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
    revokedAt: timestamp("revokedAt"),
  },
  table => [
    uniqueIndex("watchlist_extension_token_hash_unique").on(table.tokenHash),
    index("watchlist_extension_user_idx").on(table.userId),
  ]
);

export const watchlistSeedStates = mysqlTable("watchlistSeedStates", {
  userId: int("userId")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  seededAt: timestamp("seededAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WatchlistEntry = typeof watchlistEntries.$inferSelect;
export type InsertWatchlistEntry = typeof watchlistEntries.$inferInsert;

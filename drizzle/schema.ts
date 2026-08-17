import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("watchlist_user_month_idx").on(table.userId, table.monthYear),
    index("watchlist_user_title_idx").on(table.userId, table.title),
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

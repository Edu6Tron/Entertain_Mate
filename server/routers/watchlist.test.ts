import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../db", () => ({
  MEDIA_TYPES: ["Movie", "Web Series", "Short Film"],
  WATCH_STATUSES: ["Want to Watch", "Watching", "Watched"],
  createWatchlistEntry: mocks.create,
  deleteWatchlistEntry: mocks.delete,
  listWatchlistEntries: mocks.list,
  updateWatchlistEntry: mocks.update,
}));

import { appRouter } from "../routers";
import { watchlistValidation } from "./watchlist";

function contextFor(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: "Watchlist owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("watchlist validation", () => {
  it("accepts only the exact requested type and status labels", () => {
    const result = watchlistValidation.createInput.parse({
      title: "A new discovery",
      mediaType: "Short Film",
      watchStatus: "Want to Watch",
      monthYear: "2026-06",
      notes: null,
    });

    expect(result.mediaType).toBe("Short Film");
    expect(result.watchStatus).toBe("Want to Watch");
    expect(() => watchlistValidation.createInput.parse({
      title: "Invalid label",
      mediaType: "Documentary",
      watchStatus: "Queued",
      monthYear: "2026-06",
    })).toThrow();
  });

  it("requires a valid year-month value", () => {
    expect(() => watchlistValidation.createInput.parse({
      title: "A title",
      mediaType: "Movie",
      watchStatus: "Watching",
      monthYear: "June 2026",
    })).toThrow();
  });
});

describe("watchlist protected operations", () => {
  it("sends every create, update, and delete through the signed-in user's id", async () => {
    mocks.create.mockResolvedValue({ success: true });
    mocks.update.mockResolvedValue({ success: true });
    mocks.delete.mockResolvedValue({ success: true });
    const firstOwner = appRouter.createCaller(contextFor(41));
    const otherOwner = appRouter.createCaller(contextFor(72));

    await firstOwner.watchlist.create({
      title: "Private title",
      mediaType: "Movie",
      watchStatus: "Want to Watch",
      monthYear: "2026-06",
      notes: null,
    });
    await firstOwner.watchlist.update({ id: 88, watchStatus: "Watched" });
    await firstOwner.watchlist.update({ id: 88, notes: "A private reminder" });
    await otherOwner.watchlist.delete({ id: 88 });

    expect(mocks.create).toHaveBeenCalledWith(41, expect.objectContaining({ title: "Private title" }));
    expect(mocks.update).toHaveBeenCalledWith(41, 88, { watchStatus: "Watched" });
    expect(mocks.update).toHaveBeenCalledWith(41, 88, { notes: "A private reminder" });
    expect(mocks.delete).toHaveBeenCalledWith(72, 88);
  });
});

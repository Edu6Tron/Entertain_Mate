import { describe, expect, it } from "vitest";
import { isLikelyEntertainmentQuery } from "../brave-extension/query-filter.js";

describe("local Brave entertainment query filter", () => {
  it("allows explicit entertainment searches and known bare titles", () => {
    expect(isLikelyEntertainmentQuery("Kantara")).toBe(true);
    expect(isLikelyEntertainmentQuery("best Telugu movie 2026")).toBe(true);
    expect(isLikelyEntertainmentQuery("Dhootha trailer")).toBe(true);
  });

  it("blocks unrelated personal and general searches before synchronization", () => {
    expect(isLikelyEntertainmentQuery("weather in Delhi")).toBe(false);
    expect(isLikelyEntertainmentQuery("gmail login")).toBe(false);
    expect(isLikelyEntertainmentQuery("bank account balance")).toBe(false);
  });
});


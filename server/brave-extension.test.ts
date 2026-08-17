import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Manifest = { manifest_version: number; permissions: string[]; host_permissions: string[] };

describe("Brave extension privacy boundary", () => {
  it("requests only local history and storage capabilities, with dashboard-only hosts", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "brave-extension/manifest.json"), "utf8")
    ) as Manifest;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(["history", "storage"]);
    expect(manifest.host_permissions).toEqual([
      "https://*.manus.computer/*",
      "https://*.manus.space/*",
    ]);
  });
});

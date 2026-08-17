import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwner: vi.fn(),
  importQueries: vi.fn(),
}));

vi.mock("../db", () => ({
  getExtensionTokenOwner: mocks.getOwner,
  importExtensionQueries: mocks.importQueries,
}));

import { registerExtensionImportRoute } from "./extensionImport";

let server: Server;
let baseUrl = "";

beforeEach(async () => {
  mocks.getOwner.mockReset();
  mocks.importQueries.mockReset();
  const app = express();
  app.use(express.json());
  registerExtensionImportRoute(app);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("Brave extension import endpoint", () => {
  it("rejects missing tokens without importing any history-derived query", async () => {
    const response = await fetch(`${baseUrl}/api/extension/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ queries: ["Kantara"] }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getOwner).not.toHaveBeenCalled();
    expect(mocks.importQueries).not.toHaveBeenCalled();
  });

  it("uses the token owner as the only import target and permits extension CORS headers", async () => {
    mocks.getOwner.mockResolvedValue(41);
    mocks.importQueries.mockResolvedValue({ received: 1, imported: 1, skipped: 0, unmatched: 0 });

    const response = await fetch(`${baseUrl}/api/extension/import`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Entertain-Mate-Token": "private-extension-token" },
      body: JSON.stringify({ queries: ["Kantara trailer"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(mocks.getOwner).toHaveBeenCalledWith("private-extension-token");
    expect(mocks.importQueries).toHaveBeenCalledWith(41, ["Kantara trailer"]);
    await expect(response.json()).resolves.toMatchObject({ imported: 1 });
  });
});

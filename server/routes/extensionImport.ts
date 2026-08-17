import type { Express, Request, Response } from "express";
import { getExtensionTokenOwner, importExtensionQueries } from "../db";

function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Entertain-Mate-Token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export function registerExtensionImportRoute(app: Express) {
  app.options("/api/extension/import", (_req, res) => {
    setCors(res);
    res.status(204).end();
  });

  app.post("/api/extension/import", async (req: Request, res: Response) => {
    setCors(res);
    const token = req.header("X-Entertain-Mate-Token");
    if (!token) return res.status(401).json({ error: "Extension token is required" });

    const queries = req.body?.queries;
    if (!Array.isArray(queries) || queries.some(query => typeof query !== "string")) {
      return res.status(400).json({ error: "Provide an array of search queries" });
    }

    try {
      const userId = await getExtensionTokenOwner(token);
      if (!userId) return res.status(401).json({ error: "Extension token is invalid or revoked" });
      return res.json(await importExtensionQueries(userId, queries));
    } catch (error) {
      console.error("[Extension import] Failed:", error);
      return res.status(502).json({ error: "Title matching is temporarily unavailable" });
    }
  });
}

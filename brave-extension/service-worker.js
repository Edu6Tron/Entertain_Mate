import { isLikelyEntertainmentQuery } from "./query-filter.js";

const SETTINGS_KEY = "settings";
const PENDING_KEY = "pendingQueries";

function queryFromGoogleUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const isGoogleSearch = /^([a-z]+\.)?google\.[a-z.]+$/i.test(url.hostname) && url.pathname === "/search";
    if (!isGoogleSearch) return null;
    const query = url.searchParams.get("q")?.trim();
    return query && query.length >= 2 ? query : null;
  } catch {
    return null;
  }
}

async function syncQueries(queries) {
  const { [SETTINGS_KEY]: settings } = await chrome.storage.local.get(SETTINGS_KEY);
  if (!settings?.dashboardUrl || !settings?.token || !settings?.liveCapture) return;
  const eligibleQueries = queries.filter(isLikelyEntertainmentQuery);
  if (eligibleQueries.length === 0) return { received: 0, blockedLocally: queries.length };
  const url = new URL("/api/extension/import", settings.dashboardUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Entertain-Mate-Token": settings.token },
    body: JSON.stringify({ queries: eligibleQueries }),
  });
  if (!response.ok) throw new Error("Entertain_Mate could not accept this import");
  const result = await response.json();
  await chrome.storage.local.set({ lastSync: { at: Date.now(), result } });
  return result;
}

async function queueQueries(queries) {
  const eligibleQueries = queries.filter(isLikelyEntertainmentQuery);
  const { [PENDING_KEY]: pending = [] } = await chrome.storage.local.get(PENDING_KEY);
  const next = Array.from(new Set([...pending, ...eligibleQueries])).slice(-200);
  await chrome.storage.local.set({ [PENDING_KEY]: next });
  return { added: Math.max(0, next.length - pending.length), pending: next };
}

chrome.history.onVisited.addListener(async item => {
  const query = queryFromGoogleUrl(item.url);
  if (!query) return;
  try {
    const { [SETTINGS_KEY]: settings } = await chrome.storage.local.get(SETTINGS_KEY);
    if (settings?.liveCapture) await syncQueries([query]);
    else await queueQueries([query]);
  } catch (error) {
    console.warn("Entertain_Mate live import skipped", error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "backfill") return;
  (async () => {
    const startTime = message.days ? Date.now() - message.days * 24 * 60 * 60 * 1000 : 0;
    const items = await chrome.history.search({ text: "", startTime, maxResults: 5000 });
    const queries = Array.from(new Set(items.map(item => queryFromGoogleUrl(item.url)).filter(Boolean)));
    const queued = await queueQueries(queries);
    sendResponse({ ok: true, found: queries.length, ...queued });
  })().catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "preview") {
    chrome.storage.local.get(PENDING_KEY).then(({ [PENDING_KEY]: pending = [] }) => sendResponse({ ok: true, pending })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === "syncPending") {
    (async () => {
      const { [PENDING_KEY]: pending = [] } = await chrome.storage.local.get(PENDING_KEY);
      const selected = Array.isArray(message.queries) ? pending.filter(query => message.queries.includes(query)) : pending;
      const batches = [];
      for (let index = 0; index < selected.length; index += 50) batches.push(selected.slice(index, index + 50));
      const results = [];
      for (const batch of batches) results.push(await syncQueries(batch));
      await chrome.storage.local.set({ [PENDING_KEY]: pending.filter(query => !selected.includes(query)) });
      sendResponse({ ok: true, sent: selected.length, results });
    })().catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === "clearPending") {
    chrome.storage.local.remove(PENDING_KEY).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === "disconnect") {
    chrome.storage.local.remove([SETTINGS_KEY, PENDING_KEY, "lastSync"]).then(() => sendResponse({ ok: true }));
    return true;
  }
});

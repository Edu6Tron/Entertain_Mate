const SETTINGS_KEY = "settings";

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
  const url = new URL("/api/extension/import", settings.dashboardUrl).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Entertain-Mate-Token": settings.token },
    body: JSON.stringify({ queries }),
  });
  if (!response.ok) throw new Error("Entertain_Mate could not accept this import");
  const result = await response.json();
  await chrome.storage.local.set({ lastSync: { at: Date.now(), result } });
  return result;
}

chrome.history.onVisited.addListener(async item => {
  const query = queryFromGoogleUrl(item.url);
  if (!query) return;
  try {
    await syncQueries([query]);
  } catch (error) {
    console.warn("Entertain_Mate live import skipped", error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "backfill") return;
  (async () => {
    const startTime = message.days ? Date.now() - message.days * 24 * 60 * 60 * 1000 : 0;
    const items = await chrome.history.search({ text: "", startTime, maxResults: 5000 });
    const queries = [...new Set(items.map(item => queryFromGoogleUrl(item.url)).filter(Boolean))];
    const batches = [];
    for (let index = 0; index < queries.length; index += 50) batches.push(queries.slice(index, index + 50));
    const results = [];
    for (const batch of batches) results.push(await syncQueries(batch));
    sendResponse({ ok: true, found: queries.length, batches: batches.length, results });
  })().catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

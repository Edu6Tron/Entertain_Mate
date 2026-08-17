const form = document.querySelector("#settings-form");
const status = document.querySelector("#status");
const fields = { dashboardUrl: document.querySelector("#dashboard-url"), token: document.querySelector("#token"), liveCapture: document.querySelector("#live-capture") };

async function load() {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) return;
  fields.dashboardUrl.value = settings.dashboardUrl ?? "";
  fields.token.value = settings.token ?? "";
  fields.liveCapture.checked = settings.liveCapture ?? false;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const dashboardUrl = new URL(fields.dashboardUrl.value).origin;
    await chrome.storage.local.set({ settings: { dashboardUrl, token: fields.token.value.trim(), liveCapture: fields.liveCapture.checked } });
    status.textContent = "Private connection saved.";
  } catch { status.textContent = "Enter a valid dashboard URL."; }
});

async function renderPreview() {
  const response = await chrome.runtime.sendMessage({ type: "preview" });
  const queries = response?.pending ?? [];
  const list = document.querySelector("#preview-list");
  list.innerHTML = queries.slice(0, 30).map(query => `<label class="candidate"><input type="checkbox" value="${query.replace(/"/g, "&quot;")}" checked /> <span>${query}</span></label>`).join("");
  document.querySelector("#preview-help").textContent = queries.length ? `${queries.length} locally queued candidates. Select what you approve for matching.` : "No local candidates queued.";
}

document.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", async () => {
  status.textContent = "Scanning locally before matching…";
  const response = await chrome.runtime.sendMessage({ type: "backfill", days: Number(button.dataset.days) || 0 });
  status.textContent = response?.ok ? `Queued ${response.added} likely entertainment searches for your review.` : response?.error ?? "Backfill could not start. Save the private connection first.";
  await renderPreview();
}));

document.querySelector("#refresh-preview").addEventListener("click", renderPreview);
document.querySelector("#sync-preview").addEventListener("click", async () => {
  const queries = Array.from(document.querySelectorAll("#preview-list input:checked")).map(input => input.value);
  const response = await chrome.runtime.sendMessage({ type: "syncPending", queries });
  status.textContent = response?.ok ? `Sent ${response.sent} reviewed candidates for title matching.` : response?.error ?? "Could not sync the selected candidates.";
  await renderPreview();
});
document.querySelector("#clear-preview").addEventListener("click", async () => { await chrome.runtime.sendMessage({ type: "clearPending" }); status.textContent = "Local candidate queue cleared."; await renderPreview(); });
document.querySelector("#disconnect").addEventListener("click", async () => { await chrome.runtime.sendMessage({ type: "disconnect" }); form.reset(); status.textContent = "Private connection and local candidates cleared."; await renderPreview(); });

load().then(renderPreview);

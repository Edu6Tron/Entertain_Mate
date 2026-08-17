const form = document.querySelector("#settings-form");
const status = document.querySelector("#status");
const fields = { dashboardUrl: document.querySelector("#dashboard-url"), token: document.querySelector("#token"), liveCapture: document.querySelector("#live-capture") };

async function load() {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) return;
  fields.dashboardUrl.value = settings.dashboardUrl ?? "";
  fields.token.value = settings.token ?? "";
  fields.liveCapture.checked = settings.liveCapture ?? true;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const dashboardUrl = new URL(fields.dashboardUrl.value).origin;
    await chrome.storage.local.set({ settings: { dashboardUrl, token: fields.token.value.trim(), liveCapture: fields.liveCapture.checked } });
    status.textContent = "Private connection saved.";
  } catch { status.textContent = "Enter a valid dashboard URL."; }
});

document.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", async () => {
  status.textContent = "Scanning locally before matching…";
  const response = await chrome.runtime.sendMessage({ type: "backfill", days: Number(button.dataset.days) || 0 });
  status.textContent = response?.ok ? `Sent ${response.found} unique Google searches for private matching.` : response?.error ?? "Backfill could not start. Save the private connection first.";
}));

load();

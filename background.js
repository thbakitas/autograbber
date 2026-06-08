const TARGETS = [
  "https://bo-customertools2.k8s.eur-sec.dev-novibet.systems/*",
  "https://bo-customertools2.stg-novibet.systems/*"
];

const LOGIN_URLS = {
  dev: "https://bo-customertools2.k8s.eur-sec.dev-novibet.systems/acc/home",
  stg: "https://bo-customertools2.stg-novibet.systems/acc/home"
};

// env -> tabId of a background tab we opened for auto-login (to close after capture)
const autoTabs = {};

function envFromUrl(url) {
  if (url.includes("dev-novibet")) return "dev";
  if (url.includes("stg-novibet")) return "stg";
  return "unknown";
}

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || [];
    const auth = headers.find((h) => h.name.toLowerCase() === "authorization");
    if (!auth || !auth.value || !/^Bearer\s+/i.test(auth.value)) return;

    const token = auth.value.replace(/^Bearer\s+/i, "").trim();
    const env = envFromUrl(details.url);

    chrome.storage.local.get(["tokens"], (data) => {
      const tokens = data.tokens || {};
      tokens[env] = {
        token,
        fullHeader: auth.value,
        capturedAt: new Date().toISOString(),
        url: details.url
      };
      chrome.storage.local.set({ tokens, lastEnv: env });
    });

    const code = env === "dev" ? "D" : env === "stg" ? "S" : "?";
    const color = env === "dev" ? "#1565c0" : env === "stg" ? "#e65100" : "#616161";
    chrome.action.setBadgeText({ text: code });
    chrome.action.setBadgeBackgroundColor({ color });

    // If this token came from a background tab we opened, close it now.
    if (autoTabs[env]) {
      const tabId = autoTabs[env];
      delete autoTabs[env];
      setTimeout(() => chrome.tabs.remove(tabId, () => void chrome.runtime.lastError), 800);
    }
  },
  { urls: TARGETS },
  ["requestHeaders", "extraHeaders"]
);

// Popup asks us to fetch a token: open the login page in a hidden background tab.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "login" && LOGIN_URLS[msg.env]) {
    chrome.tabs.create({ url: LOGIN_URLS[msg.env], active: false }, (tab) => {
      autoTabs[msg.env] = tab.id;
      // Safety: stop waiting on this tab after 25s even if nothing was captured.
      setTimeout(() => {
        if (autoTabs[msg.env] === tab.id) delete autoTabs[msg.env];
      }, 25000);
      sendResponse({ ok: true });
    });
    return true; // async response
  }
});

const ENV_META = {
  dev: { label: "DEV", color: "#1565c0", desc: "eur-sec.dev-novibet.systems" },
  stg: { label: "STG", color: "#e65100", desc: "stg-novibet.systems" },
  unknown: { label: "?", color: "#616161", desc: "" }
};

function card(env, entry) {
  const meta = ENV_META[env] || ENV_META.unknown;
  const when = entry.capturedAt ? new Date(entry.capturedAt).toLocaleString() : "?";
  return (
    '<div class="card">' +
      '<div class="row">' +
        '<span class="badge" style="background:' + meta.color + '">' + meta.label + '</span>' +
        '<span class="host">' + meta.desc + '</span>' +
      '</div>' +
      '<textarea id="tok-' + env + '" readonly></textarea>' +
      '<div class="row">' +
        '<button data-copy="' + env + '">Copy</button>' +
        '<span class="meta">' + when + '</span>' +
      '</div>' +
    '</div>'
  );
}

function renderTokens() {
  chrome.storage.local.get(["tokens"], (data) => {
    const tokens = data.tokens || {};
    const content = document.getElementById("content");
    const envs = Object.keys(tokens);

    if (envs.length === 0) {
      content.innerHTML =
        '<div class="empty">No token captured yet.<br><br>' +
        "Enable auto-login in settings and click Fetch, or just log in manually. " +
        "Captured tokens appear here, each labelled by environment.</div>";
      return;
    }

    const order = ["dev", "stg"]
      .filter((e) => tokens[e])
      .concat(envs.filter((e) => e !== "dev" && e !== "stg"));

    content.innerHTML =
      order.map((e) => card(e, tokens[e])).join("") +
      '<button id="clearBtn" class="clear">Clear all</button>';

    order.forEach((e) => {
      document.getElementById("tok-" + e).value = tokens[e].token;
    });

    content.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const e = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(tokens[e].token);
        const old = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = old), 1200);
      });
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
      chrome.storage.local.remove(["tokens", "lastEnv"], () => {
        chrome.action.setBadgeText({ text: "" });
        renderTokens();
      });
    });
  });
}

function initSettings() {
  chrome.storage.local.get(["creds", "autoLogin"], (data) => {
    const creds = data.creds || {};
    document.getElementById("autoLogin").checked = !!data.autoLogin;
    if (creds.dev) {
      document.getElementById("devUser").value = creds.dev.u || "";
      document.getElementById("devPass").value = creds.dev.p || "";
    }
    if (creds.stg) {
      document.getElementById("stgUser").value = creds.stg.u || "";
      document.getElementById("stgPass").value = creds.stg.p || "";
    }
  });

  document.getElementById("saveCreds").addEventListener("click", () => {
    const creds = {
      dev: {
        u: document.getElementById("devUser").value.trim(),
        p: document.getElementById("devPass").value
      },
      stg: {
        u: document.getElementById("stgUser").value.trim(),
        p: document.getElementById("stgPass").value
      }
    };
    const autoLogin = document.getElementById("autoLogin").checked;
    chrome.storage.local.set({ creds, autoLogin }, () => {
      const msg = document.getElementById("savedMsg");
      msg.textContent = "Saved";
      setTimeout(() => (msg.textContent = ""), 1500);
    });
  });

  document.getElementById("fetchDev").addEventListener("click", () =>
    chrome.runtime.sendMessage({ action: "login", env: "dev" })
  );
  document.getElementById("fetchStg").addEventListener("click", () =>
    chrome.runtime.sendMessage({ action: "login", env: "stg" })
  );
}

// Live-refresh the cards when a new token lands while the popup is open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tokens) renderTokens();
});

renderTokens();
initSettings();

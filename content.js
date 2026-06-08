(function () {
  const host = location.hostname;
  const env = host.includes("dev-novibet") ? "dev"
            : host.includes("stg-novibet") ? "stg" : null;
  if (!env) return;

  // Only attempt once per tab session to avoid submit loops on failed logins.
  if (sessionStorage.getItem("crmAutoLoginTried")) return;

  chrome.storage.local.get(["creds", "autoLogin"], (data) => {
    if (!data.autoLogin) return;
    const c = (data.creds || {})[env];
    if (!c || !c.u || !c.p) return;
    // Give SPA frameworks a moment to render the form.
    setTimeout(() => tryLogin(c.u, c.p), 600);
  });

  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    const setter = desc && desc.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function tryLogin(user, pass) {
    const pwd = document.querySelector('input[type="password"]');
    if (!pwd) return; // not a login screen (probably already authenticated)

    const userField = document.querySelector(
      'input[name*="user" i], input[id*="user" i], input[type="email"], input[type="text"]'
    );
    if (!userField) return;

    sessionStorage.setItem("crmAutoLoginTried", "1");

    setNativeValue(userField, user);
    setNativeValue(pwd, pass);

    const form = pwd.closest("form");
    const scope = form || document;
    let btn = scope.querySelector('button[type="submit"], input[type="submit"]');
    if (!btn) {
      const candidates = Array.from(scope.querySelectorAll("button"));
      btn =
        candidates.find((b) =>
          /log\s*in|sign\s*in|submit|enter|connect/i.test(b.textContent || "")
        ) || candidates[0];
    }

    setTimeout(() => {
      if (btn) btn.click();
      else if (form) form.submit();
    }, 150);
  }
})();

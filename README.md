# AutoGrabber

A Chrome extension that captures the `Authorization: Bearer` token
from the CRM agent backoffice, for **DEV** and **STG** environments, with optional
background auto-login.

## Install
1. Unzip so you have an `autograbber/` folder.
2. Go to `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `autograbber/` folder.

## Setup (optional auto-login)
1. Open the popup → **Login settings**.
2. Tick **Enable background auto-login**.
3. Enter the username/password for DEV and/or STG, then **Save settings**.

> Credentials are stored unencrypted in your browser profile. Use only a QA
> account and don't reuse the password elsewhere.

## Usage
- Click **Fetch DEV token** / **Fetch STG token**: the extension opens the login
  page in a hidden background tab, submits the form, captures the token, and
  closes the tab automatically.
- Or just log in manually — any request carrying the `Authorization` header is
  captured.
- Tokens appear as per-environment cards (blue **DEV**, orange **STG**) with a
  **Copy** button. The toolbar badge shows **D**/**S** for the latest capture.
- Tokens expire — re-fetch when API calls start returning 401.

## Files
- `manifest.json` — extension config, permissions, host scopes
- `background.js` — header capture + background-tab login orchestration
- `content.js` — auto-fills and submits the login form
- `popup.html` / `popup.js` — UI, token cards, settings
- `icons/` — toolbar/extension icons (placeholder; swap in the real logo PNGs)

## Notes
- Scoped to the two backoffice hosts only.
- Auto-login works for a standard username/password form. SSO, MFA, or CAPTCHA
  will block it.

© thbakitas
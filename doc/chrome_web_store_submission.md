# Chrome Web Store Submission Guide — Flow (Productivity Tracker)

This document contains all the information needed to publish the **Flow** Chrome extension on the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).

---

## 1. Developer Account Prerequisites

- A Google account registered at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
- A one-time $5 USD developer registration fee (paid once per account).
- Two-step verification enabled on the Google account.

---

## 2. Extension Package

Before uploading, create a ZIP archive of the extension directory (exclude development files):

```bash
# From the repository root
zip -r flow-extension.zip \
  manifest.json \
  background.js \
  blocked.html blocked.js \
  justify.html justify.js \
  popup.html popup.js \
  dashboard.html dashboard.js \
  styles.css \
  icons/icon16.png \
  icons/icon48.png \
  icons/icon128.png
```

> **Do not** include `doc/`, `tests/`, `*.md`, `AI_thoughts/`, or any test files in the ZIP.

---

## 3. Store Listing Fields

### 3.1 Name
```
Flow - Productivity Tracker
```
*Max 45 characters. This must match the `name` field in `manifest.json`.*

### 3.2 Short Description (≤ 132 characters)
```
Block distracting sites mindfully. Require a justification, set a timer, and track your browsing habits to stay focused.
```

### 3.3 Detailed Description (≤ 16,000 characters)

```
Flow helps you build mindful browsing habits by adding a thoughtful pause before you visit distracting websites.

FEATURES

🚫 Flexible Domain Blocking
Block any website by domain name. Supports wildcard patterns (e.g., *.facebook.com covers all sub-domains). Enable or disable sites without removing them from your list.

⏱️ Justification-Based Access
Before visiting a blocked site you must type a reason. This moment of reflection helps you decide whether the visit is truly necessary. Choose access windows of 5, 15, 30, 60, or 120 minutes (or a custom duration).

🔒 Cooldown Periods
After your access window closes, a configurable cooldown period (default: 30 minutes) prevents you from immediately returning. A live countdown shows how long you must wait.

🆘 Emergency Override
A 32-character random passcode is generated on first install for genuinely urgent situations. Every use is logged so you can review your override habits.

📊 Analytics Dashboard
See bar charts of access frequency by domain, recent access history with your justifications, and summary statistics (total sessions, time granted, most-visited blocked sites). Helps you identify patterns and make better decisions over time.

⚙️ Fully Configurable
• Add or remove blocked domains at any time via the extension popup.
• Change the default access duration and cooldown length to suit your work style.
• View or copy your emergency override code from settings.

🔒 Privacy First
All data is stored locally using chrome.storage.local. No data is ever sent to external servers. Your justifications, access logs, and override code never leave your device.

GETTING STARTED
1. Install Flow from the Chrome Web Store.
2. Click the Flow icon in the toolbar.
3. Your first blocked domain (facebook.com) is pre-configured — add more as needed.
4. Visit a blocked site to experience the justification flow.
5. Open the Analytics Dashboard to review your browsing patterns.

TIPS
• Add sites you mindlessly open out of habit (social media, news, entertainment).
• Review your justifications weekly — they reveal honest reasons behind distracted browsing.
• Use the cooldown period as a built-in "take a breath" reminder.
```

### 3.4 Category
**Productivity**

### 3.5 Language
**English (United States)**

---

## 4. Graphics & Assets

All image files live in the `icons/` directory.

| Asset | File | Required Size | Purpose |
|-------|------|--------------|---------|
| Extension icon | `icons/icon128.png` | 128 × 128 px | Store listing icon |
| Toolbar icon (small) | `icons/icon16.png` | 16 × 16 px | Browser toolbar |
| Toolbar icon (medium) | `icons/icon48.png` | 48 × 48 px | Extensions management page |
| Small promotional tile | `icons/promo_440x280.png` | 440 × 280 px | Featured on store category pages |

### Screenshots
At least **one** screenshot is required (maximum 5). Recommended size: **1280 × 800 px** or **640 × 400 px**.

Suggested screenshots to capture:
1. **Popup / Settings** — `popup.html` showing the blocked domain list and settings.
2. **Justification Page** — `justify.html` showing the text field and timer options.
3. **Blocked / Cooldown Page** — `blocked.html` with the countdown timer.
4. **Analytics Dashboard** — `dashboard.html` with charts and access history.

> Capture screenshots by loading the extension in Chrome (`chrome://extensions` → Developer Mode → Load Unpacked) and using Chrome's built-in screenshot tool or a screen-capture extension.

---

## 5. Permissions Justification

The Chrome Web Store requires a plain-language justification for each requested permission. Use the text below when filling in the **"Permissions"** section of the developer dashboard.

| Permission | Justification |
|-----------|--------------|
| `storage` | Stores blocked domain lists, access logs, justifications, and user settings locally on the device. No data is transmitted externally. |
| `tabs` | Reads the URL of the active tab so the extension can determine whether the current page matches a blocked domain pattern. |
| `webNavigation` | Intercepts page navigation events to redirect users to the justification page before they reach a blocked site. |
| `alarms` | Schedules the end of an access window and the end of a cooldown period reliably, even if the browser is idle or the popup is closed. |
| `host_permissions: <all_urls>` | Required so that navigation to any user-configured domain (including custom domains added by the user) can be intercepted and evaluated against the block list. |

---

## 6. Privacy Policy

Because Flow stores data **only locally** (no server, no account, no analytics service), a minimal privacy policy is sufficient. Host the policy at a stable URL (e.g., a GitHub Pages page or a Gist) and enter that URL in the **"Privacy practices"** section of the dashboard.

### Suggested Privacy Policy Text

```
Privacy Policy — Flow (Productivity Tracker)
Last updated: [DATE]

Flow stores all user data (blocked domain lists, access justifications, usage logs,
and settings) exclusively in chrome.storage.local on the user's own device.

No personal data, browsing history, or usage statistics are collected, transmitted,
or shared with any third party, including the developer. No external servers are
contacted by this extension.

The emergency override passcode is generated locally and is never transmitted outside
the user's browser.

If you have questions, please open an issue at:
https://github.com/shinglyu/MindfulBlocker
```

---

## 7. Single-Purpose Description

The Chrome Web Store requires a clear statement of the extension's single purpose:

> **"Flow's single purpose is to help users practice mindful browsing by blocking distracting websites and requiring a written justification before granting temporary access."**

---

## 8. Submission Checklist

- [ ] Developer account created and $5 fee paid.
- [ ] Extension ZIP created (see Section 2) and tested in Chrome Developer Mode.
- [ ] `manifest.json` version bumped if re-submitting an update.
- [ ] Store listing filled in: name, short description, detailed description, category, language.
- [ ] All icon assets uploaded: 128×128 store icon, 440×280 promotional tile.
- [ ] At least one screenshot uploaded (1280×800 or 640×400).
- [ ] Permissions justified (Section 5) in the dashboard.
- [ ] Privacy policy URL entered.
- [ ] Single-purpose statement written.
- [ ] Submitted for review (typical review time: 1–3 business days).

---

## 9. Update Workflow

When publishing an update:
1. Increment `"version"` in `manifest.json` (e.g., `"1.0.0"` → `"1.1.0"`).
2. Re-create the ZIP with the updated files.
3. Go to the Developer Dashboard → select the extension → **Package** tab → Upload new package.
4. Update the store listing description if features changed.
5. Submit for review.

---

## 10. Useful Links

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Chrome Extension Publishing documentation](https://developer.chrome.com/docs/webstore/publish/)
- [Extension quality guidelines](https://developer.chrome.com/docs/webstore/program-policies/)
- [Manifest V3 overview](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Permissions list reference](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)

# 🧩 Lasso Test Extension

A browser extension that intercepts outgoing ChatGPT requests, detects sensitive email addresses, and gives users full control over how their data is sent.

This project was developed **as part of a technical assessment for LASSO** and is intended for **educational and evaluation purposes only**.

---

## ✨ Features

- 🔍 **Email Detection**  
  Scans outgoing ChatGPT messages for email addresses using regex before the request is sent.

- 🛑 **Request Interception**  
  Intercepts requests by overriding the browser’s native `fetch` function at the page level (without relying on restricted network APIs).

- 🧑‍⚖️ **User Decision Flow**  
  Displays a modal when emails are detected, allowing the user to:
  - submit a modified message
  - cancel and send the original message

- 🔐 **Email Anonymization**  
  Replaces detected email addresses with `[EMAIL_ADDRESS]` in the final request sent to ChatGPT.

- ⏱️ **Dismiss System (24h)**  
  Users can dismiss specific email addresses for 24 hours:
  - dismissed emails do not trigger alerts
  - dismissal state is persisted with TTL
  - visual indicators are shown in history

- 🗂️ **Persistent History**  
  All detected issues are stored locally and displayed in a history tab.

---

## 🏗️ Architecture Overview

The extension follows a **layered architecture** to keep responsibilities clearly separated:

```
Page Script
  └─ fetch interception (override)
        ↓
Content Script
  └─ event bridge & UI injection
        ↓
React UI
  ├─ decision flow
  ├─ history
  └─ dismiss management
```

### Design Rationale

- Avoids restricted APIs such as `webRequestBlocking`
- Works consistently in Chromium-based browsers
- Keeps business logic out of the page context
- Ensures predictable and debuggable UI behavior

---

## 🧠 State Management

The extension UI uses **React Context API** to manage:

- detected text
- extracted email addresses
- issue history
- dismissed email state

Persistent data is stored in `chrome.storage`, while Context serves as the in-memory state layer for UI coordination and user interactions.

---

## 🚫 Email Dismiss Logic

- Email addresses can be dismissed for **24 hours**
- Dismissed emails:
  - do not trigger alerts
  - are excluded from modal prompts
- If **all detected emails** are dismissed, the modal is automatically suppressed
- Dismissed state is visually indicated in the history view

---

## 🌍 Browser Compatibility

### Chromium-based Browsers

Fully supported and tested on:
- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Other Chromium-based browsers

### Cross-Browser Support (Bonus)

The architecture is browser-agnostic and can be adapted for other browsers (e.g. Firefox) with minimal changes by abstracting the browser APIs.

---

## ⚠️ Usage Disclaimer

> **This project is not intended for production use.**

It was developed specifically within the scope of a technical assignment for **LASSO** and should be used **only for learning, evaluation, or demonstration purposes**.

---

## 📦 Tech Stack

- TypeScript
- React
- Chrome Extensions (Manifest V3)
- Shadow DOM
- Custom Events
- Chrome Storage API

---

## 🏁 Final Notes

This project focuses on:

- clean and maintainable architecture
- explicit responsibility boundaries
- user-controlled data flow
- predictable UI behavior

The goal was not only to satisfy the technical requirements, but also to demonstrate thoughtful engineering decisions and production-ready code structure.

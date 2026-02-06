# Classic Calendar App

A static, offline-friendly planner that unifies tasks and events into one system, with an inbox, time blocking, and review workflows. Built with vanilla HTML/CSS/JS in `index.html`.

## Features
- **Unified items model** for tasks, events, and focus blocks (inbox, scheduled, completed).
- **Day/Week/Month views** with drag-and-drop time blocking and resize.
- **Quick capture** input with natural-language time parsing.
- **Recurring items** with per-occurrence overrides and skips.
- **Lightweight review** modal for daily/weekly reflection stats.
- **Local storage** persistence (no backend required).

## Getting Started
1. Open `index.html` in your browser.
2. Use **Quick add** to capture a task or event.
3. Drag tasks from the Inbox into the calendar to time block.
4. Open **Review** for daily/weekly summaries.

## Data Storage
All data is stored locally in your browser using `localStorage`. Clearing site data will remove saved items.

## Notifications
Notifications rely on the browser’s Notification API and only work while the page is open and permission is granted. The scheduler limits notifications to a near‑term window.

## How to deploy to GitHub Pages
This app is a static site. The build step copies static files into `dist/`.

```bash
npm install
npm run lint
npm run test
npm run build
```

Then publish the `dist/` folder to GitHub Pages. A workflow is provided in `.github/workflows/deploy.yml` to build and deploy automatically on pushes to `main`.

## Privacy
- **Stored locally:** planner items, settings, and review notes live in `localStorage`.
- **Transmitted:** nothing. The app does not send data to any server.
- **Delete data:** use **Settings → Reset local data** or clear site data in your browser.

## Project Structure
- `index.html` — all UI, styling, and logic in a single file.
- `scripts/` — build and security checks for CI.
- `dist/` — build output (generated).

## Notes
- Works best in modern desktop and mobile browsers.
- Designed to be completely offline once loaded.

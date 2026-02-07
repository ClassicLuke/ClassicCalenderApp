# Classic Calendar App

A static, offline-capable planner with day, week, and month views. Built with vanilla HTML/CSS/JS for GitHub Pages and designed for quick planning, task tracking, and reminders.

## Features
- Daily, week, and month views
- Events, tasks, and reminders with type suggestions and colors
- Drag-and-drop rescheduling in day/week/month views
- Event duration handling with overlap layout in day view
- Multi-day event support
- Advanced recurrence rules (weekly, biweekly, every N days, monthly by date, monthly by weekday pattern)
- Notification reminders (browser support required)
- Theme toggle and search/filter controls
- Local-first storage via `localStorage`
- Service worker asset caching for offline reloads

## Getting Started
1. Publish to GitHub Pages, or run a local static server.
2. Open the app in a modern browser.

Example local server:
```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Tests
Run core utility tests:
```bash
node --test tests/planner-core.test.js
```

## Data Storage
Planner items and preferences are stored in browser `localStorage`. Clearing site data removes saved items.

## Offline
The app registers `sw.js` and caches core assets after first load, so it can reopen while offline.

## Project Structure
- `index.html` - app markup
- `styles/app.css` - app styles
- `scripts/planner-core.js` - shared pure utility helpers
- `scripts/app.js` - UI, state, rendering, and interactions
- `sw.js` - service worker caching logic
- `tests/planner-core.test.js` - core helper tests

## Notes
- GitHub Pages deployment is fully supported.
- Notifications and passcode lock rely on browser capabilities and permissions.

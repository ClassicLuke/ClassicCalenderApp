# Classic Calendar App

A single-file, offline-friendly daily planner with day, week, and all‑week views. Built with vanilla HTML/CSS/JS in `index.html` and designed for quick planning, task tracking, and reminders.

## Features
- **Daily, Week, and All‑week views** with smooth navigation.
- **Events, Tasks, and Reminders** with color labels, notes, and type suggestions.
- **Recurring items** (weekly/biweekly) with selectable days.
- **Notification reminders** (when supported by the browser).
- **Multiple themes** you can toggle from the header.
- **Local storage** persistence (no backend required).

## Getting Started
1. Open `index.html` in your browser.
2. Click **+** to add an event, task, or reminder.
3. Switch views using the toggle at the top.
4. Use the theme chips to change the look and feel.

## Data Storage
All data is stored locally in your browser using `localStorage`. Clearing site data will remove saved items.

## Notifications
Notifications rely on the browser’s Notification API and only work while the page is open and permission is granted. The scheduler limits reminders to a near‑term window.

## Project Structure
- `index.html` — all UI, styling, and logic in a single file.

## Notes
- Works best in modern desktop and mobile browsers.
- Designed to be completely offline once loaded.

# Classic Calendar App

A lightweight, offline-friendly daily planner built with vanilla HTML/CSS/JS in a single file (`index.html`). It focuses on the essentials: date navigation, a task list, and local storage persistence.

## Features
- **Simple daily view** with Previous/Today/Next navigation.
- **Task list with optional time and notes.**
- **Complete + delete** tasks in one click.
- **Local storage** persistence (no backend required).

## Getting Started
1. Open `index.html` in your browser.
2. Add tasks for the selected day.
3. Mark tasks complete or delete them as needed.

## Data Storage
All data is stored locally in your browser using `localStorage`. Clearing site data will remove saved tasks.

## How to deploy to GitHub Pages
This app is a static site. The build step copies static files into `dist/`.

```bash
npm install
npm run lint
npm run test
npm run build
```

Then publish the `dist/` folder to GitHub Pages. A workflow is provided in `.github/workflows/deploy.yml` to build and deploy automatically on pushes to `main`.

## Project Structure
- `index.html` — all UI, styling, and logic in a single file.
- `scripts/` — build and security checks for CI.
- `dist/` — build output (generated).

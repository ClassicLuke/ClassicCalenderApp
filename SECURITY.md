# Security Policy

## Threat model summary
- Static, client-side planner hosted on GitHub Pages.
- No backend or secrets.
- Primary risks: stored XSS in localStorage, unsafe links, and permissive browser features.

## Mitigations
- User content is rendered using `textContent` and safe DOM APIs (no HTML injection).
- Links are validated to allow only `http`/`https` and opened with `noopener noreferrer`.
- Content Security Policy and Permissions Policy are set via `<meta http-equiv>` tags.
- Local data can be reset via **Settings → Reset local data**.

## Known limitations
- CSP is delivered via `<meta>` tags (GitHub Pages cannot set HTTP headers).
- Inline scripts and styles require `unsafe-inline` in CSP.
- Notifications are limited to active sessions and depend on browser permissions.

## Reporting
If you discover a vulnerability, please open a GitHub issue with details and steps to reproduce.

## Security checklist
- `npm run lint` (blocks unsafe `innerHTML` usage).
- `npm run test` (URL validation tests).
- `npm run audit` (fails on high severity vulnerabilities).
- `npm run build` (generates `dist/` for deployment).

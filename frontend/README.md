# NAVYA — Microgrid Operations

NAVYA is the operator console for an autonomous off-grid microgrid. It reads
live state, forecasts, optimizer decisions, shortfall response, scenarios,
community load tiers, and runway data from the backend contract.

## Run

```bash
VITE_API_BASE_URL=http://localhost:5000 npm run dev
```

`VITE_API_BASE_URL` defaults to `http://localhost:5000`. Authenticated API
requests attach the Bearer token stored by the login screen. The public
`/community-display` route only polls `/signal` and stores its last good value
for degraded connectivity.

## Frontend map

- `src/api/client.ts` — thin typed REST client and token/session storage
- `src/types/navya.ts` — shared backend-facing NAVYA schema
- `src/App.tsx` — routed shell, mission-control views, kiosk, and interactions
- `src/index.css` — warm paper / warm-neutral theme variables and instrument styling

The first load is light theme. The shell theme toggle persists under
`navya_theme`; the kiosk intentionally has no shell or theme controls.
# ibbrazil.ai — Brazil + Global M&A Terminal

Production Next.js terminal for Brazilian and international M&A plus major Brazilian corporate news.

- Brazil tape: curated public filings / press
- International tape: Financial Modeling Prep (`mergers-acquisitions-latest`, SEC-derived)
- Placeholders and `[NOT A FILING]` rows are excluded

## Setup

```bash
cp .env.example .env.local
# set FMP_API_KEY from https://site.financialmodelingprep.com/dashboard
npm install
npm run dev
```

- App: http://localhost:3000  
- JSON: http://localhost:3000/api/feed  

## Environment

| Variable | Default | Notes |
|---|---|---|
| `FMP_API_KEY` | — | Required for live international ingest (free tier `limit` ≤ 5) |
| `FX_BRL_USD` | `5.16` | Window FX for disclosed-value conversion |
| `FEED_WINDOW_HOURS` | `168` | KPI window for live deal counts |

## Deploy (Vercel)

1. Push this repo to GitHub  
2. Import on Vercel and attach domain `ibbrazil.ai`  
3. Set `FMP_API_KEY` (and optional `FX_BRL_USD`) in project env  
4. Redeploy  

## Notes

Refinitiv / Bloomberg / Dealogic remain institutional feeds. FMP is the self-serve substitute used here. Not investment advice.

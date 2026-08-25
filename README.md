# ibbrazil.ai — Brazil + Global M&A Terminal

Next.js terminal that keeps curated Brazil M&A/news and **ingests live international M&A** from [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs/stable/latest-mergers-acquisitions) (SEC-derived), replacing the old static `needs-api` placeholder.

## Setup

```bash
cp .env.example .env.local
# set FMP_API_KEY from https://site.financialmodelingprep.com/dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). JSON feed: [http://localhost:3000/api/feed](http://localhost:3000/api/feed).

### Env

| Variable | Default | Notes |
|---|---|---|
| `FMP_API_KEY` | — | Required for live international tape. Free tier: `limit` ≤ 5 |
| `FX_BRL_USD` | `5.16` | Display conversion |
| `FEED_WINDOW_HOURS` | `168` | Reserved for future windowing |

## Architecture

- `src/lib/feed.ts` — merges seed Brazil rows + FMP international deals
- `src/app/api/feed/route.ts` — JSON API (`revalidate` 300s)
- `src/data/seed-deals.json` — curated Brazil deals/news (no Refinitiv placeholder)
- UI mirrors the published dark/gold operator terminal

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import on Vercel and point domain `ibbrazil.ai`
3. Add `FMP_API_KEY` in project env
4. Redeploy

## Notes

- Refinitiv / Bloomberg / Dealogic remain institutional feeds; FMP is the self-serve substitute.
- Free FMP plan caps `limit` at 5 per request.

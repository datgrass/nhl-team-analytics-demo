# NHL Team Analytics - Databricks App Demo

## Overview
A polished, event-ready Databricks App showcasing what Databricks can do for NHL teams. Built for a sports event where 30/32 NHL teams will be in attendance. The demo focuses on the Colorado Avalanche as a reference implementation.

## Brand Guidelines
- **Primary**: Burgundy (#6F263D)
- **Secondary**: Blue (#236192)
- **Accent**: Silver (#A2AAAD)
- **Dark Background**: #1a1a2e (dark navy/charcoal)
- **Text**: White (#FFFFFF) on dark backgrounds
- **Font**: Clean, modern sans-serif (Inter)

## Data Sources
1. **NHL Edge API** (api-web.nhle.com) - Live player stats, schedule, standings, roster, headshots
2. **Puck Pedia API** - Player contracts, salary cap data, cap projections

## Architecture
```
React Frontend (Vite + TypeScript + Tailwind + Recharts)
    ↓ HTTP API calls
FastAPI Backend (Python)
    ↓ fetches from
NHL Edge API + Puck Pedia API (live, no DB needed)
```

## Dashboard Sections
1. **Team Header** - Logo, record, standings position, division rank
2. **Point Leaders** - Top scorers with headshots, goals/assists/points
3. **Cap Overview** - Current cap hit vs cap space, 5-year projection chart
4. **Cap Breakdown** - By position (F/D/G) donut chart
5. **Player Contracts** - Sortable table with name, position, cap hit, expiry
6. **Upcoming Schedule** - Next 5-10 games with opponent logos, dates, times
7. **Standings** - Central Division standings table

## Deployment
- **Workspace**: e2-demo-field-eng (e2-demo-west profile)
- **App Name**: nhl-team-analytics
- **Type**: Node.js React frontend + FastAPI backend

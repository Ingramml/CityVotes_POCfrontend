# CityVotes Vercel Deployment Guide

## Production Deployment

**Vercel Project:** `city-votes-poc-frontend`
**Production URL:** https://city-votes-poc-frontend.vercel.app

## Project Structure for Vercel

```
CityVotes_POC/
├── vercel.json              # Vercel deployment configuration
├── requirements.txt         # Python dependencies (FastAPI)
├── backend/
│   ├── api/
│   │   ├── main.py         # FastAPI entry point (serverless function)
│   │   └── routes/
│   │       └── db_routes.py # Database API routes
│   └── config.py           # Configuration with CORS settings
└── frontend/
    ├── js/
    │   └── config.js       # Frontend API URL configuration
    └── *.html              # Static frontend pages
```

## Configuration Files

### vercel.json
Configures how Vercel builds and routes the application:
- Python backend served as serverless functions at `/api/*`
- Static frontend files served at root

### frontend/js/config.js
Auto-detects environment and sets appropriate API URL:
- Local development: `http://localhost:8000/api`
- Production: `/api` (relative path on same domain)

### backend/config.py
Contains CORS origins that allow cross-origin requests:
- Includes `https://city-votes-poc-frontend.vercel.app`
- Add custom domains via `CORS_ORIGINS` environment variable

## Environment Variables (Vercel Dashboard)

Required environment variables in Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ORIGINS` | Additional CORS origins (comma-separated) | `https://custom-domain.com` |

## Deployment Steps

### Automatic Deployment (Recommended)
1. Push changes to GitHub
2. Vercel automatically deploys from connected repository

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

## Database Setup

The application requires a PostgreSQL database with the CityVotes schema.

**Options:**
1. **Vercel Postgres** - Built-in, easy setup
2. **Neon** - Free tier available, good for development
3. **Supabase** - PostgreSQL with additional features
4. **Railway** - Simple PostgreSQL hosting

### Initialize Database
Run the schema files in order:
```sql
-- backend/database/schema.sql (complete schema)
-- OR step-by-step:
-- backend/database/step1_*.sql through step11_*.sql
```

## API Endpoints

### Database Routes (`/api/db/`)
- `GET /api/db/agenda-items` - Search/filter agenda items with KPIs
- `GET /api/db/council` - List council members
- `GET /api/db/council/{id}` - Member profile
- `GET /api/db/council/{id}/votes` - Member's votes (filtered)
- `GET /api/db/council/{id}/alignment` - Member's alignment data
- `GET /api/db/meetings` - Meeting list
- `GET /api/db/meetings/{id}` - Meeting detail
- `GET /api/db/votes/{id}` - Vote detail
- `GET /api/db/stats` - Overall statistics
- `GET /api/db/alignment` - Global alignment matrix

## Troubleshooting

### CORS Errors
- Check that your frontend domain is in `CORS_ORIGINS` in `backend/config.py`
- Or add via `CORS_ORIGINS` environment variable in Vercel

### Database Connection
- Verify `DATABASE_URL` is correctly set in Vercel environment variables
- Check database is accessible from Vercel's network

### 500 Errors
- Check Vercel function logs in the dashboard
- Verify all dependencies are in `requirements.txt`

## Local Development

```bash
# Start backend
cd backend
uvicorn api.main:app --reload --port 8000

# Serve frontend (any static server)
cd frontend
python -m http.server 5500
```

Then open http://localhost:5500/home.html

# CityVotes FastAPI Backend Setup

This template can load data from either **static JSON files** (for simple hosting) or a **FastAPI backend** (for live sites with a database).

---

## Quick Start

### 1. Install Dependencies

```bash
pip install fastapi uvicorn "psycopg[binary]" psycopg_pool
```

### 2. Database

The backend connects to a Postgres database (default: `postgresql://localhost:5430/votewatching`).

Set a custom URL via environment variable:
```bash
export CITYVOTES_DB_URL="postgresql://user:pass@host:port/dbname"
```

### 3. Start the API Server

```bash
cd /path/to/CityVotes_Research
python shared/database/api.py
# → http://127.0.0.1:8000
```

Options:
```bash
python shared/database/api.py --port 8080        # custom port
python shared/database/api.py --host 0.0.0.0     # listen on all interfaces
```

### 4. Configure the Frontend

In `js/api.js`, set:

```javascript
const USE_STATIC_DATA = false;                    // use backend
const API_BASE_URL = 'http://localhost:8000/api'; // your backend URL
const CITY_CODE = 'Columbus-OH';                  // your municipality code
```

### 5. Serve the Frontend

```bash
cd template/
python -m http.server 3000
# → Open http://localhost:3000
```

---

## API Endpoints

All endpoints accept an optional `?city=Columbus-OH` query parameter.

| Endpoint | Method | Description | Template Equivalent |
|----------|--------|-------------|-------------------|
| `/api/stats` | GET | Global KPI statistics | `stats.json` |
| `/api/council` | GET | All council members with computed stats | `council.json` |
| `/api/council/{id}` | GET | Member profile + full vote history | `council/{id}.json` |
| `/api/meetings` | GET | All meetings with counts | `meetings.json` |
| `/api/meetings/{id}` | GET | Meeting detail with agenda items | Client-side join |
| `/api/votes` | GET | All voted items with tallies | `votes.json` |
| `/api/votes/index` | GET | Available years list | `votes-index.json` |
| `/api/votes/year/{year}` | GET | Votes filtered by year | `votes-{year}.json` |
| `/api/votes/{id}` | GET | Vote detail with member votes | `votes/{id}.json` |
| `/api/alignment` | GET | Pairwise member agreement rates | `alignment.json` |
| `/api/search?q=budget` | GET | Full-text search on agenda items | N/A (new) |

---

## Response Format

Every endpoint returns `{"success": true, ...}` matching the schemas documented in `data/Template_ReadMe.md`.

### Key Transformations

The backend handles all data transformations automatically:

| Database Value | API Value | Field |
|---------------|-----------|-------|
| `Yes` | `AYE` | vote_choice |
| `No` | `NAY` | vote_choice |
| `Abstain` | `ABSTAIN` | vote_choice |
| `Absent` / `Excused` | `ABSENT` | vote_choice |
| `Recused` | `RECUSAL` | vote_choice |
| `passed=true` | `PASS` | outcome |
| `passed=false` | `FAIL` | outcome |
| `passed=NULL` + tabled | `TABLED` | outcome |
| `passed=NULL` + withdrawn | `WITHDRAWN` | outcome |
| `consent=true` | `CONSENT` | section |
| `consent=false` + hearing | `PUBLIC_HEARING` | section |
| `consent=false` | `GENERAL` | section |

### Computed Stats (per member)

- `aye_percentage` = aye_count / total_votes × 100
- `participation_rate` = (total - absent - abstain) / total × 100
- `dissent_rate` = votes_on_losing_side / valid_votes × 100
- `votes_on_losing_side` = NAY on PASS + AYE on FAIL
- `close_vote_dissents` = losing-side votes where margin ≤ 2

### Topic Classification

The backend auto-classifies vote titles into 0–3 of the 16 topic categories using keyword matching. See `data/Template_ReadMe.md` for the full category list.

---

## Multi-City Support

The same API serves multiple municipalities. Set the city via:
- Query parameter: `?city=Columbus-OH`
- Frontend config: `const CITY_CODE = 'Columbus-OH'` in `js/api.js`

If no city is specified, the server defaults to the first municipality with data.

---

## Switching Between Static and Backend Mode

In `js/api.js`:

```javascript
// Static mode (no backend needed):
const USE_STATIC_DATA = true;

// Backend mode (requires running FastAPI):
const USE_STATIC_DATA = false;
```

Static mode loads from `data/*.json` files — useful for simple hosting or when generating JSON offline.

---

## Production Deployment

For production, run behind a reverse proxy (nginx, Caddy):

```bash
# Run with multiple workers
uvicorn shared.database.api:app --host 0.0.0.0 --port 8000 --workers 4
```

Update `API_BASE_URL` in `js/api.js` to your production domain:
```javascript
const API_BASE_URL = 'https://api.yourcity.example.com/api';
```

---

## Files

| File | Location | Purpose |
|------|----------|---------|
| `api.py` | `shared/database/api.py` | FastAPI application |
| `topic_classifier.py` | `shared/database/topic_classifier.py` | Keyword-based topic classification |
| `api.js` | `js/api.js` | Frontend API client (static + backend modes) |
| `cityvotes_schema.sql` | `shared/database/cityvotes_schema.sql` | Database schema |
| `ingest_csv.py` | `shared/database/ingest_csv.py` | CSV → Postgres loader |

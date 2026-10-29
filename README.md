# EventMind AI

India-first event planning workspace for weddings, birthdays, and community events. The MVP combines a premium light SaaS dashboard with a FastAPI + SQLite API and optional Groq-powered planning suggestions.

## Stack

- Next.js 14 + TypeScript + CSS modules
- Python FastAPI + SQLAlchemy + SQLite
- Groq API for optional AI planning suggestions
- INR formatting and Indian event categories/conventions

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. The dashboard works without a Groq key; the AI suggestion endpoint returns a useful fallback until `GROQ_API_KEY` is configured.

## Test

```powershell
cd backend
pytest
```

## MVP workflows

1. Create an event with type, city, date, guests, and INR budget.
2. Review a dashboard summary with budget health, next tasks, and vendor coverage.
3. Add budget line items and track planned vs. actual spend.
4. Add checklist tasks with due dates and completion state.
5. Browse India-focused vendors, save vendors, record manual quotes, and compare quotes.
6. Ask EventMind for a contextual plan using Groq, with a safe local fallback.

## Security notes

- API keys are server-side only and never included in frontend code.
- CORS is limited to configured origins.
- Request bodies use Pydantic validation and bounded strings/numbers.
- SQLite is local MVP storage; use Postgres plus auth before production multi-user use.


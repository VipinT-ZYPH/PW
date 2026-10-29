from datetime import date, timedelta
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
import httpx
from .db import Base, SessionLocal, engine, get_db
from .models import BudgetItem, Event, Quote, Task, Vendor
from .schemas import BudgetCreate, EventCreate, EventRead, PlanRequest, QuoteCreate, TaskCreate, TaskUpdate
from .settings import settings

app = FastAPI(title="EventMind AI API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH"], allow_headers=["*"])

@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if not db.scalars(select(Vendor)).first():
            db.add_all([
                Vendor(name="Marigold Moments", category="Decor & florals", city="Mumbai", rating=4.8, price_band="₹₹₹", description="Haldi-ready florals, mandap styling, and intimate decor."),
                Vendor(name="Curry Leaf Catering", category="Catering", city="Bengaluru", rating=4.7, price_band="₹₹", description="Regional Indian menus with live counters and Jain options."),
                Vendor(name="The Candid Frame", category="Photography", city="Delhi", rating=4.9, price_band="₹₹₹", description="Candid wedding and celebration stories with fast previews."),
                Vendor(name="Sangeet Studio", category="Entertainment", city="Pune", rating=4.6, price_band="₹₹", description="Choreography, DJs, dhol, and emcee packages."),
            ])
            db.commit()

@app.get("/health")
def health(): return {"status": "ok", "service": "eventmind-api"}

@app.get("/api/events", response_model=list[EventRead])
def list_events(db: Session = Depends(get_db)): return db.scalars(select(Event).order_by(Event.created_at.desc())).all()

@app.post("/api/events", response_model=EventRead, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.model_dump())
    db.add(event); db.commit(); db.refresh(event)
    defaults = [("Venue & logistics", .22), ("Food & catering", .30), ("Decor & florals", .16), ("Photography", .10), ("Entertainment", .08), ("Contingency", .14)]
    for category, share in defaults: db.add(BudgetItem(event_id=event.id, category=category, planned=round(event.budget * share, 2)))
    for i, title in enumerate(["Lock the venue", "Shortlist priority vendors", "Confirm guest list", "Send invitations"]): db.add(Task(event_id=event.id, title=title, due_date=(event.event_date - timedelta(days=30 - i * 7)) if event.event_date else None, priority="high" if i < 2 else "medium"))
    db.commit(); return event

@app.get("/api/events/{event_id}/summary")
def summary(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event: raise HTTPException(404, "Event not found")
    items = db.scalars(select(BudgetItem).where(BudgetItem.event_id == event_id)).all()
    tasks = db.scalars(select(Task).where(Task.event_id == event_id)).all()
    return {"event": EventRead.model_validate(event), "budget_items": items, "tasks": tasks, "spent": sum(x.actual for x in items), "planned": sum(x.planned for x in items), "task_completion": round(sum(x.completed for x in tasks) / len(tasks) * 100) if tasks else 0}

@app.post("/api/events/{event_id}/budget", status_code=201)
def add_budget(event_id: int, payload: BudgetCreate, db: Session = Depends(get_db)):
    if not db.get(Event, event_id): raise HTTPException(404, "Event not found")
    item = BudgetItem(event_id=event_id, **payload.model_dump()); db.add(item); db.commit(); db.refresh(item); return item

@app.post("/api/events/{event_id}/tasks", status_code=201)
def add_task(event_id: int, payload: TaskCreate, db: Session = Depends(get_db)):
    if not db.get(Event, event_id): raise HTTPException(404, "Event not found")
    task = Task(event_id=event_id, **payload.model_dump()); db.add(task); db.commit(); db.refresh(task); return task

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task: raise HTTPException(404, "Task not found")
    task.completed = payload.completed; db.commit(); db.refresh(task); return task

@app.get("/api/vendors")
def list_vendors(city: str | None = Query(default=None), category: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = select(Vendor)
    if city: query = query.where(Vendor.city.ilike(f"%{city}%"))
    if category: query = query.where(Vendor.category.ilike(f"%{category}%"))
    return db.scalars(query.order_by(Vendor.rating.desc())).all()

@app.post("/api/events/{event_id}/quotes", status_code=201)
def add_quote(event_id: int, payload: QuoteCreate, db: Session = Depends(get_db)):
    if not db.get(Event, event_id) or not db.get(Vendor, payload.vendor_id): raise HTTPException(404, "Event or vendor not found")
    quote = Quote(event_id=event_id, **payload.model_dump()); db.add(quote); db.commit(); db.refresh(quote); return quote

@app.post("/api/events/{event_id}/plan")
async def generate_plan(event_id: int, payload: PlanRequest, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event: raise HTTPException(404, "Event not found")
    prompt = f"You are EventMind, an India-first event planner. Event: {event.name}, type {event.event_type}, city {event.city}, guests {event.guests}, budget INR {event.budget}. User asks: {payload.question}. Give concise, practical advice with INR estimates and Indian event context."
    if not settings.groq_api_key:
        return {"answer": f"For {event.name}, start with venue and catering quotes, keep 10–15% of the ₹{event.budget:,.0f} budget as contingency, and confirm guest count before final vendor negotiations. Add your Groq key to unlock tailored suggestions."}
    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
    body = {"model": settings.groq_model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.4, "max_tokens": 500}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
    if response.status_code >= 400: raise HTTPException(502, "AI provider unavailable")
    return {"answer": response.json()["choices"][0]["message"]["content"]}


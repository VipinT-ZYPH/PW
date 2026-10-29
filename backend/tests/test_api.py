import os
os.environ["DATABASE_URL"] = "sqlite:///./test_eventmind.db"
from app.db import Base, SessionLocal, engine
from app.main import create_event, health, summary
from app.schemas import EventCreate

def test_health():
    assert health()["status"] == "ok"

def test_create_event_and_summary():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        event = create_event(EventCreate(name="Aarav & Mira", event_type="Wedding", city="Jaipur", event_date="2027-02-14", guests=180, budget=1200000), db)
        result = summary(event.id, db)
        assert result["planned"] == 1200000
        assert len(result["budget_items"]) == 6


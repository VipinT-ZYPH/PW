from datetime import date
from pydantic import BaseModel, ConfigDict, Field

class EventCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    event_type: str = Field(pattern="^(Wedding|Birthday|Community event|Other)$")
    city: str = Field(min_length=2, max_length=80)
    event_date: date | None = None
    guests: int = Field(ge=1, le=100000)
    budget: float = Field(ge=0, le=1_000_000_000)

class EventRead(EventCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BudgetCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    planned: float = Field(ge=0, le=1_000_000_000)
    actual: float = Field(ge=0, le=1_000_000_000, default=0)

class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    due_date: date | None = None
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")

class TaskUpdate(BaseModel):
    completed: bool

class QuoteCreate(BaseModel):
    vendor_id: int
    amount: float = Field(gt=0, le=1_000_000_000)
    notes: str = Field(default="", max_length=1000)

class PlanRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


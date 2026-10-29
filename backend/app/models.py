from datetime import date, datetime
from typing import Optional
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    event_type: Mapped[str] = mapped_column(String(40))
    city: Mapped[str] = mapped_column(String(80))
    event_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    guests: Mapped[int] = mapped_column(Integer, default=1)
    budget: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    budget_items: Mapped[list["BudgetItem"]] = relationship(cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship(cascade="all, delete-orphan")

class BudgetItem(Base):
    __tablename__ = "budget_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    category: Mapped[str] = mapped_column(String(80))
    planned: Mapped[float] = mapped_column(Float, default=0)
    actual: Mapped[float] = mapped_column(Float, default=0)

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    title: Mapped[str] = mapped_column(String(160))
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed: Mapped[bool] = mapped_column(default=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium")

class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(60))
    city: Mapped[str] = mapped_column(String(80))
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    price_band: Mapped[str] = mapped_column(String(20), default="₹₹")
    description: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str] = mapped_column(String(30), default="")

class Quote(Base):
    __tablename__ = "quotes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"))
    amount: Mapped[float] = mapped_column(Float)
    notes: Mapped[str] = mapped_column(Text, default="")

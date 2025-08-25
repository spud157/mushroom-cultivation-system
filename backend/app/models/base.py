from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to models"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class BaseModel(Base, TimestampMixin):
    """Base model class with id and timestamps"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)

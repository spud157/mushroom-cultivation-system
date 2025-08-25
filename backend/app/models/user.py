from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    VIEWER = "viewer"

class User(BaseModel):
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    # Alert relationships are defined in AlertLog model
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"

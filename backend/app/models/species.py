from sqlalchemy import Column, String, Text, Boolean, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Species(BaseModel):
    __tablename__ = "species"
    
    name = Column(String(100), unique=True, index=True, nullable=False)
    scientific_name = Column(String(150))
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Default environmental parameters (can be overridden by phases)
    default_temperature_min = Column(Float)  # Celsius
    default_temperature_max = Column(Float)
    default_humidity_min = Column(Float)     # Percentage
    default_humidity_max = Column(Float)
    default_co2_min = Column(Float)          # PPM
    default_co2_max = Column(Float)
    default_fae_cycles_per_day = Column(Integer)  # Fresh Air Exchange cycles
    default_light_hours_per_day = Column(Float)
    
    # Additional metadata
    typical_grow_time_days = Column(Integer)
    difficulty_level = Column(String(20))  # beginner, intermediate, advanced
    notes = Column(Text)
    
    # Relationships
    grow_phases = relationship("GrowPhase", back_populates="species", cascade="all, delete-orphan")
    environments = relationship("Environment", back_populates="species")
    automation_rules = relationship("AutomationRule", back_populates="species")
    
    def __repr__(self):
        return f"<Species(name='{self.name}')>"

class GrowPhase(BaseModel):
    __tablename__ = "grow_phases"
    
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    name = Column(String(50), nullable=False)  # colonization, consolidation, fruiting
    order_index = Column(Integer, nullable=False)  # Phase sequence order
    description = Column(Text)
    
    # Phase-specific environmental parameters
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    humidity_min = Column(Float, nullable=False)
    humidity_max = Column(Float, nullable=False)
    co2_min = Column(Float, nullable=False)
    co2_max = Column(Float, nullable=False)
    fae_cycles_per_day = Column(Integer, nullable=False)
    light_hours_per_day = Column(Float, nullable=False)
    
    # Phase timing
    typical_duration_days = Column(Integer)
    min_duration_days = Column(Integer)
    max_duration_days = Column(Integer)
    auto_transition = Column(Boolean, default=False)
    
    # Additional phase-specific settings
    misting_frequency_per_day = Column(Integer, default=0)
    air_circulation_intensity = Column(String(20), default="medium")  # low, medium, high
    special_requirements = Column(JSON)  # Additional custom parameters
    
    # Relationships
    species = relationship("Species", back_populates="grow_phases")
    environments = relationship("Environment", back_populates="current_phase")
    
    def __repr__(self):
        return f"<GrowPhase(species='{self.species.name if self.species else 'Unknown'}', phase='{self.name}')>"

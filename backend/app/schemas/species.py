from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class GrowPhaseBase(BaseModel):
    name: str
    order_index: int
    description: Optional[str] = None
    temperature_min: float
    temperature_max: float
    humidity_min: float
    humidity_max: float
    co2_min: float
    co2_max: float
    fae_cycles_per_day: int
    light_hours_per_day: float
    typical_duration_days: Optional[int] = None
    min_duration_days: Optional[int] = None
    max_duration_days: Optional[int] = None
    auto_transition: bool = False
    misting_frequency_per_day: int = 0
    air_circulation_intensity: str = "medium"
    special_requirements: Optional[Dict[str, Any]] = None

class GrowPhaseCreate(GrowPhaseBase):
    species_id: int

class GrowPhaseUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None
    description: Optional[str] = None
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    humidity_min: Optional[float] = None
    humidity_max: Optional[float] = None
    co2_min: Optional[float] = None
    co2_max: Optional[float] = None
    fae_cycles_per_day: Optional[int] = None
    light_hours_per_day: Optional[float] = None
    typical_duration_days: Optional[int] = None
    min_duration_days: Optional[int] = None
    max_duration_days: Optional[int] = None
    auto_transition: Optional[bool] = None
    misting_frequency_per_day: Optional[int] = None
    air_circulation_intensity: Optional[str] = None
    special_requirements: Optional[Dict[str, Any]] = None

class GrowPhase(GrowPhaseBase):
    id: int
    species_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SpeciesBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    default_temperature_min: Optional[float] = None
    default_temperature_max: Optional[float] = None
    default_humidity_min: Optional[float] = None
    default_humidity_max: Optional[float] = None
    default_co2_min: Optional[float] = None
    default_co2_max: Optional[float] = None
    default_fae_cycles_per_day: Optional[int] = None
    default_light_hours_per_day: Optional[float] = None
    typical_grow_time_days: Optional[int] = None
    difficulty_level: Optional[str] = None
    notes: Optional[str] = None

class SpeciesCreate(SpeciesBase):
    grow_phases: Optional[List[GrowPhaseBase]] = []

class SpeciesUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    default_temperature_min: Optional[float] = None
    default_temperature_max: Optional[float] = None
    default_humidity_min: Optional[float] = None
    default_humidity_max: Optional[float] = None
    default_co2_min: Optional[float] = None
    default_co2_max: Optional[float] = None
    default_fae_cycles_per_day: Optional[int] = None
    default_light_hours_per_day: Optional[float] = None
    typical_grow_time_days: Optional[int] = None
    difficulty_level: Optional[str] = None
    notes: Optional[str] = None

class Species(SpeciesBase):
    id: int
    created_at: datetime
    updated_at: datetime
    grow_phases: List[GrowPhase] = []
    
    class Config:
        from_attributes = True

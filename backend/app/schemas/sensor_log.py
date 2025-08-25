from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SensorLogBase(BaseModel):
    environment_id: int
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    co2_level: Optional[float] = None
    light_level: Optional[float] = None
    airflow: Optional[float] = None
    sensor_type: Optional[str] = None
    sensor_id: Optional[str] = None
    reading_quality: str = "good"
    raw_data: Optional[Dict[str, Any]] = None
    calibration_offset: Optional[Dict[str, Any]] = None

class SensorLogCreate(SensorLogBase):
    pass

class SensorLog(SensorLogBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

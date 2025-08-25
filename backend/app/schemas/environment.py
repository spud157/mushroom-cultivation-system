from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from ..models.environment import EnvironmentStatus

class EnvironmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: EnvironmentStatus = EnvironmentStatus.IDLE
    controller_id: Optional[str] = None
    sensor_config: Optional[Dict[str, Any]] = None
    actuator_config: Optional[Dict[str, Any]] = None
    alert_enabled: bool = True
    alert_delay_minutes: int = 15
    camera_enabled: bool = False
    camera_config: Optional[Dict[str, Any]] = None

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[EnvironmentStatus] = None
    controller_id: Optional[str] = None
    sensor_config: Optional[Dict[str, Any]] = None
    actuator_config: Optional[Dict[str, Any]] = None
    alert_enabled: Optional[bool] = None
    alert_delay_minutes: Optional[int] = None
    camera_enabled: Optional[bool] = None
    camera_config: Optional[Dict[str, Any]] = None

class EnvironmentAssignment(BaseModel):
    species_id: int
    phase_name: Optional[str] = None  # If not provided, use first phase

class EnvironmentOverride(BaseModel):
    temperature_override: Optional[float] = None
    humidity_override: Optional[float] = None
    co2_override: Optional[float] = None
    fan_override: Optional[bool] = None
    humidifier_override: Optional[bool] = None
    heat_mat_override: Optional[bool] = None
    co2_valve_override: Optional[bool] = None
    light_override: Optional[bool] = None
    override_duration_minutes: Optional[int] = None

class Environment(EnvironmentBase):
    id: int
    species_id: Optional[int] = None
    current_phase_id: Optional[int] = None
    phase_start_time: Optional[datetime] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[float] = None
    current_co2: Optional[float] = None
    current_light_level: Optional[float] = None
    current_airflow: Optional[float] = None
    last_sensor_reading: Optional[datetime] = None
    fan_state: bool = False
    humidifier_state: bool = False
    heat_mat_state: bool = False
    co2_valve_state: bool = False
    light_state: bool = False
    last_actuator_update: Optional[datetime] = None
    manual_override_active: bool = False
    override_settings: Optional[Dict[str, Any]] = None
    override_expires_at: Optional[datetime] = None
    last_image_capture: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    phase_elapsed_days: int = 0
    is_assigned: bool = False
    
    class Config:
        from_attributes = True

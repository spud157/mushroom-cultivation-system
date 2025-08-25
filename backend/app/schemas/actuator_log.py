from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from ..models.actuator_log import ActuatorType, ActuatorAction

class ActuatorLogBase(BaseModel):
    environment_id: int
    timestamp: datetime
    actuator_type: ActuatorType
    actuator_id: Optional[str] = None
    relay_pin: Optional[int] = None
    action: ActuatorAction
    previous_state: Optional[bool] = None
    new_state: Optional[bool] = None
    intensity: Optional[float] = None
    duration_seconds: Optional[int] = None
    trigger_source: Optional[str] = None
    trigger_rule_id: Optional[int] = None
    trigger_reason: Optional[str] = None
    power_consumption_watts: Optional[float] = None
    runtime_seconds: Optional[int] = None
    actuator_metadata: Optional[Dict[str, Any]] = None

class ActuatorLogCreate(ActuatorLogBase):
    pass

class ActuatorLog(ActuatorLogBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

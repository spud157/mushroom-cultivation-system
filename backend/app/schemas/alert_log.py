from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from ..models.alert_log import AlertSeverity, AlertStatus, AlertType

class AlertLogBase(BaseModel):
    environment_id: int
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    trigger_value: Optional[float] = None
    threshold_value: Optional[float] = None
    sensor_reading_id: Optional[int] = None
    alert_metadata: Optional[Dict[str, Any]] = None

class AlertLogCreate(AlertLogBase):
    pass

class AlertLogUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    acknowledged_by_id: Optional[int] = None
    resolved_by_id: Optional[int] = None
    notes: Optional[str] = None

class AlertLog(AlertLogBase):
    id: int
    status: AlertStatus
    first_occurrence: datetime
    last_occurrence: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    acknowledged_by_id: Optional[int] = None
    resolved_by_id: Optional[int] = None
    notes: Optional[str] = None
    email_sent: bool = False
    sms_sent: bool = False
    webhook_sent: bool = False
    notification_attempts: int = 0
    last_notification_attempt: Optional[datetime] = None
    recovery_actions: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    duration_minutes: int = 0
    
    class Config:
        from_attributes = True

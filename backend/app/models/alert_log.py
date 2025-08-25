from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Float, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class AlertType(str, enum.Enum):
    TEMPERATURE_HIGH = "temperature_high"
    TEMPERATURE_LOW = "temperature_low"
    HUMIDITY_HIGH = "humidity_high"
    HUMIDITY_LOW = "humidity_low"
    CO2_HIGH = "co2_high"
    CO2_LOW = "co2_low"
    SENSOR_OFFLINE = "sensor_offline"
    ACTUATOR_FAILURE = "actuator_failure"
    PHASE_OVERDUE = "phase_overdue"
    CONTAMINATION_DETECTED = "contamination_detected"
    SYSTEM_ERROR = "system_error"
    CUSTOM = "custom"

class AlertLog(BaseModel):
    __tablename__ = "alert_logs"
    
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False)
    
    # Alert content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Trigger information
    trigger_value = Column(Float)  # The value that triggered the alert
    threshold_value = Column(Float)  # The threshold that was exceeded
    sensor_reading_id = Column(Integer, ForeignKey("sensor_logs.id"), nullable=True)
    
    # Timing
    first_occurrence = Column(DateTime, nullable=False, index=True)
    last_occurrence = Column(DateTime, nullable=False)
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    
    # User interaction
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text)
    
    # Notification tracking
    email_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    webhook_sent = Column(Boolean, default=False)
    notification_attempts = Column(Integer, default=0)
    last_notification_attempt = Column(DateTime)
    
    # Additional data
    alert_metadata = Column(JSON)  # Additional alert-specific data
    recovery_actions = Column(JSON)  # Automated recovery actions taken
    
    # Relationships
    environment = relationship("Environment", back_populates="alert_logs")
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    sensor_reading = relationship("SensorLog")
    
    def __repr__(self):
        return f"<AlertLog(env='{self.environment.name if self.environment else 'Unknown'}', type='{self.alert_type}', severity='{self.severity}')>"
    
    @property
    def is_active(self):
        return self.status == AlertStatus.ACTIVE
    
    @property
    def duration_minutes(self):
        """Calculate alert duration in minutes"""
        end_time = self.resolved_at or self.last_occurrence
        return int((end_time - self.first_occurrence).total_seconds() / 60)

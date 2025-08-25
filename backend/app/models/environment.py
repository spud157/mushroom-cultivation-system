from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class EnvironmentStatus(str, enum.Enum):
    IDLE = "idle"
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class Environment(BaseModel):
    __tablename__ = "environments"
    
    name = Column(String(100), unique=True, index=True, nullable=False)  # e.g., "Environment 1"
    description = Column(String(255))
    location = Column(String(100))  # Physical location description
    status = Column(Enum(EnvironmentStatus), default=EnvironmentStatus.IDLE, nullable=False)
    
    # Current assignment
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    current_phase_id = Column(Integer, ForeignKey("grow_phases.id"), nullable=True)
    phase_start_time = Column(DateTime, nullable=True)
    
    # Hardware configuration
    controller_id = Column(String(50))  # ESP32/Arduino identifier
    sensor_config = Column(JSON)  # Sensor pin mappings and settings
    actuator_config = Column(JSON)  # Relay pin mappings and settings
    
    # Current environmental readings (latest values)
    current_temperature = Column(Float)
    current_humidity = Column(Float)
    current_co2 = Column(Float)
    current_light_level = Column(Float)
    current_airflow = Column(Float)
    last_sensor_reading = Column(DateTime)
    
    # Current actuator states
    fan_state = Column(Boolean, default=False)
    humidifier_state = Column(Boolean, default=False)
    heat_mat_state = Column(Boolean, default=False)
    co2_valve_state = Column(Boolean, default=False)
    light_state = Column(Boolean, default=False)
    last_actuator_update = Column(DateTime)
    
    # Override settings
    manual_override_active = Column(Boolean, default=False)
    override_settings = Column(JSON)  # Manual parameter overrides
    override_expires_at = Column(DateTime, nullable=True)
    
    # Alert settings
    alert_enabled = Column(Boolean, default=True)
    alert_delay_minutes = Column(Integer, default=15)  # Delay before triggering alerts
    
    # Camera settings (optional)
    camera_enabled = Column(Boolean, default=False)
    camera_config = Column(JSON)
    last_image_capture = Column(DateTime)
    
    # Relationships
    species = relationship("Species", back_populates="environments")
    current_phase = relationship("GrowPhase", back_populates="environments")
    sensor_logs = relationship("SensorLog", back_populates="environment")
    actuator_logs = relationship("ActuatorLog", back_populates="environment")
    alert_logs = relationship("AlertLog", back_populates="environment")
    automation_rules = relationship("AutomationRule", back_populates="environment")
    
    def __repr__(self):
        return f"<Environment(name='{self.name}', status='{self.status}')>"
    
    @property
    def phase_elapsed_days(self):
        """Calculate elapsed time in current phase"""
        if not self.phase_start_time:
            return 0
        from datetime import datetime
        return (datetime.utcnow() - self.phase_start_time).days
    
    @property
    def is_assigned(self):
        """Check if environment has a species assigned"""
        return self.species_id is not None

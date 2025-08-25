from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, String, Float, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class ActuatorType(str, enum.Enum):
    FAN = "fan"
    HUMIDIFIER = "humidifier"
    HEAT_MAT = "heat_mat"
    CO2_VALVE = "co2_valve"
    LIGHT = "light"
    MISTER = "mister"
    EXHAUST_FAN = "exhaust_fan"

class ActuatorAction(str, enum.Enum):
    ON = "on"
    OFF = "off"
    ADJUST = "adjust"  # For variable controls

class ActuatorLog(BaseModel):
    __tablename__ = "actuator_logs"
    
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Actuator identification
    actuator_type = Column(Enum(ActuatorType), nullable=False)
    actuator_id = Column(String(50))  # Physical actuator identifier
    relay_pin = Column(Integer)       # GPIO pin number
    
    # Action details
    action = Column(Enum(ActuatorAction), nullable=False)
    previous_state = Column(Boolean)  # Previous on/off state
    new_state = Column(Boolean)       # New on/off state
    intensity = Column(Float)         # For variable controls (0.0-1.0)
    duration_seconds = Column(Integer)  # Planned duration for timed actions
    
    # Trigger information
    trigger_source = Column(String(50))  # automation, manual, schedule, alert
    trigger_rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=True)
    trigger_reason = Column(String(255))  # Human-readable reason
    
    # Power and performance metrics
    power_consumption_watts = Column(Float)
    runtime_seconds = Column(Integer)
    
    # Additional metadata
    actuator_metadata = Column(JSON)  # Additional actuator-specific data
    
    # Relationships
    environment = relationship("Environment", back_populates="actuator_logs")
    trigger_rule = relationship("AutomationRule")
    
    def __repr__(self):
        return f"<ActuatorLog(env='{self.environment.name if self.environment else 'Unknown'}', type='{self.actuator_type}', action='{self.action}')>"

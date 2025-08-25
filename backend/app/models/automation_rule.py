from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Float, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel

class RuleOperator(str, enum.Enum):
    GREATER_THAN = "gt"
    LESS_THAN = "lt"
    GREATER_EQUAL = "gte"
    LESS_EQUAL = "lte"
    EQUAL = "eq"
    NOT_EQUAL = "ne"
    BETWEEN = "between"
    NOT_BETWEEN = "not_between"

class RuleLogic(str, enum.Enum):
    AND = "and"
    OR = "or"

class ActionType(str, enum.Enum):
    SET_ACTUATOR = "set_actuator"
    SEND_ALERT = "send_alert"
    CHANGE_PHASE = "change_phase"
    DELAY = "delay"
    CUSTOM_SCRIPT = "custom_script"

class AutomationRule(BaseModel):
    __tablename__ = "automation_rules"
    
    name = Column(String(200), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=100)  # Lower numbers = higher priority
    
    # Rule scope
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)  # Species-specific rule
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=True)  # Environment-specific rule
    phase_name = Column(String(50), nullable=True)  # Phase-specific rule
    
    # Rule logic
    logic_operator = Column(Enum(RuleLogic), default=RuleLogic.AND, nullable=False)
    
    # Timing constraints
    cooldown_minutes = Column(Integer, default=0)  # Minimum time between rule executions
    max_executions_per_hour = Column(Integer)
    active_hours_start = Column(Integer)  # 0-23, hour when rule becomes active
    active_hours_end = Column(Integer)    # 0-23, hour when rule becomes inactive
    
    # Additional metadata
    created_by_user = Column(String(100))
    rule_source = Column(String(50), default="manual")  # manual, imported, generated
    rule_metadata = Column(JSON)
    
    # Relationships
    species = relationship("Species", back_populates="automation_rules")
    environment = relationship("Environment", back_populates="automation_rules")
    conditions = relationship("RuleCondition", back_populates="rule", cascade="all, delete-orphan")
    actions = relationship("RuleAction", back_populates="rule", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AutomationRule(name='{self.name}', active={self.is_active})>"

class RuleCondition(BaseModel):
    __tablename__ = "rule_conditions"
    
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    
    # Condition definition
    parameter_name = Column(String(50), nullable=False)  # temperature, humidity, co2, etc.
    operator = Column(Enum(RuleOperator), nullable=False)
    threshold_value = Column(Float, nullable=False)
    threshold_value_max = Column(Float)  # For BETWEEN operations
    
    # Time-based conditions
    duration_minutes = Column(Integer, default=0)  # Condition must be true for this duration
    time_window_start = Column(Integer)  # Hour of day (0-23)
    time_window_end = Column(Integer)    # Hour of day (0-23)
    
    # Additional parameters
    sensor_type = Column(String(50))  # Specific sensor type requirement
    ignore_sensor_errors = Column(Boolean, default=False)
    
    # Relationships
    rule = relationship("AutomationRule", back_populates="conditions")
    
    def __repr__(self):
        return f"<RuleCondition(param='{self.parameter_name}', op='{self.operator}', value={self.threshold_value})>"

class RuleAction(BaseModel):
    __tablename__ = "rule_actions"
    
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    execution_order = Column(Integer, default=1)  # Order of action execution
    
    # Action definition
    action_type = Column(Enum(ActionType), nullable=False)
    target_actuator = Column(String(50))  # For SET_ACTUATOR actions
    target_state = Column(Boolean)        # For SET_ACTUATOR actions
    target_intensity = Column(Float)      # For variable actuator controls
    
    # Action parameters
    duration_seconds = Column(Integer)    # Duration for timed actions
    delay_before_seconds = Column(Integer, default=0)  # Delay before executing action
    
    # Alert actions
    alert_message = Column(Text)
    alert_severity = Column(String(20))
    
    # Phase change actions
    target_phase_name = Column(String(50))
    
    # Custom script actions
    script_path = Column(String(255))
    script_parameters = Column(JSON)
    
    # Action metadata
    retry_attempts = Column(Integer, default=0)
    retry_delay_seconds = Column(Integer, default=30)
    
    # Relationships
    rule = relationship("AutomationRule", back_populates="actions")
    
    def __repr__(self):
        return f"<RuleAction(type='{self.action_type}', target='{self.target_actuator}')>"

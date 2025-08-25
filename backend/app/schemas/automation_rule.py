from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.automation_rule import RuleOperator, RuleLogic, ActionType

class RuleConditionBase(BaseModel):
    parameter_name: str
    operator: RuleOperator
    threshold_value: float
    threshold_value_max: Optional[float] = None
    duration_minutes: int = 0
    time_window_start: Optional[int] = None
    time_window_end: Optional[int] = None
    sensor_type: Optional[str] = None
    ignore_sensor_errors: bool = False

class RuleConditionCreate(RuleConditionBase):
    rule_id: int

class RuleCondition(RuleConditionBase):
    id: int
    rule_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RuleActionBase(BaseModel):
    execution_order: int = 1
    action_type: ActionType
    target_actuator: Optional[str] = None
    target_state: Optional[bool] = None
    target_intensity: Optional[float] = None
    duration_seconds: Optional[int] = None
    delay_before_seconds: int = 0
    alert_message: Optional[str] = None
    alert_severity: Optional[str] = None
    target_phase_name: Optional[str] = None
    script_path: Optional[str] = None
    script_parameters: Optional[Dict[str, Any]] = None
    retry_attempts: int = 0
    retry_delay_seconds: int = 30

class RuleActionCreate(RuleActionBase):
    rule_id: int

class RuleAction(RuleActionBase):
    id: int
    rule_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AutomationRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    priority: int = 100
    species_id: Optional[int] = None
    environment_id: Optional[int] = None
    phase_name: Optional[str] = None
    logic_operator: RuleLogic = RuleLogic.AND
    cooldown_minutes: int = 0
    max_executions_per_hour: Optional[int] = None
    active_hours_start: Optional[int] = None
    active_hours_end: Optional[int] = None
    created_by_user: Optional[str] = None
    rule_source: str = "manual"
    rule_metadata: Optional[Dict[str, Any]] = None

class AutomationRuleCreate(AutomationRuleBase):
    conditions: List[RuleConditionBase] = []
    actions: List[RuleActionBase] = []

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    species_id: Optional[int] = None
    environment_id: Optional[int] = None
    phase_name: Optional[str] = None
    logic_operator: Optional[RuleLogic] = None
    cooldown_minutes: Optional[int] = None
    max_executions_per_hour: Optional[int] = None
    active_hours_start: Optional[int] = None
    active_hours_end: Optional[int] = None
    rule_metadata: Optional[Dict[str, Any]] = None

class AutomationRule(AutomationRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    conditions: List[RuleCondition] = []
    actions: List[RuleAction] = []
    
    class Config:
        from_attributes = True

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models import AutomationRule as AutomationRuleModel, RuleCondition as RuleConditionModel, RuleAction as RuleActionModel
from ..schemas import AutomationRule, AutomationRuleCreate, AutomationRuleUpdate

router = APIRouter()

@router.get("/", response_model=List[AutomationRule])
def get_automation_rules(
    environment_id: int = None,
    species_id: int = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get automation rules with optional filtering"""
    query = db.query(AutomationRuleModel)
    
    if environment_id:
        query = query.filter(AutomationRuleModel.environment_id == environment_id)
    
    if species_id:
        query = query.filter(AutomationRuleModel.species_id == species_id)
    
    if active_only:
        query = query.filter(AutomationRuleModel.is_active == True)
    
    rules = query.order_by(AutomationRuleModel.priority).offset(skip).limit(limit).all()
    return rules

@router.get("/{rule_id}", response_model=AutomationRule)
def get_automation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Get a specific automation rule by ID"""
    rule = db.query(AutomationRuleModel).filter(AutomationRuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    return rule

@router.post("/", response_model=AutomationRule, status_code=status.HTTP_201_CREATED)
def create_automation_rule(rule: AutomationRuleCreate, db: Session = Depends(get_db)):
    """Create a new automation rule with conditions and actions"""
    # Create the rule
    db_rule = AutomationRuleModel(**rule.dict(exclude={"conditions", "actions"}))
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    # Create conditions
    for condition_data in rule.conditions:
        condition = RuleConditionModel(**condition_data.dict(), rule_id=db_rule.id)
        db.add(condition)
    
    # Create actions
    for action_data in rule.actions:
        action = RuleActionModel(**action_data.dict(), rule_id=db_rule.id)
        db.add(action)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/{rule_id}", response_model=AutomationRule)
def update_automation_rule(
    rule_id: int,
    rule_update: AutomationRuleUpdate,
    db: Session = Depends(get_db)
):
    """Update an automation rule"""
    rule = db.query(AutomationRuleModel).filter(AutomationRuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    update_data = rule_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}")
def delete_automation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete an automation rule"""
    rule = db.query(AutomationRuleModel).filter(AutomationRuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found"
        )
    
    db.delete(rule)
    db.commit()
    return {"message": "Automation rule deleted successfully"}

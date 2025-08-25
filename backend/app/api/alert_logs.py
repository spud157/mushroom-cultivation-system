from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models import AlertLog as AlertLogModel
from ..schemas import AlertLog, AlertLogCreate, AlertLogUpdate

router = APIRouter()

@router.get("/", response_model=List[AlertLog])
def get_alert_logs(
    environment_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    active_only: bool = Query(False),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get alert logs with optional filtering"""
    query = db.query(AlertLogModel)
    
    if environment_id:
        query = query.filter(AlertLogModel.environment_id == environment_id)
    
    if status_filter:
        query = query.filter(AlertLogModel.status == status_filter)
    
    if severity:
        query = query.filter(AlertLogModel.severity == severity)
    
    if active_only:
        query = query.filter(AlertLogModel.status == "active")
    
    logs = query.order_by(AlertLogModel.first_occurrence.desc()).offset(skip).limit(limit).all()
    return logs

@router.post("/", response_model=AlertLog, status_code=status.HTTP_201_CREATED)
def create_alert_log(alert_log: AlertLogCreate, db: Session = Depends(get_db)):
    """Create a new alert log entry"""
    db_log = AlertLogModel(**alert_log.dict())
    db_log.first_occurrence = datetime.utcnow()
    db_log.last_occurrence = datetime.utcnow()
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.put("/{alert_id}", response_model=AlertLog)
def update_alert_log(
    alert_id: int,
    alert_update: AlertLogUpdate,
    db: Session = Depends(get_db)
):
    """Update an alert log (acknowledge, resolve, etc.)"""
    alert = db.query(AlertLogModel).filter(AlertLogModel.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    update_data = alert_update.dict(exclude_unset=True)
    
    # Set timestamps based on status changes
    if "status" in update_data:
        if update_data["status"] == "acknowledged" and not alert.acknowledged_at:
            update_data["acknowledged_at"] = datetime.utcnow()
        elif update_data["status"] == "resolved" and not alert.resolved_at:
            update_data["resolved_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    db.commit()
    db.refresh(alert)
    return alert

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models import ActuatorLog as ActuatorLogModel
from ..schemas import ActuatorLog, ActuatorLogCreate

router = APIRouter()

@router.get("/", response_model=List[ActuatorLog])
def get_actuator_logs(
    environment_id: Optional[int] = Query(None),
    actuator_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """Get actuator logs with optional filtering"""
    query = db.query(ActuatorLogModel)
    
    if environment_id:
        query = query.filter(ActuatorLogModel.environment_id == environment_id)
    
    if actuator_type:
        query = query.filter(ActuatorLogModel.actuator_type == actuator_type)
    
    if start_date:
        query = query.filter(ActuatorLogModel.timestamp >= start_date)
    
    if end_date:
        query = query.filter(ActuatorLogModel.timestamp <= end_date)
    
    logs = query.order_by(ActuatorLogModel.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

@router.post("/", response_model=ActuatorLog, status_code=status.HTTP_201_CREATED)
def create_actuator_log(actuator_log: ActuatorLogCreate, db: Session = Depends(get_db)):
    """Create a new actuator log entry"""
    db_log = ActuatorLogModel(**actuator_log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

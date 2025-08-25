from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models import SensorLog as SensorLogModel
from ..schemas import SensorLog, SensorLogCreate

router = APIRouter()

@router.get("/", response_model=List[SensorLog])
def get_sensor_logs(
    environment_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """Get sensor logs with optional filtering"""
    query = db.query(SensorLogModel)
    
    if environment_id:
        query = query.filter(SensorLogModel.environment_id == environment_id)
    
    if start_date:
        query = query.filter(SensorLogModel.timestamp >= start_date)
    
    if end_date:
        query = query.filter(SensorLogModel.timestamp <= end_date)
    
    logs = query.order_by(SensorLogModel.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

@router.post("/", response_model=SensorLog, status_code=status.HTTP_201_CREATED)
def create_sensor_log(sensor_log: SensorLogCreate, db: Session = Depends(get_db)):
    """Create a new sensor log entry"""
    db_log = SensorLogModel(**sensor_log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/latest/{environment_id}", response_model=SensorLog)
def get_latest_sensor_reading(environment_id: int, db: Session = Depends(get_db)):
    """Get the latest sensor reading for an environment"""
    latest_log = db.query(SensorLogModel).filter(
        SensorLogModel.environment_id == environment_id
    ).order_by(SensorLogModel.timestamp.desc()).first()
    
    if not latest_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sensor readings found for this environment"
        )
    
    return latest_log

@router.get("/export/{environment_id}")
def export_sensor_data(
    environment_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    format: str = Query("json", regex="^(json|csv)$"),
    db: Session = Depends(get_db)
):
    """Export sensor data for an environment"""
    query = db.query(SensorLogModel).filter(SensorLogModel.environment_id == environment_id)
    
    if start_date:
        query = query.filter(SensorLogModel.timestamp >= start_date)
    
    if end_date:
        query = query.filter(SensorLogModel.timestamp <= end_date)
    
    logs = query.order_by(SensorLogModel.timestamp).all()
    
    if format == "csv":
        # Return CSV format (simplified)
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["timestamp", "temperature", "humidity", "co2_level", "light_level", "airflow"])
        
        for log in logs:
            writer.writerow([
                log.timestamp,
                log.temperature,
                log.humidity,
                log.co2_level,
                log.light_level,
                log.airflow
            ])
        
        return {"data": output.getvalue(), "format": "csv"}
    
    # Return JSON format
    return {
        "data": [
            {
                "timestamp": log.timestamp,
                "temperature": log.temperature,
                "humidity": log.humidity,
                "co2_level": log.co2_level,
                "light_level": log.light_level,
                "airflow": log.airflow,
                "sensor_type": log.sensor_type,
                "reading_quality": log.reading_quality
            }
            for log in logs
        ],
        "format": "json",
        "count": len(logs)
    }

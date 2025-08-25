"""
Sensor data API endpoints
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..models.sensor_log import SensorLog
from ..models.environment import Environment
from ..models.species import Species
from ..schemas.sensor_log import SensorLog as SensorLogResponse, SensorLogCreate
from ..services.sensor_simulator import sensor_simulator

router = APIRouter()


@router.get("/environments/{environment_id}/sensors/latest", response_model=List[SensorLogResponse])
async def get_latest_sensor_readings(
    environment_id: int,
    db: Session = Depends(get_db)
):
    """Get the latest sensor readings for an environment"""
    
    # Check if environment exists
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    # Get latest reading for each sensor type
    sensor_types = ['temperature', 'humidity', 'co2', 'airflow']
    latest_readings = []
    
    for sensor_type in sensor_types:
        latest = db.query(SensorLog).filter(
            SensorLog.environment_id == environment_id,
            SensorLog.sensor_type == sensor_type
        ).order_by(desc(SensorLog.timestamp)).first()
        
        if latest:
            latest_readings.append(latest)
    
    return latest_readings


@router.get("/environments/{environment_id}/sensors/history", response_model=List[SensorLogResponse])
async def get_sensor_history(
    environment_id: int,
    sensor_type: Optional[str] = Query(None, description="Filter by sensor type"),
    hours: int = Query(24, description="Number of hours of history to retrieve"),
    db: Session = Depends(get_db)
):
    """Get historical sensor data for an environment"""
    
    # Check if environment exists
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    # Calculate time range
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Build query
    query = db.query(SensorLog).filter(
        SensorLog.environment_id == environment_id,
        SensorLog.timestamp >= start_time
    )
    
    if sensor_type:
        query = query.filter(SensorLog.sensor_type == sensor_type)
    
    readings = query.order_by(SensorLog.timestamp).all()
    return readings


@router.post("/environments/{environment_id}/sensors/simulate")
async def simulate_sensor_readings(
    environment_id: int,
    db: Session = Depends(get_db)
):
    """Generate simulated sensor readings for an environment"""
    
    # Check if environment exists
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    # Get species if assigned
    species = None
    if environment.species_id:
        species = db.query(Species).filter(Species.id == environment.species_id).first()
    
    # Generate new sensor readings
    logs = sensor_simulator.create_sensor_logs(db, environment_id, species)
    
    return {
        "message": f"Generated {len(logs)} sensor readings",
        "readings": logs
    }


@router.post("/environments/{environment_id}/sensors/generate-history")
async def generate_historical_data(
    environment_id: int,
    days: int = Query(7, description="Number of days of historical data to generate"),
    db: Session = Depends(get_db)
):
    """Generate historical sensor data for testing and visualization"""
    
    # Check if environment exists
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    # Check if historical data already exists
    existing_data = db.query(SensorLog).filter(
        SensorLog.environment_id == environment_id
    ).first()
    
    if existing_data:
        return {"message": "Historical data already exists for this environment"}
    
    # Generate historical data
    logs = sensor_simulator.generate_historical_data(db, environment_id, days)
    
    return {
        "message": f"Generated {len(logs)} historical sensor readings for {days} days",
        "environment_id": environment_id
    }


@router.get("/sensors/summary")
async def get_all_sensors_summary(db: Session = Depends(get_db)):
    """Get a summary of latest sensor readings for all environments"""
    
    environments = db.query(Environment).all()
    summary = []
    
    for env in environments:
        # Get latest readings for this environment
        sensor_types = ['temperature', 'humidity', 'co2', 'airflow']
        env_readings = {}
        
        for sensor_type in sensor_types:
            latest = db.query(SensorLog).filter(
                SensorLog.environment_id == env.id,
                SensorLog.sensor_type == sensor_type
            ).order_by(desc(SensorLog.timestamp)).first()
            
            if latest:
                env_readings[sensor_type] = {
                    "value": latest.value,
                    "unit": latest.unit,
                    "timestamp": latest.timestamp
                }
        
        summary.append({
            "environment_id": env.id,
            "environment_name": env.name,
            "species_name": env.species.name if env.species else None,
            "readings": env_readings
        })
    
    return summary


@router.post("/sensors/simulate-all")
async def simulate_all_environments(db: Session = Depends(get_db)):
    """Generate sensor readings for all environments"""
    
    environments = db.query(Environment).all()
    total_logs = 0
    
    for env in environments:
        species = None
        if env.species_id:
            species = db.query(Species).filter(Species.id == env.species_id).first()
        
        logs = sensor_simulator.create_sensor_logs(db, env.id, species)
        total_logs += len(logs)
    
    return {
        "message": f"Generated sensor readings for {len(environments)} environments",
        "total_readings": total_logs
    }

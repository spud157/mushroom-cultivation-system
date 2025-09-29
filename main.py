from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
import random

# Import database models and functions
from database import (
    get_db, init_db, create_tables, 
    Species, Environment, Batch, SensorReading, ActionLog,
    BatchStatus, CellStatus
)

# Create FastAPI app
app = FastAPI(title="Mushroom Cultivation System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    init_db()

# Root endpoint - serve the main dashboard
@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_dir, "grow.html"))

# API Endpoints

# Species endpoints
@app.get("/api/species/", response_model=List[dict])
def get_species(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    species = db.query(Species).offset(skip).limit(limit).all()
    return [{
        "id": s.id,
        "name": s.name,
        "scientific_name": s.scientific_name,
        "description": s.description,
        "difficulty_level": s.difficulty_level,
        "typical_grow_time_days": s.typical_grow_time_days,
        "default_temperature_min": s.default_temperature_min,
        "default_temperature_max": s.default_temperature_max,
        "default_humidity_min": s.default_humidity_min,
        "default_humidity_max": s.default_humidity_max,
        "default_co2_min": s.default_co2_min,
        "default_co2_max": s.default_co2_max,
        "default_fae_cycles_per_day": s.default_fae_cycles_per_day,
        "default_light_hours_per_day": s.default_light_hours_per_day
    } for s in species]

# Environment endpoints
@app.get("/api/environments/", response_model=List[dict])
def get_environments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    environments = db.query(Environment).offset(skip).limit(limit).all()
    return [{
        "id": env.id,
        "name": env.name,
        "location": env.location,
        "description": env.description,
        "is_active": env.is_active,
        "species_id": env.species_id,
        "current_phase": env.current_phase,
        "temperature": env.temperature,
        "humidity": env.humidity,
        "co2": env.co2,
        "airflow": env.airflow
    } for env in environments]

# Batch endpoints
@app.get("/api/batches/", response_model=List[dict])
def get_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    batches = db.query(Batch).offset(skip).limit(limit).all()
    return [{
        "id": b.id,
        "name": b.name,
        "species_id": b.species_id,
        "environment_id": b.environment_id,
        "start_date": b.start_date.isoformat() if b.start_date else None,
        "end_date": b.end_date.isoformat() if b.end_date else None,
        "status": b.status.value,
        "current_phase": b.current_phase,
        "phase_start_date": b.phase_start_date.isoformat() if b.phase_start_date else None
    } for b in batches]

# Sensor data endpoints
@app.get("/api/environments/{environment_id}/sensors/latest")
def get_latest_sensor_data(environment_id: int, db: Session = Depends(get_db)):
    # Get the latest sensor reading for the environment
    reading = db.query(SensorReading)\
        .filter(SensorReading.environment_id == environment_id)\
        .order_by(SensorReading.timestamp.desc())\
        .first()
    
    if not reading:
        # Return default values if no readings exist
        return {
            "temperature": 22.0,
            "humidity": 70.0,
            "co2": 800,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return {
        "temperature": reading.temperature,
        "humidity": reading.humidity,
        "co2": reading.co2,
        "timestamp": reading.timestamp.isoformat()
    }

# Assign species to environment
@app.post("/api/environments/{environment_id}/assign")
def assign_species_to_environment(environment_id: int, assignment: dict, db: Session = Depends(get_db)):
    env = db.query(Environment).filter(Environment.id == environment_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    species_id = assignment.get("species_id")
    if species_id is not None:
        species = db.query(Species).filter(Species.id == species_id).first()
        if not species:
            raise HTTPException(status_code=400, detail="Invalid species_id")
        env.species_id = species_id
    else:
        env.species_id = None
    
    db.commit()
    return {"status": "success", "message": "Environment updated successfully"}

# Serve frontend files
@app.get("/{path:path}")
async def serve_frontend(path: str):
    # Try to serve the requested file
    file_path = os.path.join(frontend_dir, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # For SPA routing, serve index.html for any unknown path
    return FileResponse(os.path.join(frontend_dir, "grow.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..models import Environment as EnvironmentModel, Species as SpeciesModel, GrowPhase as GrowPhaseModel
from ..schemas import Environment, EnvironmentCreate, EnvironmentUpdate, EnvironmentAssignment, EnvironmentOverride

router = APIRouter()

@router.get("/", response_model=List[Environment])
def get_environments(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """Get all grow environments"""
    query = db.query(EnvironmentModel)
    if status_filter:
        query = query.filter(EnvironmentModel.status == status_filter)
    environments = query.offset(skip).limit(limit).all()
    
    # Calculate computed properties
    for env in environments:
        env.is_assigned = env.species_id is not None
        if env.phase_start_time:
            env.phase_elapsed_days = (datetime.utcnow() - env.phase_start_time).days
        else:
            env.phase_elapsed_days = 0
    
    return environments

@router.get("/{environment_id}", response_model=Environment)
def get_environment(environment_id: int, db: Session = Depends(get_db)):
    """Get a specific environment by ID"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    # Calculate computed properties
    environment.is_assigned = environment.species_id is not None
    if environment.phase_start_time:
        environment.phase_elapsed_days = (datetime.utcnow() - environment.phase_start_time).days
    else:
        environment.phase_elapsed_days = 0
    
    return environment

@router.post("/", response_model=Environment, status_code=status.HTTP_201_CREATED)
def create_environment(environment: EnvironmentCreate, db: Session = Depends(get_db)):
    """Create a new grow environment"""
    # Check if environment name already exists
    existing = db.query(EnvironmentModel).filter(EnvironmentModel.name == environment.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Environment with this name already exists"
        )
    
    db_environment = EnvironmentModel(**environment.dict())
    db.add(db_environment)
    db.commit()
    db.refresh(db_environment)
    return db_environment

@router.put("/{environment_id}", response_model=Environment)
def update_environment(
    environment_id: int,
    environment_update: EnvironmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    update_data = environment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(environment, field, value)
    
    db.commit()
    db.refresh(environment)
    return environment

@router.delete("/{environment_id}")
def delete_environment(environment_id: int, db: Session = Depends(get_db)):
    """Delete an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    db.delete(environment)
    db.commit()
    return {"message": "Environment deleted successfully"}

@router.post("/{environment_id}/assign", response_model=Environment)
def assign_species_to_environment(
    environment_id: int,
    assignment: EnvironmentAssignment,
    db: Session = Depends(get_db)
):
    """Assign a mushroom species to an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    species = db.query(SpeciesModel).filter(SpeciesModel.id == assignment.species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    
    # Find the appropriate phase
    if assignment.phase_name:
        phase = db.query(GrowPhaseModel).filter(
            GrowPhaseModel.species_id == assignment.species_id,
            GrowPhaseModel.name == assignment.phase_name
        ).first()
    else:
        # Use the first phase (lowest order_index)
        phase = db.query(GrowPhaseModel).filter(
            GrowPhaseModel.species_id == assignment.species_id
        ).order_by(GrowPhaseModel.order_index).first()
    
    if not phase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suitable grow phase found for this species"
        )
    
    # Assign species and phase to environment
    environment.species_id = assignment.species_id
    environment.current_phase_id = phase.id
    environment.phase_start_time = datetime.utcnow()
    environment.status = "active"
    
    db.commit()
    db.refresh(environment)
    return environment

@router.post("/{environment_id}/unassign")
def unassign_species_from_environment(environment_id: int, db: Session = Depends(get_db)):
    """Remove species assignment from an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    environment.species_id = None
    environment.current_phase_id = None
    environment.phase_start_time = None
    environment.status = "idle"
    environment.manual_override_active = False
    environment.override_settings = None
    environment.override_expires_at = None
    
    db.commit()
    return {"message": "Species unassigned successfully"}

@router.post("/{environment_id}/change-phase")
def change_environment_phase(
    environment_id: int,
    phase_name: str,
    db: Session = Depends(get_db)
):
    """Change the current grow phase of an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    if not environment.species_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Environment must have a species assigned to change phases"
        )
    
    # Find the new phase
    new_phase = db.query(GrowPhaseModel).filter(
        GrowPhaseModel.species_id == environment.species_id,
        GrowPhaseModel.name == phase_name
    ).first()
    
    if not new_phase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Phase '{phase_name}' not found for assigned species"
        )
    
    environment.current_phase_id = new_phase.id
    environment.phase_start_time = datetime.utcnow()
    
    db.commit()
    return {"message": f"Phase changed to '{phase_name}' successfully"}

@router.post("/{environment_id}/override", response_model=Environment)
def set_environment_override(
    environment_id: int,
    override: EnvironmentOverride,
    db: Session = Depends(get_db)
):
    """Set manual overrides for environment parameters"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    # Build override settings
    override_settings = {}
    override_data = override.dict(exclude_unset=True, exclude={"override_duration_minutes"})
    
    for key, value in override_data.items():
        if value is not None:
            override_settings[key] = value
    
    environment.manual_override_active = len(override_settings) > 0
    environment.override_settings = override_settings if override_settings else None
    
    # Set expiration time if duration is specified
    if override.override_duration_minutes and override_settings:
        from datetime import timedelta
        environment.override_expires_at = datetime.utcnow() + timedelta(minutes=override.override_duration_minutes)
    else:
        environment.override_expires_at = None
    
    db.commit()
    db.refresh(environment)
    return environment

@router.delete("/{environment_id}/override")
def clear_environment_override(environment_id: int, db: Session = Depends(get_db)):
    """Clear all manual overrides for an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    environment.manual_override_active = False
    environment.override_settings = None
    environment.override_expires_at = None
    
    db.commit()
    return {"message": "Manual overrides cleared successfully"}

@router.get("/{environment_id}/status")
def get_environment_status(environment_id: int, db: Session = Depends(get_db)):
    """Get detailed status information for an environment"""
    environment = db.query(EnvironmentModel).filter(EnvironmentModel.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    
    status_info = {
        "environment_id": environment.id,
        "name": environment.name,
        "status": environment.status,
        "is_assigned": environment.species_id is not None,
        "species_name": environment.species.name if environment.species else None,
        "current_phase": environment.current_phase.name if environment.current_phase else None,
        "phase_elapsed_days": environment.phase_elapsed_days if environment.phase_start_time else 0,
        "current_readings": {
            "temperature": environment.current_temperature,
            "humidity": environment.current_humidity,
            "co2": environment.current_co2,
            "light_level": environment.current_light_level,
            "airflow": environment.current_airflow,
            "last_reading": environment.last_sensor_reading
        },
        "actuator_states": {
            "fan": environment.fan_state,
            "humidifier": environment.humidifier_state,
            "heat_mat": environment.heat_mat_state,
            "co2_valve": environment.co2_valve_state,
            "light": environment.light_state,
            "last_update": environment.last_actuator_update
        },
        "manual_override_active": environment.manual_override_active,
        "override_settings": environment.override_settings,
        "override_expires_at": environment.override_expires_at
    }
    
    return status_info

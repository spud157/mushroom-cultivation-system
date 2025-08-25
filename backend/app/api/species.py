from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models import Species as SpeciesModel, GrowPhase as GrowPhaseModel
from ..schemas import Species, SpeciesCreate, SpeciesUpdate, GrowPhase, GrowPhaseCreate, GrowPhaseUpdate

router = APIRouter()

@router.get("/", response_model=List[Species])
def get_species(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all mushroom species with their grow phases"""
    query = db.query(SpeciesModel)
    if active_only:
        query = query.filter(SpeciesModel.is_active == True)
    species = query.offset(skip).limit(limit).all()
    return species

@router.get("/{species_id}", response_model=Species)
def get_species_by_id(species_id: int, db: Session = Depends(get_db)):
    """Get a specific species by ID"""
    species = db.query(SpeciesModel).filter(SpeciesModel.id == species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    return species

@router.post("/", response_model=Species, status_code=status.HTTP_201_CREATED)
def create_species(species: SpeciesCreate, db: Session = Depends(get_db)):
    """Create a new mushroom species with grow phases"""
    # Check if species name already exists
    existing = db.query(SpeciesModel).filter(SpeciesModel.name == species.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Species with this name already exists"
        )
    
    # Create species
    db_species = SpeciesModel(**species.dict(exclude={"grow_phases"}))
    db.add(db_species)
    db.commit()
    db.refresh(db_species)
    
    # Create grow phases
    for phase_data in species.grow_phases:
        phase = GrowPhaseModel(**phase_data.dict(), species_id=db_species.id)
        db.add(phase)
    
    db.commit()
    db.refresh(db_species)
    return db_species

@router.put("/{species_id}", response_model=Species)
def update_species(
    species_id: int,
    species_update: SpeciesUpdate,
    db: Session = Depends(get_db)
):
    """Update a species"""
    species = db.query(SpeciesModel).filter(SpeciesModel.id == species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    
    # Update species fields
    update_data = species_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(species, field, value)
    
    db.commit()
    db.refresh(species)
    return species

@router.delete("/{species_id}")
def delete_species(species_id: int, db: Session = Depends(get_db)):
    """Delete a species (soft delete by setting is_active=False)"""
    species = db.query(SpeciesModel).filter(SpeciesModel.id == species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    
    species.is_active = False
    db.commit()
    return {"message": "Species deactivated successfully"}

# Grow Phase endpoints
@router.get("/{species_id}/phases", response_model=List[GrowPhase])
def get_species_phases(species_id: int, db: Session = Depends(get_db)):
    """Get all grow phases for a species"""
    species = db.query(SpeciesModel).filter(SpeciesModel.id == species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    
    phases = db.query(GrowPhaseModel).filter(
        GrowPhaseModel.species_id == species_id
    ).order_by(GrowPhaseModel.order_index).all()
    return phases

@router.post("/{species_id}/phases", response_model=GrowPhase, status_code=status.HTTP_201_CREATED)
def create_grow_phase(
    species_id: int,
    phase: GrowPhaseCreate,
    db: Session = Depends(get_db)
):
    """Create a new grow phase for a species"""
    species = db.query(SpeciesModel).filter(SpeciesModel.id == species_id).first()
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Species not found"
        )
    
    db_phase = GrowPhaseModel(**phase.dict(exclude={"species_id"}), species_id=species_id)
    db.add(db_phase)
    db.commit()
    db.refresh(db_phase)
    return db_phase

@router.put("/phases/{phase_id}", response_model=GrowPhase)
def update_grow_phase(
    phase_id: int,
    phase_update: GrowPhaseUpdate,
    db: Session = Depends(get_db)
):
    """Update a grow phase"""
    phase = db.query(GrowPhaseModel).filter(GrowPhaseModel.id == phase_id).first()
    if not phase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grow phase not found"
        )
    
    update_data = phase_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(phase, field, value)
    
    db.commit()
    db.refresh(phase)
    return phase

@router.delete("/phases/{phase_id}")
def delete_grow_phase(phase_id: int, db: Session = Depends(get_db)):
    """Delete a grow phase"""
    phase = db.query(GrowPhaseModel).filter(GrowPhaseModel.id == phase_id).first()
    if not phase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grow phase not found"
        )
    
    db.delete(phase)
    db.commit()
    return {"message": "Grow phase deleted successfully"}

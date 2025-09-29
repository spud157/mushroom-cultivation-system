from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

# Create SQLAlchemy engine and session
SQLALCHEMY_DATABASE_URL = "sqlite:///./mushroom_cultivation.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Enums
class BatchStatus(str, enum.Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    ABORTED = "Aborted"

class CellStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    MAINTENANCE = "Maintenance"
    OFFLINE = "Offline"

# Models
class Species(Base):
    __tablename__ = "species"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    scientific_name = Column(String)
    description = Column(String)
    difficulty_level = Column(String)
    typical_grow_time_days = Column(Integer)
    default_temperature_min = Column(Float)
    default_temperature_max = Column(Float)
    default_humidity_min = Column(Float)
    default_humidity_max = Column(Float)
    default_co2_min = Column(Integer)
    default_co2_max = Column(Integer)
    default_fae_cycles_per_day = Column(Integer)
    default_light_hours_per_day = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    batches = relationship("Batch", back_populates="species")

class Environment(Base):
    __tablename__ = "environments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)
    current_phase = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    co2 = Column(Integer, nullable=True)
    airflow = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    batches = relationship("Batch", back_populates="environment")

class Batch(Base):
    __tablename__ = "batches"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    species_id = Column(Integer, ForeignKey("species.id"))
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(Enum(BatchStatus), default=BatchStatus.PENDING)
    notes = Column(String, nullable=True)
    target_parameters = Column(JSON, default={})
    current_phase = Column(String, nullable=True)
    phase_start_date = Column(DateTime, nullable=True)
    phase_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    species = relationship("Species", back_populates="batches")
    environment = relationship("Environment", back_populates="batches")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id"))
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    co2 = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
class ActionLog(Base):
    __tablename__ = "action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=True)
    action = Column(String)
    actor = Column(String)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the database with sample data if needed
def init_db():
    db = SessionLocal()
    try:
        # Check if species table is empty
        if not db.query(Species).first():
            # Add sample species
            sample_species = [
                {
                    "name": "Lion's Mane",
                    "scientific_name": "Hericium erinaceus",
                    "description": "A distinctive white, shaggy mushroom with cascading spines.",
                    "difficulty_level": "Beginner",
                    "typical_grow_time_days": 14,
                    "default_temperature_min": 18.0,
                    "default_temperature_max": 24.0,
                    "default_humidity_min": 85.0,
                    "default_humidity_max": 95.0,
                    "default_co2_min": 500,
                    "default_co2_max": 1000,
                    "default_fae_cycles_per_day": 4,
                    "default_light_hours_per_day": 12
                },
                {
                    "name": "Oyster",
                    "scientific_name": "Pleurotus ostreatus",
                    "description": "Fast-growing and versatile with a mild, nutty flavor.",
                    "difficulty_level": "Beginner",
                    "typical_grow_time_days": 10,
                    "default_temperature_min": 15.0,
                    "default_temperature_max": 25.0,
                    "default_humidity_min": 80.0,
                    "default_humidity_max": 95.0,
                    "default_co2_min": 600,
                    "default_co2_max": 1200,
                    "default_fae_cycles_per_day": 4,
                    "default_light_hours_per_day": 12
                }
            ]
            
            for species_data in sample_species:
                species = Species(**species_data)
                db.add(species)
            
            # Add sample environments
            environments = [
                {"name": "Chamber 1", "location": "Rack A - Level 1", "description": "Primary growing chamber"},
                {"name": "Chamber 2", "location": "Rack A - Level 2", "description": "Secondary growing chamber"},
                {"name": "Chamber 3", "location": "Rack B - Level 1", "description": "Experimental chamber"}
            ]
            
            for env_data in environments:
                environment = Environment(**env_data)
                db.add(environment)
            
            db.commit()
            print("Database initialized with sample data")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

# Create tables and initialize with sample data
if __name__ == "__main__":
    create_tables()
    init_db()
    print("Database setup complete")

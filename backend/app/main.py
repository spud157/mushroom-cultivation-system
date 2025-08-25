from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .core.database import create_tables, get_db
from .core.seed_data import seed_database
from .api import species, environments, users, sensor_logs, actuator_logs, alert_logs, automation_rules, sensors

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="A comprehensive automation system for mushroom cultivation with independent grow chambers, species-specific environmental control, and phase-based automation.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.LOG_DIR, exist_ok=True)
os.makedirs(settings.BACKUP_DIR, exist_ok=True)

# Include API routers FIRST (before static files to prevent conflicts)
app.include_router(species.router, prefix="/api/species", tags=["species"])
app.include_router(environments.router, prefix="/api/environments", tags=["environments"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(sensor_logs.router, prefix="/api/sensor-logs", tags=["sensor_logs"])
app.include_router(actuator_logs.router, prefix="/api/actuator-logs", tags=["actuator_logs"])
app.include_router(alert_logs.router, prefix="/api/alert-logs", tags=["alert_logs"])
app.include_router(automation_rules.router, prefix="/api/automation-rules", tags=["automation_rules"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])

# Mount static files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount frontend static files LAST (so API routes take precedence)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.on_event("startup")
async def startup_event():
    """Initialize database and create tables on startup"""
    create_tables()
    
    # Seed database with default data
    db = next(get_db())
    try:
        seed_database(db)
    except Exception as e:
        print(f"Warning: Database seeding failed: {e}")
    finally:
        db.close()
    
    print(f"{settings.APP_NAME} v{settings.VERSION} started successfully!")
    print(f"API Documentation: http://localhost:8000/api/docs")
    print(f"Database: {settings.DATABASE_URL}")

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "status": "running",
        "docs_url": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

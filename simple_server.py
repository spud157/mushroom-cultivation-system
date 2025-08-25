#!/usr/bin/env python3
"""
Simple working mushroom cultivation server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

# Create FastAPI app
app = FastAPI(title="Mushroom Cultivation System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample mushroom species data
SPECIES_DATA = [
    {
        "id": 1,
        "name": "Lion's Mane",
        "scientific_name": "Hericium erinaceus",
        "description": "A distinctive white, shaggy mushroom with cascading icicle-like spines. Known for its seafood-like texture and potential cognitive benefits.",
        "difficulty_level": "Beginner",
        "typical_grow_time_days": 14,
        "default_temperature_min": 18,
        "default_temperature_max": 24,
        "default_humidity_min": 85,
        "default_humidity_max": 95,
        "default_co2_min": 500,
        "default_co2_max": 1000,
        "default_fae_cycles_per_day": 4,
        "default_light_hours_per_day": 12
    },
    {
        "id": 2,
        "name": "Shiitake",
        "scientific_name": "Lentinula edodes",
        "description": "A popular culinary mushroom with a rich, earthy flavor. Requires hardwood substrate and specific temperature cycling.",
        "difficulty_level": "Intermediate",
        "typical_grow_time_days": 21,
        "default_temperature_min": 16,
        "default_temperature_max": 22,
        "default_humidity_min": 80,
        "default_humidity_max": 90,
        "default_co2_min": 400,
        "default_co2_max": 800,
        "default_fae_cycles_per_day": 6,
        "default_light_hours_per_day": 8
    },
    {
        "id": 3,
        "name": "Blue Oyster",
        "scientific_name": "Pleurotus columbinus",
        "description": "A beautiful blue-gray oyster mushroom that's easy to grow and has excellent flavor. Great for beginners.",
        "difficulty_level": "Beginner",
        "typical_grow_time_days": 10,
        "default_temperature_min": 15,
        "default_temperature_max": 25,
        "default_humidity_min": 85,
        "default_humidity_max": 95,
        "default_co2_min": 600,
        "default_co2_max": 1200,
        "default_fae_cycles_per_day": 4,
        "default_light_hours_per_day": 12
    },
    {
        "id": 4,
        "name": "Pink Oyster",
        "scientific_name": "Pleurotus djamor",
        "description": "A vibrant pink mushroom that loves warm temperatures. Fast-growing and visually stunning.",
        "difficulty_level": "Beginner",
        "typical_grow_time_days": 7,
        "default_temperature_min": 20,
        "default_temperature_max": 30,
        "default_humidity_min": 85,
        "default_humidity_max": 95,
        "default_co2_min": 600,
        "default_co2_max": 1200,
        "default_fae_cycles_per_day": 4,
        "default_light_hours_per_day": 12
    },
    {
        "id": 5,
        "name": "King Oyster",
        "scientific_name": "Pleurotus eryngii",
        "description": "The largest oyster mushroom with thick, meaty stems. Excellent for culinary applications.",
        "difficulty_level": "Intermediate",
        "typical_grow_time_days": 14,
        "default_temperature_min": 16,
        "default_temperature_max": 22,
        "default_humidity_min": 80,
        "default_humidity_max": 90,
        "default_co2_min": 500,
        "default_co2_max": 1000,
        "default_fae_cycles_per_day": 3,
        "default_light_hours_per_day": 10
    },
    {
        "id": 6,
        "name": "Enoki",
        "scientific_name": "Flammulina velutipes",
        "description": "Delicate, long-stemmed mushrooms popular in Asian cuisine. Requires cooler temperatures.",
        "difficulty_level": "Advanced",
        "typical_grow_time_days": 21,
        "default_temperature_min": 10,
        "default_temperature_max": 16,
        "default_humidity_min": 90,
        "default_humidity_max": 95,
        "default_co2_min": 1000,
        "default_co2_max": 2000,
        "default_fae_cycles_per_day": 2,
        "default_light_hours_per_day": 6
    }
]

# Sample environments data
ENVIRONMENTS_DATA = []

# Extended data model for Batch + Cell Manager
from datetime import datetime, timedelta
import json
import uuid
from typing import List, Dict, Optional
from enum import Enum

class BatchStatus(str, Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    ABORTED = "Aborted"

class CellStatus(str, Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    MAINTENANCE = "Maintenance"
    OFFLINE = "Offline"

# Extended Species data with stages
SPECIES_WITH_STAGES = [
    {
        "id": 1,
        "name": "Lion's Mane",
        "scientific_name": "Hericium erinaceus",
        "description": "A distinctive white, shaggy mushroom with cascading icicle-like spines.",
        "difficulty_level": "Beginner",
        "stages": [
            {
                "name": "Inoculation",
                "durationHours": 168,  # 7 days
                "targets": {
                    "tempMin": 20, "tempMax": 24,
                    "rhMin": 90, "rhMax": 95,
                    "co2Min": 2000, "co2Max": 5000,
                    "lightLuxMin": 0, "lightLuxMax": 50,
                    "lightHoursPerDay": 0
                }
            },
            {
                "name": "Colonization",
                "durationHours": 240,  # 10 days
                "targets": {
                    "tempMin": 18, "tempMax": 22,
                    "rhMin": 85, "rhMax": 90,
                    "co2Min": 1000, "co2Max": 2000,
                    "lightLuxMin": 0, "lightLuxMax": 100,
                    "lightHoursPerDay": 8
                }
            },
            {
                "name": "Pinning",
                "durationHours": 72,  # 3 days
                "targets": {
                    "tempMin": 16, "tempMax": 20,
                    "rhMin": 90, "rhMax": 95,
                    "co2Min": 400, "co2Max": 800,
                    "lightLuxMin": 200, "lightLuxMax": 500,
                    "lightHoursPerDay": 12
                }
            },
            {
                "name": "Fruiting",
                "durationHours": 168,  # 7 days
                "targets": {
                    "tempMin": 18, "tempMax": 24,
                    "rhMin": 85, "rhMax": 95,
                    "co2Min": 400, "co2Max": 800,
                    "lightLuxMin": 300, "lightLuxMax": 800,
                    "lightHoursPerDay": 12
                }
            }
        ]
    },
    {
        "id": 2,
        "name": "Shiitake",
        "scientific_name": "Lentinula edodes",
        "description": "A popular culinary mushroom with a rich, earthy flavor.",
        "difficulty_level": "Intermediate",
        "stages": [
            {
                "name": "Inoculation",
                "durationHours": 336,  # 14 days
                "targets": {
                    "tempMin": 22, "tempMax": 26,
                    "rhMin": 85, "rhMax": 90,
                    "co2Min": 3000, "co2Max": 6000,
                    "lightLuxMin": 0, "lightLuxMax": 50,
                    "lightHoursPerDay": 0
                }
            },
            {
                "name": "Colonization",
                "durationHours": 480,  # 20 days
                "targets": {
                    "tempMin": 20, "tempMax": 24,
                    "rhMin": 80, "rhMax": 85,
                    "co2Min": 1500, "co2Max": 3000,
                    "lightLuxMin": 0, "lightLuxMax": 100,
                    "lightHoursPerDay": 6
                }
            },
            {
                "name": "Pinning",
                "durationHours": 120,  # 5 days
                "targets": {
                    "tempMin": 14, "tempMax": 18,
                    "rhMin": 85, "rhMax": 90,
                    "co2Min": 400, "co2Max": 800,
                    "lightLuxMin": 200, "lightLuxMax": 400,
                    "lightHoursPerDay": 10
                }
            },
            {
                "name": "Fruiting",
                "durationHours": 240,  # 10 days
                "targets": {
                    "tempMin": 16, "tempMax": 22,
                    "rhMin": 80, "rhMax": 90,
                    "co2Min": 400, "co2Max": 800,
                    "lightLuxMin": 300, "lightLuxMax": 600,
                    "lightHoursPerDay": 10
                }
            }
        ]
    },
    {
        "id": 3,
        "name": "Oyster",
        "scientific_name": "Pleurotus ostreatus",
        "description": "Fast-growing, versatile mushrooms with excellent flavor.",
        "difficulty_level": "Beginner",
        "stages": [
            {
                "name": "Inoculation",
                "durationHours": 120,  # 5 days
                "targets": {
                    "tempMin": 22, "tempMax": 26,
                    "rhMin": 90, "rhMax": 95,
                    "co2Min": 2000, "co2Max": 4000,
                    "lightLuxMin": 0, "lightLuxMax": 50,
                    "lightHoursPerDay": 0
                }
            },
            {
                "name": "Colonization",
                "durationHours": 168,  # 7 days
                "targets": {
                    "tempMin": 20, "tempMax": 24,
                    "rhMin": 85, "rhMax": 90,
                    "co2Min": 1000, "co2Max": 2000,
                    "lightLuxMin": 50, "lightLuxMax": 150,
                    "lightHoursPerDay": 8
                }
            },
            {
                "name": "Pinning",
                "durationHours": 48,  # 2 days
                "targets": {
                    "tempMin": 18, "tempMax": 22,
                    "rhMin": 90, "rhMax": 95,
                    "co2Min": 400, "co2Max": 600,
                    "lightLuxMin": 200, "lightLuxMax": 500,
                    "lightHoursPerDay": 12
                }
            },
            {
                "name": "Fruiting",
                "durationHours": 120,  # 5 days
                "targets": {
                    "tempMin": 20, "tempMax": 26,
                    "rhMin": 85, "rhMax": 95,
                    "co2Min": 400, "co2Max": 800,
                    "lightLuxMin": 300, "lightLuxMax": 800,
                    "lightHoursPerDay": 12
                }
            }
        ]
    }
]

# Cells (Chambers) data
CELLS_DATA = [
    {
        "id": 1,
        "name": "Chamber 1",
        "mcuId": "MCU_001",
        "status": CellStatus.AVAILABLE,
        "location": "Farm 1 - Rack A",
        "capacity": "10kg substrate",
        "lastMaintenance": "2025-08-15T10:00:00Z"
    },
    {
        "id": 2,
        "name": "Chamber 2",
        "mcuId": "MCU_002",
        "status": CellStatus.AVAILABLE,
        "location": "Farm 1 - Rack B",
        "capacity": "10kg substrate",
        "lastMaintenance": "2025-08-15T10:00:00Z"
    },
    {
        "id": 3,
        "name": "Chamber 3",
        "mcuId": "MCU_003",
        "status": CellStatus.AVAILABLE,
        "location": "Farm 2 - Rack A",
        "capacity": "15kg substrate",
        "lastMaintenance": "2025-08-15T10:00:00Z"
    }
]

# Batches data
BATCHES_DATA = []

# Environmental readings data
ENV_READINGS_DATA = []

# Action logs data
ACTION_LOGS_DATA = []

# Photos data
PHOTOS_DATA = []

# Automation rules data with professional presets
AUTOMATION_RULES = [
    {
        "id": "preset_lions_mane_humidity",
        "name": "Lion's Mane - Optimal Humidity Control",
        "description": "Maintains perfect humidity levels for Lion's Mane mushrooms during fruiting phase. Automatically adjusts when humidity drops below optimal range.",
        "priority": "high",
        "enabled": True,
        "interval": 30,
        "chambers": ["all"],
        "conditions": [
            {"field": "species", "operator": "equals", "value": "1"},
            {"field": "humidity", "operator": "less_than", "value": "85"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "set_humidity", "value": "90"},
            {"type": "send_alert", "value": "Lion's Mane humidity adjusted to optimal level"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_shiitake_temperature",
        "name": "Shiitake - Temperature Regulation",
        "description": "Maintains optimal temperature range for Shiitake mushrooms. Prevents overheating and ensures proper fruiting conditions.",
        "priority": "high",
        "enabled": True,
        "interval": 45,
        "chambers": ["all"],
        "conditions": [
            {"field": "species", "operator": "equals", "value": "2"},
            {"field": "temperature", "operator": "greater_than", "value": "22"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "set_temperature", "value": "19"},
            {"type": "turn_on_device", "value": "cooling_fan"},
            {"type": "send_alert", "value": "Shiitake temperature cooled to optimal range"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_oyster_fae_cycle",
        "name": "Oyster Mushroom - Fresh Air Exchange",
        "description": "Automated FAE cycles for Oyster mushrooms. Ensures proper CO2 levels and air circulation for healthy pin formation.",
        "priority": "medium",
        "enabled": True,
        "interval": 900,
        "chambers": ["all"],
        "conditions": [
            {"field": "species", "operator": "equals", "value": "3"},
            {"field": "co2", "operator": "greater_than", "value": "800"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "turn_on_device", "value": "exhaust_fan"},
            {"type": "wait", "value": "300"},
            {"type": "turn_off_device", "value": "exhaust_fan"},
            {"type": "set_co2", "value": "600"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_reishi_advanced_control",
        "name": "Reishi - Advanced Environmental Control",
        "description": "Comprehensive environmental management for Reishi mushrooms. Maintains high humidity, optimal temperature, and CO2 levels for medicinal quality.",
        "priority": "critical",
        "enabled": True,
        "interval": 60,
        "chambers": ["all"],
        "conditions": [
            {"field": "species", "operator": "equals", "value": "4"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "set_humidity", "value": "92"},
            {"type": "set_temperature", "value": "26"},
            {"type": "set_co2", "value": "1500"},
            {"type": "send_alert", "value": "Reishi optimal conditions maintained"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_emergency_shutdown",
        "name": "Emergency Protection - Extreme Conditions",
        "description": "Emergency shutdown system that protects all mushroom crops from extreme temperature or humidity conditions that could damage or kill the mycelium.",
        "priority": "critical",
        "enabled": True,
        "interval": 15,
        "chambers": ["all"],
        "conditions": [
            {"field": "temperature", "operator": "greater_than", "value": "35"}
        ],
        "conditionLogic": "or",
        "actions": [
            {"type": "turn_off_device", "value": "heater"},
            {"type": "turn_on_device", "value": "emergency_cooling"},
            {"type": "send_alert", "value": "EMERGENCY: Extreme temperature detected - protective measures activated"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_night_cycle",
        "name": "Universal Night Cycle - Light Management",
        "description": "Automated day/night cycle management for all mushroom species. Turns off lights during night hours to simulate natural conditions.",
        "priority": "low",
        "enabled": True,
        "interval": 3600,
        "chambers": ["all"],
        "conditions": [
            {"field": "time", "operator": "greater_equal", "value": "22"}
        ],
        "conditionLogic": "or",
        "actions": [
            {"type": "turn_off_device", "value": "grow_lights"},
            {"type": "send_alert", "value": "Night cycle activated - lights turned off"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_contamination_prevention",
        "name": "Contamination Prevention - Air Quality Control",
        "description": "Maintains optimal air quality and circulation to prevent contamination. Monitors humidity spikes and ensures proper airflow.",
        "priority": "high",
        "enabled": True,
        "interval": 120,
        "chambers": ["all"],
        "conditions": [
            {"field": "humidity", "operator": "greater_than", "value": "98"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "turn_on_device", "value": "air_circulation_fan"},
            {"type": "set_humidity", "value": "90"},
            {"type": "send_alert", "value": "High humidity detected - contamination prevention activated"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    },
    {
        "id": "preset_harvest_ready_alert",
        "name": "Harvest Ready Notification System",
        "description": "Intelligent system that monitors growth conditions and time to alert when mushrooms are likely ready for harvest based on species-specific timelines.",
        "priority": "medium",
        "enabled": True,
        "interval": 86400,
        "chambers": ["all"],
        "conditions": [
            {"field": "phase", "operator": "equals", "value": "fruiting"}
        ],
        "conditionLogic": "and",
        "actions": [
            {"type": "send_alert", "value": "Mushrooms may be ready for harvest - please inspect chambers"}
        ],
        "createdAt": "2025-08-10T00:00:00Z",
        "executionCount": 0,
        "lastExecution": None,
        "preset": True
    }
]

# Advanced Alerting System Data
ALERTS_DATA = []
ALERT_CHANNELS = {
    "email": {"enabled": True, "address": "admin@mushroom-farm.com"},
    "sms": {"enabled": False, "number": "+1234567890"},
    "webhook": {"enabled": True, "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"}
}
ALERT_HISTORY = []
ESCALATION_RULES = [
    {"id": "critical_temp", "condition": "temperature > 35", "escalate_after": 300, "channels": ["email", "sms"]},
    {"id": "low_humidity", "condition": "humidity < 70", "escalate_after": 600, "channels": ["email"]},
    {"id": "high_co2", "condition": "co2 > 2000", "escalate_after": 180, "channels": ["email", "webhook"]}
]

# Phase Management System Data
GROWTH_PHASES = {
    "inoculation": {"name": "Inoculation", "duration_days": 7, "temp_range": [20, 25], "humidity_range": [60, 70], "co2_range": [1000, 5000]},
    "colonization": {"name": "Colonization", "duration_days": 14, "temp_range": [22, 26], "humidity_range": [70, 80], "co2_range": [2000, 10000]},
    "primordia": {"name": "Primordia Formation", "duration_days": 3, "temp_range": [18, 22], "humidity_range": [90, 95], "co2_range": [800, 1200]},
    "fruiting": {"name": "Fruiting", "duration_days": 7, "temp_range": [16, 20], "humidity_range": [85, 95], "co2_range": [400, 800]},
    "harvest": {"name": "Harvest Ready", "duration_days": 2, "temp_range": [16, 20], "humidity_range": [80, 90], "co2_range": [400, 600]}
}

PHASE_SCHEDULES = []
HARVEST_TRACKING = []

# Batch Operations Data
BATCH_OPERATIONS = []
BULK_ACTIONS = {
    "set_temperature": "Set temperature for multiple chambers",
    "set_humidity": "Set humidity for multiple chambers",
    "assign_species": "Assign species to multiple chambers",
    "change_phase": "Change growth phase for multiple chambers",
    "emergency_shutdown": "Emergency shutdown for multiple chambers"
}

# User Authentication & Security Data
USERS_DATA = [
    {"id": 1, "username": "admin", "email": "admin@mushroom-farm.com", "role": "admin", "password_hash": "hashed_password", "active": True},
    {"id": 2, "username": "operator", "email": "operator@mushroom-farm.com", "role": "operator", "password_hash": "hashed_password", "active": True},
    {"id": 3, "username": "viewer", "email": "viewer@mushroom-farm.com", "role": "viewer", "password_hash": "hashed_password", "active": True}
]

USER_SESSIONS = []
ROLE_PERMISSIONS = {
    "admin": ["read", "write", "delete", "manage_users", "system_config"],
    "operator": ["read", "write", "manage_chambers", "manage_automation"],
    "viewer": ["read"]
}

# Audit log data
AUDIT_LOG = []

# API Routes
@app.get("/api/species/")
async def get_species():
    """Get all mushroom species"""
    return SPECIES_DATA

@app.get("/api/species/{species_id}")
async def get_species_by_id(species_id: int):
    """Get a specific species by ID"""
    for species in SPECIES_DATA:
        if species["id"] == species_id:
            return species
    return JSONResponse(status_code=404, content={"detail": "Species not found"})

@app.post("/api/species/")
async def create_species(species_data: dict):
    """Create a new mushroom species"""
    # Generate new ID
    new_id = max([s["id"] for s in SPECIES_DATA], default=0) + 1
    
    # Create new species object
    new_species = {
        "id": new_id,
        "name": species_data.get("name", "Unknown Species"),
        "scientific_name": species_data.get("scientific_name", ""),
        "description": species_data.get("description", ""),
        "difficulty_level": species_data.get("difficulty_level", "Intermediate"),
        "typical_grow_time_days": species_data.get("typical_grow_time_days", 21),
        "default_temperature_min": species_data.get("default_temperature_min", 18),
        "default_temperature_max": species_data.get("default_temperature_max", 24),
        "default_humidity_min": species_data.get("default_humidity_min", 85),
        "default_humidity_max": species_data.get("default_humidity_max", 95),
        "default_co2_min": species_data.get("default_co2_min", 500),
        "default_co2_max": species_data.get("default_co2_max", 1000),
        "default_fae_cycles_per_day": species_data.get("default_fae_cycles_per_day", 4),
        "default_light_hours_per_day": species_data.get("default_light_hours_per_day", 12)
    }
    
    # Add to species data
    SPECIES_DATA.append(new_species)
    
    return new_species

@app.get("/api/environments/")
async def get_environments():
    """Get all environments"""
    return ENVIRONMENTS_DATA

@app.post("/api/environments/")
async def create_environment(environment: dict):
    """Create a new environment"""
    new_id = len(ENVIRONMENTS_DATA) + 1
    new_environment = {
        "id": new_id,
        "name": environment.get("name", f"Chamber {new_id}"),
        "location": environment.get("location"),
        "description": environment.get("description"),
        "is_active": True,
        "species_id": None,
        "current_phase": None,
        "temperature": None,
        "humidity": None,
        "co2": None,
        "airflow": None
    }
    ENVIRONMENTS_DATA.append(new_environment)
    return new_environment

# Automation Rules API Endpoints
@app.get("/api/rules")
async def get_automation_rules():
    """Get all automation rules"""
    return AUTOMATION_RULES

@app.post("/api/rules")
async def create_automation_rule(rule_data: dict):
    """Create a new automation rule"""
    new_id = f"rule_{len(AUTOMATION_RULES) + 1}"
    new_rule = {
        "id": new_id,
        "name": rule_data.get("name", "New Rule"),
        "description": rule_data.get("description", ""),
        "priority": rule_data.get("priority", "medium"),
        "enabled": rule_data.get("enabled", True),
        "interval": rule_data.get("interval", 60),
        "chambers": rule_data.get("chambers", ["all"]),
        "conditions": rule_data.get("conditions", []),
        "conditionLogic": rule_data.get("conditionLogic", "and"),
        "actions": rule_data.get("actions", []),
        "createdAt": rule_data.get("createdAt", "2025-08-10T00:00:00Z"),
        "executionCount": 0,
        "lastExecution": None,
        "preset": False
    }
    AUTOMATION_RULES.append(new_rule)
    return new_rule

# Advanced Alerting System API
@app.get("/api/alerts")
async def get_alerts():
    """Get all alerts"""
    return ALERTS_DATA

@app.post("/api/alerts")
async def create_alert(alert_data: dict):
    """Create a new alert"""
    new_alert = {
        "id": f"alert_{len(ALERTS_DATA) + 1}",
        "type": alert_data.get("type", "warning"),
        "message": alert_data.get("message", ""),
        "chamber_id": alert_data.get("chamber_id"),
        "severity": alert_data.get("severity", "medium"),
        "timestamp": alert_data.get("timestamp", "2025-08-11T00:00:00Z"),
        "acknowledged": False,
        "channels_sent": []
    }
    ALERTS_DATA.append(new_alert)
    ALERT_HISTORY.append(new_alert)
    return new_alert

@app.get("/api/alerts/channels")
async def get_alert_channels():
    """Get alert channel configuration"""
    return ALERT_CHANNELS

@app.post("/api/alerts/channels")
async def update_alert_channels(channels_data: dict):
    """Update alert channel configuration"""
    ALERT_CHANNELS.update(channels_data)
    return ALERT_CHANNELS

@app.get("/api/alerts/history")
async def get_alert_history():
    """Get alert history"""
    return ALERT_HISTORY

# Phase Management System API
@app.get("/api/phases")
async def get_growth_phases():
    """Get all growth phases"""
    return GROWTH_PHASES

@app.post("/api/environments/{environment_id}/phase")
async def change_chamber_phase(environment_id: int, phase_data: dict):
    """Change growth phase for a chamber"""
    for env in ENVIRONMENTS_DATA:
        if env["id"] == environment_id:
            env["current_phase"] = phase_data.get("phase")
            env["phase_start_date"] = phase_data.get("start_date", "2025-08-11T00:00:00Z")
            return env
    return {"error": "Environment not found"}

@app.get("/api/harvest")
async def get_harvest_tracking():
    """Get harvest tracking data"""
    return HARVEST_TRACKING

@app.post("/api/harvest")
async def record_harvest(harvest_data: dict):
    """Record a harvest"""
    new_harvest = {
        "id": f"harvest_{len(HARVEST_TRACKING) + 1}",
        "chamber_id": harvest_data.get("chamber_id"),
        "species_id": harvest_data.get("species_id"),
        "weight_grams": harvest_data.get("weight_grams", 0),
        "quality_grade": harvest_data.get("quality_grade", "A"),
        "harvest_date": harvest_data.get("harvest_date", "2025-08-11T00:00:00Z"),
        "notes": harvest_data.get("notes", "")
    }
    HARVEST_TRACKING.append(new_harvest)
    return new_harvest

# Batch Operations API
@app.get("/api/batch/actions")
async def get_bulk_actions():
    """Get available bulk actions"""
    return BULK_ACTIONS

@app.post("/api/batch/execute")
async def execute_bulk_action(batch_data: dict):
    """Execute bulk action on multiple chambers"""
    action = batch_data.get("action")
    chamber_ids = batch_data.get("chamber_ids", [])
    value = batch_data.get("value")
    
    results = []
    for chamber_id in chamber_ids:
        for env in ENVIRONMENTS_DATA:
            if env["id"] == chamber_id:
                if action == "set_temperature":
                    env["temperature"] = value
                elif action == "set_humidity":
                    env["humidity"] = value
                elif action == "assign_species":
                    env["species_id"] = value
                elif action == "change_phase":
                    env["current_phase"] = value
                results.append({"chamber_id": chamber_id, "status": "success"})
                break
    
    new_operation = {
        "id": f"batch_{len(BATCH_OPERATIONS) + 1}",
        "action": action,
        "chamber_ids": chamber_ids,
        "value": value,
        "timestamp": "2025-08-11T00:00:00Z",
        "results": results
    }
    BATCH_OPERATIONS.append(new_operation)
    return new_operation

# Batch + Cell Manager API Endpoints

# Helper functions for Batch + Cell Manager
def generate_batch_id():
    return f"batch_{len(BATCHES_DATA) + 1}_{uuid.uuid4().hex[:8]}"

def get_current_stage(batch):
    """Get current stage for a running batch"""
    if batch["status"] != BatchStatus.RUNNING:
        return None
    
    species = next((s for s in SPECIES_WITH_STAGES if s["id"] == batch["speciesId"]), None)
    if not species:
        return None
    
    elapsed_hours = (datetime.now() - datetime.fromisoformat(batch["startedAt"].replace('Z', '+00:00'))).total_seconds() / 3600
    cumulative_hours = 0
    
    for i, stage in enumerate(species["stages"]):
        cumulative_hours += stage["durationHours"]
        if elapsed_hours <= cumulative_hours:
            return {
                "index": i,
                "stage": stage,
                "hoursRemaining": cumulative_hours - elapsed_hours,
                "progress": (elapsed_hours - (cumulative_hours - stage["durationHours"])) / stage["durationHours"]
            }
    
    return None  # Batch completed

def log_action(batch_id, cell_id, actor, action, payload=None):
    """Log an action to the action log"""
    action_log = {
        "id": f"action_{len(ACTION_LOGS_DATA) + 1}",
        "batchId": batch_id,
        "cellId": cell_id,
        "timestamp": datetime.now().isoformat() + "Z",
        "actor": actor,
        "action": action,
        "payload": payload or {}
    }
    ACTION_LOGS_DATA.append(action_log)
    return action_log

def send_mcu_command(mcu_id, command):
    """Send command to MCU (placeholder for MQTT/Serial integration)"""
    print(f"[MCU {mcu_id}] Command: {json.dumps(command)}")
    # TODO: Implement actual MQTT/Serial communication
    return True

def check_safety_thresholds(batch_id, cell_id, reading):
    """Check if environmental reading is within safe bounds"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch or batch["status"] != BatchStatus.RUNNING:
        return
    
    current_stage_info = get_current_stage(batch)
    if not current_stage_info:
        return
    
    targets = current_stage_info["stage"]["targets"]
    alerts = []
    
    # Check temperature
    if reading["tempC"] < targets["tempMin"] or reading["tempC"] > targets["tempMax"]:
        alerts.append(f"Temperature {reading['tempC']}°C outside range {targets['tempMin']}-{targets['tempMax']}°C")
    
    # Check humidity
    if reading["rh"] < targets["rhMin"] or reading["rh"] > targets["rhMax"]:
        alerts.append(f"Humidity {reading['rh']}% outside range {targets['rhMin']}-{targets['rhMax']}%")
    
    # Check CO2
    if reading["co2ppm"] < targets["co2Min"] or reading["co2ppm"] > targets["co2Max"]:
        alerts.append(f"CO2 {reading['co2ppm']}ppm outside range {targets['co2Min']}-{targets['co2Max']}ppm")
    
    # Log alerts
    for alert_msg in alerts:
        log_action(batch_id, cell_id, "system", "safety_alert", {"message": alert_msg, "reading": reading})

# Batch API Endpoints
@app.get("/api/batches")
async def get_batches():
    """Get all batches"""
    return BATCHES_DATA

@app.post("/api/batches")
async def create_batch(batch_data: dict):
    """Create a new batch"""
    # Validate cell availability
    cell_id = batch_data.get("cellId")
    cell = next((c for c in CELLS_DATA if c["id"] == cell_id), None)
    if not cell:
        return {"error": "Cell not found"}
    
    if cell["status"] != CellStatus.AVAILABLE:
        return {"error": "Cell not available"}
    
    # Check if cell already has running batch
    existing_batch = next((b for b in BATCHES_DATA if b["cellId"] == cell_id and b["status"] in [BatchStatus.RUNNING, BatchStatus.PAUSED]), None)
    if existing_batch:
        return {"error": "Cell already has an active batch"}
    
    # Create new batch
    new_batch = {
        "id": generate_batch_id(),
        "name": batch_data.get("name", f"Batch {len(BATCHES_DATA) + 1}"),
        "speciesId": batch_data.get("speciesId"),
        "cellId": cell_id,
        "status": BatchStatus.PENDING,
        "createdAt": datetime.now().isoformat() + "Z",
        "startedAt": None,
        "completedAt": None,
        "currentStage": None,
        "notes": batch_data.get("notes", "")
    }
    
    BATCHES_DATA.append(new_batch)
    
    # Update cell status
    cell["status"] = CellStatus.OCCUPIED
    
    # Log action
    log_action(new_batch["id"], cell_id, "user", "batch_created", {"batchName": new_batch["name"]})
    
    return new_batch

@app.get("/api/batches/{batch_id}")
async def get_batch(batch_id: str):
    """Get batch details with current stage, readings, logs, photos"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    # Get current stage info
    current_stage_info = get_current_stage(batch) if batch["status"] == BatchStatus.RUNNING else None
    
    # Get recent readings
    recent_readings = [r for r in ENV_READINGS_DATA if r["batchId"] == batch_id][-20:]  # Last 20 readings
    
    # Get action logs
    action_logs = [log for log in ACTION_LOGS_DATA if log["batchId"] == batch_id]
    
    # Get photos
    photos = [p for p in PHOTOS_DATA if p["batchId"] == batch_id]
    
    # Get species info
    species = next((s for s in SPECIES_WITH_STAGES if s["id"] == batch["speciesId"]), None)
    
    return {
        **batch,
        "currentStageInfo": current_stage_info,
        "species": species,
        "recentReadings": recent_readings,
        "actionLogs": action_logs,
        "photos": photos
    }

@app.post("/api/batches/{batch_id}/start")
async def start_batch(batch_id: str):
    """Start a batch - load profile to MCU and begin control"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    if batch["status"] != BatchStatus.PENDING:
        return {"error": "Batch is not in pending status"}
    
    # Get species and cell info
    species = next((s for s in SPECIES_WITH_STAGES if s["id"] == batch["speciesId"]), None)
    cell = next((c for c in CELLS_DATA if c["id"] == batch["cellId"]), None)
    
    if not species or not cell:
        return {"error": "Species or cell not found"}
    
    # Send profile to MCU
    mcu_command = {
        "cmd": "SET_PROFILE",
        "batchId": batch_id,
        "cellId": batch["cellId"],
        "stages": species["stages"]
    }
    
    if not send_mcu_command(cell["mcuId"], mcu_command):
        return {"error": "Failed to send profile to MCU"}
    
    # Start control
    start_command = {
        "cmd": "START",
        "batchId": batch_id,
        "cellId": batch["cellId"]
    }
    
    if not send_mcu_command(cell["mcuId"], start_command):
        return {"error": "Failed to start MCU control"}
    
    # Update batch status
    batch["status"] = BatchStatus.RUNNING
    batch["startedAt"] = datetime.now().isoformat() + "Z"
    batch["currentStage"] = 0
    
    # Log action
    log_action(batch_id, batch["cellId"], "user", "batch_started", {"species": species["name"]})
    
    return batch

@app.post("/api/batches/{batch_id}/pause")
async def pause_batch(batch_id: str):
    """Pause a running batch"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    if batch["status"] != BatchStatus.RUNNING:
        return {"error": "Batch is not running"}
    
    # Send pause command to MCU
    cell = next((c for c in CELLS_DATA if c["id"] == batch["cellId"]), None)
    pause_command = {"cmd": "PAUSE", "batchId": batch_id, "cellId": batch["cellId"]}
    send_mcu_command(cell["mcuId"], pause_command)
    
    # Update status
    batch["status"] = BatchStatus.PAUSED
    
    # Log action
    log_action(batch_id, batch["cellId"], "user", "batch_paused")
    
    return batch

@app.post("/api/batches/{batch_id}/resume")
async def resume_batch(batch_id: str):
    """Resume a paused batch"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    if batch["status"] != BatchStatus.PAUSED:
        return {"error": "Batch is not paused"}
    
    # Send resume command to MCU
    cell = next((c for c in CELLS_DATA if c["id"] == batch["cellId"]), None)
    resume_command = {"cmd": "RESUME", "batchId": batch_id, "cellId": batch["cellId"]}
    send_mcu_command(cell["mcuId"], resume_command)
    
    # Update status
    batch["status"] = BatchStatus.RUNNING
    
    # Log action
    log_action(batch_id, batch["cellId"], "user", "batch_resumed")
    
    return batch

@app.post("/api/batches/{batch_id}/abort")
async def abort_batch(batch_id: str):
    """Abort a batch"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    if batch["status"] in [BatchStatus.COMPLETED, BatchStatus.ABORTED]:
        return {"error": "Batch already completed or aborted"}
    
    # Send abort command to MCU
    cell = next((c for c in CELLS_DATA if c["id"] == batch["cellId"]), None)
    abort_command = {"cmd": "ABORT", "batchId": batch_id, "cellId": batch["cellId"]}
    send_mcu_command(cell["mcuId"], abort_command)
    
    # Update status
    batch["status"] = BatchStatus.ABORTED
    batch["completedAt"] = datetime.now().isoformat() + "Z"
    
    # Free up cell
    cell["status"] = CellStatus.AVAILABLE
    
    # Log action
    log_action(batch_id, batch["cellId"], "user", "batch_aborted")
    
    return batch

# Cell API Endpoints
@app.get("/api/cells")
async def get_cells():
    """Get all cells"""
    return CELLS_DATA

@app.get("/api/cells/{cell_id}/status")
async def get_cell_status(cell_id: int):
    """Get cell status with last readings and active batch"""
    cell = next((c for c in CELLS_DATA if c["id"] == cell_id), None)
    if not cell:
        return {"error": "Cell not found"}
    
    # Get active batch
    active_batch = next((b for b in BATCHES_DATA if b["cellId"] == cell_id and b["status"] in [BatchStatus.RUNNING, BatchStatus.PAUSED]), None)
    
    # Get last readings
    last_readings = [r for r in ENV_READINGS_DATA if r["cellId"] == cell_id][-10:]  # Last 10 readings
    
    return {
        **cell,
        "activeBatch": active_batch,
        "lastReadings": last_readings
    }

# Species Profile API
@app.get("/api/species/profiles")
async def get_species_profiles():
    """Get species with stage profiles"""
    return SPECIES_WITH_STAGES

@app.post("/api/species/{species_id}/assign")
async def assign_species_to_cell(species_id: int, assignment_data: dict):
    """Quick assign species to cell (creates pending batch)"""
    cell_id = assignment_data.get("cellId")
    batch_name = assignment_data.get("batchName", f"Quick Assign - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Create batch using existing endpoint logic
    batch_data = {
        "name": batch_name,
        "speciesId": species_id,
        "cellId": cell_id,
        "notes": "Created via quick assign"
    }
    
    return await create_batch(batch_data)

# Environmental Data & MCU Integration
@app.post("/api/telemetry")
async def ingest_telemetry(telemetry_data: dict):
    """Ingest telemetry data from MCU"""
    reading = {
        "id": f"reading_{len(ENV_READINGS_DATA) + 1}",
        "cellId": telemetry_data.get("cellId"),
        "timestamp": telemetry_data.get("timestamp", datetime.now().isoformat() + "Z"),
        "tempC": telemetry_data.get("tempC"),
        "rh": telemetry_data.get("rh"),
        "co2ppm": telemetry_data.get("co2ppm"),
        "lux": telemetry_data.get("lux"),
        "notes": telemetry_data.get("notes", "")
    }
    
    # Find active batch for this cell
    active_batch = next((b for b in BATCHES_DATA if b["cellId"] == reading["cellId"] and b["status"] == BatchStatus.RUNNING), None)
    if active_batch:
        reading["batchId"] = active_batch["id"]
        # Check safety thresholds
        check_safety_thresholds(active_batch["id"], reading["cellId"], reading)
    
    ENV_READINGS_DATA.append(reading)
    
    # TODO: Broadcast to WebSocket clients for real-time updates
    
    return reading

# Batch Adjustment API
@app.post("/api/batches/{batch_id}/adjust")
async def adjust_batch_targets(batch_id: str, adjustment_data: dict):
    """Adjust current stage targets for a batch"""
    batch = next((b for b in BATCHES_DATA if b["id"] == batch_id), None)
    if not batch:
        return {"error": "Batch not found"}
    
    if batch["status"] != BatchStatus.RUNNING:
        return {"error": "Batch is not running"}
    
    # Get current stage
    current_stage_info = get_current_stage(batch)
    if not current_stage_info:
        return {"error": "No active stage found"}
    
    # Apply adjustments
    adjustments = adjustment_data.get("targets", {})
    cell = next((c for c in CELLS_DATA if c["id"] == batch["cellId"]), None)
    
    # Send adjustment command to MCU
    adjust_command = {
        "cmd": "ADJUST_TARGETS",
        "batchId": batch_id,
        "cellId": batch["cellId"],
        "targets": adjustments
    }
    
    if send_mcu_command(cell["mcuId"], adjust_command):
        # Log adjustment
        log_action(batch_id, batch["cellId"], "user", "targets_adjusted", {"adjustments": adjustments})
        return {"success": True, "adjustments": adjustments}
    else:
        return {"error": "Failed to send adjustment to MCU"}

# Notes and Photos API
@app.post("/api/batches/{batch_id}/notes")
async def add_batch_note(batch_id: str, note_data: dict):
    """Add a note to a batch"""
    text = note_data.get("text", "")
    
    # Log as action
    action_log = log_action(batch_id, None, "user", "note_added", {"text": text})
    
    return action_log

@app.post("/api/batches/{batch_id}/photo")
async def upload_batch_photo(batch_id: str, photo_data: dict):
    """Upload a photo for a batch (placeholder - would handle multipart in real implementation)"""
    photo = {
        "id": f"photo_{len(PHOTOS_DATA) + 1}",
        "batchId": batch_id,
        "cellId": photo_data.get("cellId"),
        "timestamp": datetime.now().isoformat() + "Z",
        "path": photo_data.get("path", f"/uploads/{batch_id}/photo_{len(PHOTOS_DATA) + 1}.jpg"),
        "note": photo_data.get("note", "")
    }
    
    PHOTOS_DATA.append(photo)
    
    # Log as action
    log_action(batch_id, photo["cellId"], "user", "photo_uploaded", {"photoId": photo["id"], "note": photo["note"]})
    
    return photo

# User Authentication & Security API
@app.get("/api/users")
async def get_users():
    """Get all users (admin only)"""
    return USERS_DATA

@app.post("/api/auth/login")
async def login(credentials: dict):
    """User login"""
    username = credentials.get("username")
    password = credentials.get("password")
    
    for user in USERS_DATA:
        if user["username"] == username and user["active"]:
            # In production, verify password hash
            session_token = f"session_{len(USER_SESSIONS) + 1}"
            session = {
                "token": session_token,
                "user_id": user["id"],
                "username": username,
                "role": user["role"],
                "created_at": "2025-08-11T00:00:00Z"
            }
            USER_SESSIONS.append(session)
            return {"token": session_token, "user": user, "permissions": ROLE_PERMISSIONS[user["role"]]}
    
    return {"error": "Invalid credentials"}

@app.post("/api/auth/logout")
async def logout(session_data: dict):
    """User logout"""
    token = session_data.get("token")
    USER_SESSIONS[:] = [s for s in USER_SESSIONS if s["token"] != token]
    return {"message": "Logged out successfully"}

@app.get("/api/auth/permissions")
async def get_role_permissions():
    """Get role permissions"""
    return ROLE_PERMISSIONS

# Real Sensor Integration API (MQTT/ESP32)
@app.get("/api/sensors/data")
async def get_sensor_data():
    """Get real-time sensor data from connected devices"""
    # Simulated sensor data - replace with real MQTT data
    sensor_data = {
        "esp32_chamber_01": {
            "temperature": 22.5,
            "humidity": 88.2,
            "co2": 650,
            "last_update": "2025-08-11T00:00:00Z",
            "status": "online"
        },
        "esp32_chamber_02": {
            "temperature": 19.8,
            "humidity": 92.1,
            "co2": 720,
            "last_update": "2025-08-11T00:00:00Z",
            "status": "online"
        }
    }
    return sensor_data

@app.post("/api/sensors/control")
async def control_device(control_data: dict):
    """Send control commands to connected devices"""
    device_id = control_data.get("device_id")
    action = control_data.get("action")
    value = control_data.get("value")
    
    # In production, send MQTT command to device
    command = {
        "id": f"cmd_{len(AUDIT_LOG) + 1}",
        "device_id": device_id,
        "action": action,
        "value": value,
        "timestamp": "2025-08-11T00:00:00Z",
        "status": "sent"
    }
    
    AUDIT_LOG.append({
        "action": "device_control",
        "details": command,
        "timestamp": "2025-08-11T00:00:00Z"
    })
    
    return command

@app.post("/api/environments/{environment_id}/assign")
async def assign_species_to_environment(environment_id: int, assignment_data: dict):
    """Assign a species to an environment and update environmental parameters"""
    # Find the environment
    environment = None
    for env in ENVIRONMENTS_DATA:
        if env["id"] == environment_id:
            environment = env
            break
    
    if not environment:
        return JSONResponse(status_code=404, content={"detail": "Environment not found"})
    
    # Update environment with species assignment and parameters
    environment["species_id"] = assignment_data.get("species_id")
    environment["temperature"] = assignment_data.get("temperature")
    environment["humidity"] = assignment_data.get("humidity")
    environment["co2"] = assignment_data.get("co2")
    environment["airflow"] = assignment_data.get("airflow")
    environment["target_temperature_min"] = assignment_data.get("target_temperature_min")
    environment["target_temperature_max"] = assignment_data.get("target_temperature_max")
    environment["target_humidity_min"] = assignment_data.get("target_humidity_min")
    environment["target_humidity_max"] = assignment_data.get("target_humidity_max")
    environment["target_co2_min"] = assignment_data.get("target_co2_min")
    environment["target_co2_max"] = assignment_data.get("target_co2_max")
    environment["fae_cycles_per_day"] = assignment_data.get("fae_cycles_per_day")
    environment["light_hours_per_day"] = assignment_data.get("light_hours_per_day")
    
    return environment

@app.delete("/api/environments/{environment_id}")
async def delete_environment(environment_id: int):
    """Delete an environment"""
    global ENVIRONMENTS_DATA
    original_length = len(ENVIRONMENTS_DATA)
    ENVIRONMENTS_DATA = [env for env in ENVIRONMENTS_DATA if env["id"] != environment_id]
    
    if len(ENVIRONMENTS_DATA) < original_length:
        return JSONResponse(status_code=200, content={"detail": "Environment deleted successfully"})
    else:
        return JSONResponse(status_code=404, content={"detail": "Environment not found"})

# Serve frontend files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")

@app.get("/")
async def root():
    """Serve the main dashboard HTML"""
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/{file_path:path}")
async def serve_frontend_files(file_path: str):
    """Serve frontend static files (CSS, JS, etc.)"""
    from fastapi.responses import FileResponse
    import mimetypes
    
    # Skip API routes
    if file_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    file_full_path = os.path.join(frontend_dir, file_path)
    
    if os.path.exists(file_full_path) and os.path.isfile(file_full_path):
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_full_path)
        return FileResponse(file_full_path, media_type=content_type)
    
    return JSONResponse(status_code=404, content={"detail": "File not found"})

# ===== AUTOMATION RULES API ENDPOINTS =====

@app.get("/api/automation/rules")
async def get_automation_rules():
    """Get all automation rules"""
    return AUTOMATION_RULES

@app.post("/api/automation/rules")
async def create_automation_rule(rule_data: dict):
    """Create a new automation rule"""
    new_rule = {
        "id": rule_data.get("id", str(len(AUTOMATION_RULES) + 1)),
        "name": rule_data.get("name", "Unnamed Rule"),
        "description": rule_data.get("description", ""),
        "priority": rule_data.get("priority", "medium"),
        "enabled": rule_data.get("enabled", True),
        "interval": rule_data.get("interval", 60),
        "chambers": rule_data.get("chambers", ["all"]),
        "conditions": rule_data.get("conditions", []),
        "conditionLogic": rule_data.get("conditionLogic", "and"),
        "actions": rule_data.get("actions", []),
        "createdAt": rule_data.get("createdAt"),
        "executionCount": rule_data.get("executionCount", 0),
        "lastExecution": rule_data.get("lastExecution")
    }
    
    AUTOMATION_RULES.append(new_rule)
    
    # Log rule creation
    log_audit_event("rule_created", f"Automation rule '{new_rule['name']}' created", new_rule)
    
    return new_rule

@app.get("/api/automation/rules/{rule_id}")
async def get_automation_rule(rule_id: str):
    """Get a specific automation rule"""
    for rule in AUTOMATION_RULES:
        if rule["id"] == rule_id:
            return rule
    return JSONResponse(status_code=404, content={"detail": "Rule not found"})

@app.put("/api/automation/rules/{rule_id}")
async def update_automation_rule(rule_id: str, rule_data: dict):
    """Update an automation rule"""
    for i, rule in enumerate(AUTOMATION_RULES):
        if rule["id"] == rule_id:
            # Update rule with new data
            AUTOMATION_RULES[i].update(rule_data)
            log_audit_event("rule_updated", f"Automation rule '{rule['name']}' updated", rule_data)
            return AUTOMATION_RULES[i]
    return JSONResponse(status_code=404, content={"detail": "Rule not found"})

@app.delete("/api/automation/rules/{rule_id}")
async def delete_automation_rule(rule_id: str):
    """Delete an automation rule"""
    global AUTOMATION_RULES
    original_length = len(AUTOMATION_RULES)
    rule_name = None
    
    for rule in AUTOMATION_RULES:
        if rule["id"] == rule_id:
            rule_name = rule["name"]
            break
    
    AUTOMATION_RULES = [rule for rule in AUTOMATION_RULES if rule["id"] != rule_id]
    
    if len(AUTOMATION_RULES) < original_length:
        log_audit_event("rule_deleted", f"Automation rule '{rule_name}' deleted", {"rule_id": rule_id})
        return JSONResponse(status_code=200, content={"detail": "Rule deleted successfully"})
    else:
        return JSONResponse(status_code=404, content={"detail": "Rule not found"})

@app.post("/api/environments/{environment_id}/update")
async def update_environment_parameter(environment_id: int, update_data: dict):
    """Update environment parameters (for automation rules)"""
    environment = None
    for env in ENVIRONMENTS_DATA:
        if env["id"] == environment_id:
            environment = env
            break
    
    if not environment:
        return JSONResponse(status_code=404, content={"detail": "Environment not found"})
    
    # Update environment with new parameters
    for key, value in update_data.items():
        environment[key] = value
    
    # Log parameter update
    log_audit_event("parameter_updated", f"Environment {environment['name']} parameter updated", update_data)
    
    return environment

# ===== ALERTS AND NOTIFICATIONS API =====

@app.get("/api/alerts")
async def get_alerts():
    """Get all alerts"""
    return ALERTS_DATA

@app.post("/api/alerts")
async def create_alert(alert_data: dict):
    """Create a new alert"""
    new_alert = {
        "id": len(ALERTS_DATA) + 1,
        "message": alert_data.get("message", ""),
        "level": alert_data.get("level", "info"),
        "chamber": alert_data.get("chamber", ""),
        "timestamp": alert_data.get("timestamp"),
        "acknowledged": False,
        "source": alert_data.get("source", "automation")
    }
    
    ALERTS_DATA.append(new_alert)
    
    # Log alert creation
    log_audit_event("alert_created", f"Alert created: {new_alert['message']}", new_alert)
    
    return new_alert

@app.put("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int):
    """Acknowledge an alert"""
    for alert in ALERTS_DATA:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            log_audit_event("alert_acknowledged", f"Alert acknowledged: {alert['message']}", alert)
            return alert
    return JSONResponse(status_code=404, content={"detail": "Alert not found"})

# ===== AUDIT LOGGING API =====

@app.get("/api/audit/log")
async def get_audit_log():
    """Get audit log entries"""
    return AUDIT_LOG

def log_audit_event(event_type: str, description: str, data: dict = None):
    """Log an audit event"""
    import datetime
    
    audit_entry = {
        "id": len(AUDIT_LOG) + 1,
        "timestamp": datetime.datetime.now().isoformat(),
        "event_type": event_type,
        "description": description,
        "data": data or {},
        "user": "system"  # In a real system, this would be the authenticated user
    }
    
    AUDIT_LOG.append(audit_entry)
    
    # Keep only last 1000 audit entries
    if len(AUDIT_LOG) > 1000:
        AUDIT_LOG[:] = AUDIT_LOG[-1000:]
    
    return audit_entry

# Mount static files
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

from sqlalchemy.orm import Session
from ..models import Species, GrowPhase, User
from ..models.user import UserRole

def seed_default_species(db: Session):
    """Seed the database with default mushroom species and their grow phases"""
    
    # Check if species already exist
    existing_species = db.query(Species).first()
    if existing_species:
        print("Species already exist in database, skipping seeding...")
        return
    
    print("Seeding default mushroom species...")
    
    # Default species data with their grow phases
    species_data = [
        {
            "name": "Lion's Mane",
            "scientific_name": "Hericium erinaceus",
            "description": "A distinctive white, shaggy mushroom with cascading spines. Known for its seafood-like taste and potential cognitive benefits.",
            "default_temperature_min": 18.0,
            "default_temperature_max": 24.0,
            "default_humidity_min": 85.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 500.0,
            "default_co2_max": 1000.0,
            "default_fae_cycles_per_day": 4,
            "default_light_hours_per_day": 12.0,
            "typical_grow_time_days": 21,
            "difficulty_level": "beginner",
            "notes": "Excellent beginner mushroom. Prefers cooler temperatures and high humidity.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Initial mycelium growth phase",
                    "temperature_min": 20.0,
                    "temperature_max": 24.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 1000.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 10,
                    "auto_transition": True
                },
                {
                    "name": "fruiting",
                    "order_index": 2,
                    "description": "Mushroom formation and growth phase",
                    "temperature_min": 16.0,
                    "temperature_max": 20.0,
                    "humidity_min": 85.0,
                    "humidity_max": 90.0,
                    "co2_min": 400.0,
                    "co2_max": 800.0,
                    "fae_cycles_per_day": 6,
                    "light_hours_per_day": 12.0,
                    "typical_duration_days": 11,
                    "misting_frequency_per_day": 3
                }
            ]
        },
        {
            "name": "Shiitake",
            "scientific_name": "Lentinula edodes",
            "description": "Popular brown mushroom with a rich, smoky flavor. Requires specific temperature cycling for optimal fruiting.",
            "default_temperature_min": 12.0,
            "default_temperature_max": 25.0,
            "default_humidity_min": 80.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 500.0,
            "default_co2_max": 1000.0,
            "default_fae_cycles_per_day": 4,
            "default_light_hours_per_day": 12.0,
            "typical_grow_time_days": 35,
            "difficulty_level": "intermediate",
            "notes": "Requires temperature shock for pinning. Longer colonization period.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Extended mycelium colonization phase",
                    "temperature_min": 22.0,
                    "temperature_max": 25.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 2000.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 21,
                    "auto_transition": False
                },
                {
                    "name": "consolidation",
                    "order_index": 2,
                    "description": "Mycelium strengthening and preparation phase",
                    "temperature_min": 20.0,
                    "temperature_max": 23.0,
                    "humidity_min": 85.0,
                    "humidity_max": 90.0,
                    "co2_min": 1000.0,
                    "co2_max": 2000.0,
                    "fae_cycles_per_day": 2,
                    "light_hours_per_day": 8.0,
                    "typical_duration_days": 7,
                    "auto_transition": False
                },
                {
                    "name": "fruiting",
                    "order_index": 3,
                    "description": "Temperature shock and mushroom formation",
                    "temperature_min": 12.0,
                    "temperature_max": 18.0,
                    "humidity_min": 80.0,
                    "humidity_max": 85.0,
                    "co2_min": 400.0,
                    "co2_max": 800.0,
                    "fae_cycles_per_day": 6,
                    "light_hours_per_day": 12.0,
                    "typical_duration_days": 7,
                    "misting_frequency_per_day": 4
                }
            ]
        },
        {
            "name": "Blue Oyster",
            "scientific_name": "Pleurotus columbinus",
            "description": "Fast-growing blue-gray oyster mushroom. Excellent for beginners with high yields.",
            "default_temperature_min": 10.0,
            "default_temperature_max": 24.0,
            "default_humidity_min": 85.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 500.0,
            "default_co2_max": 1000.0,
            "default_fae_cycles_per_day": 6,
            "default_light_hours_per_day": 12.0,
            "typical_grow_time_days": 14,
            "difficulty_level": "beginner",
            "notes": "Very forgiving and fast-growing. Prefers cooler temperatures.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Rapid mycelium growth phase",
                    "temperature_min": 20.0,
                    "temperature_max": 24.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 1000.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 7,
                    "auto_transition": True
                },
                {
                    "name": "fruiting",
                    "order_index": 2,
                    "description": "Cool temperature fruiting phase",
                    "temperature_min": 10.0,
                    "temperature_max": 18.0,
                    "humidity_min": 85.0,
                    "humidity_max": 90.0,
                    "co2_min": 400.0,
                    "co2_max": 800.0,
                    "fae_cycles_per_day": 8,
                    "light_hours_per_day": 12.0,
                    "typical_duration_days": 7,
                    "misting_frequency_per_day": 4
                }
            ]
        },
        {
            "name": "Pink Oyster",
            "scientific_name": "Pleurotus djamor",
            "description": "Vibrant pink mushroom that prefers warmer temperatures. Fast-growing with excellent flavor.",
            "default_temperature_min": 18.0,
            "default_temperature_max": 30.0,
            "default_humidity_min": 85.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 500.0,
            "default_co2_max": 1000.0,
            "default_fae_cycles_per_day": 6,
            "default_light_hours_per_day": 12.0,
            "typical_grow_time_days": 12,
            "difficulty_level": "beginner",
            "notes": "Heat-loving oyster variety. Loses pink color when cooked.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Warm temperature colonization",
                    "temperature_min": 24.0,
                    "temperature_max": 30.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 1000.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 5,
                    "auto_transition": True
                },
                {
                    "name": "fruiting",
                    "order_index": 2,
                    "description": "Warm fruiting phase",
                    "temperature_min": 18.0,
                    "temperature_max": 26.0,
                    "humidity_min": 85.0,
                    "humidity_max": 90.0,
                    "co2_min": 400.0,
                    "co2_max": 800.0,
                    "fae_cycles_per_day": 8,
                    "light_hours_per_day": 12.0,
                    "typical_duration_days": 7,
                    "misting_frequency_per_day": 5
                }
            ]
        },
        {
            "name": "King Oyster",
            "scientific_name": "Pleurotus eryngii",
            "description": "Large, meaty mushroom with thick stems. Excellent texture and flavor, often used as meat substitute.",
            "default_temperature_min": 12.0,
            "default_temperature_max": 22.0,
            "default_humidity_min": 85.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 500.0,
            "default_co2_max": 1000.0,
            "default_fae_cycles_per_day": 4,
            "default_light_hours_per_day": 12.0,
            "typical_grow_time_days": 21,
            "difficulty_level": "intermediate",
            "notes": "Requires specific CO2 levels for proper stem development. Slower growing than other oysters.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Moderate temperature colonization",
                    "temperature_min": 18.0,
                    "temperature_max": 22.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 1500.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 14,
                    "auto_transition": False
                },
                {
                    "name": "fruiting",
                    "order_index": 2,
                    "description": "Cool fruiting with controlled CO2",
                    "temperature_min": 12.0,
                    "temperature_max": 18.0,
                    "humidity_min": 85.0,
                    "humidity_max": 90.0,
                    "co2_min": 800.0,
                    "co2_max": 1200.0,
                    "fae_cycles_per_day": 4,
                    "light_hours_per_day": 12.0,
                    "typical_duration_days": 7,
                    "misting_frequency_per_day": 3
                }
            ]
        },
        {
            "name": "Enoki",
            "scientific_name": "Flammulina velutipes",
            "description": "Delicate, long-stemmed mushrooms with small caps. Requires specific conditions for proper formation.",
            "default_temperature_min": 8.0,
            "default_temperature_max": 18.0,
            "default_humidity_min": 90.0,
            "default_humidity_max": 95.0,
            "default_co2_min": 1000.0,
            "default_co2_max": 3000.0,
            "default_fae_cycles_per_day": 2,
            "default_light_hours_per_day": 4.0,
            "typical_grow_time_days": 28,
            "difficulty_level": "advanced",
            "notes": "Requires very specific conditions and high CO2 for long stem development. Challenging for beginners.",
            "phases": [
                {
                    "name": "colonization",
                    "order_index": 1,
                    "description": "Cool colonization phase",
                    "temperature_min": 15.0,
                    "temperature_max": 18.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 2000.0,
                    "co2_max": 5000.0,
                    "fae_cycles_per_day": 0,
                    "light_hours_per_day": 0.0,
                    "typical_duration_days": 21,
                    "auto_transition": False
                },
                {
                    "name": "fruiting",
                    "order_index": 2,
                    "description": "Cold fruiting with high CO2",
                    "temperature_min": 8.0,
                    "temperature_max": 12.0,
                    "humidity_min": 90.0,
                    "humidity_max": 95.0,
                    "co2_min": 1000.0,
                    "co2_max": 3000.0,
                    "fae_cycles_per_day": 2,
                    "light_hours_per_day": 4.0,
                    "typical_duration_days": 7,
                    "misting_frequency_per_day": 2
                }
            ]
        }
    ]
    
    # Create species and their phases
    for species_info in species_data:
        phases_data = species_info.pop("phases")
        
        # Create species
        species = Species(**species_info)
        db.add(species)
        db.commit()
        db.refresh(species)
        
        # Create grow phases
        for phase_data in phases_data:
            phase = GrowPhase(**phase_data, species_id=species.id)
            db.add(phase)
        
        db.commit()
        print(f"Created species: {species.name} with {len(phases_data)} phases")
    
    print(f"Successfully seeded {len(species_data)} mushroom species!")

def seed_default_admin_user(db: Session):
    """Create a default admin user"""
    # Check if any users exist
    existing_user = db.query(User).first()
    if existing_user:
        print("Users already exist in database, skipping admin user creation...")
        return
    
    print("Creating default admin user...")
    
    admin_user = User(
        username="admin",
        email="admin@mushroomcultivation.local",
        full_name="System Administrator",
        role=UserRole.ADMIN,
        hashed_password="hashed_admin123",  # In production, use proper password hashing
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print("Created default admin user (username: admin, password: admin123)")
    print("WARNING: Please change the default password in production!")

def seed_database(db: Session):
    """Seed the database with all default data"""
    print("Starting database seeding...")
    seed_default_species(db)
    seed_default_admin_user(db)
    print("Database seeding completed!")

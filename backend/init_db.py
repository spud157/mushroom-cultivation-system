#!/usr/bin/env python3
"""
Database initialization script for Mushroom Cultivation Automation System
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import create_tables, get_db
from app.core.seed_data import seed_database

def main():
    """Initialize the database with tables and seed data"""
    print("🍄 Mushroom Cultivation System - Database Initialization")
    print("=" * 60)
    
    try:
        # Create tables
        print("Creating database tables...")
        create_tables()
        print("✓ Database tables created successfully")
        
        # Seed database
        print("\nSeeding database with default data...")
        db = next(get_db())
        try:
            seed_database(db)
            print("✓ Database seeded successfully")
        finally:
            db.close()
        
        print("\n🎉 Database initialization completed!")
        print("\nYou can now start the server with:")
        print("  python -m uvicorn app.main:app --reload")
        print("\nOr run the main.py file directly:")
        print("  python app/main.py")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

"""
Sensor simulation service for generating realistic environmental data
"""
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from ..models.sensor_log import SensorLog
from ..models.environment import Environment
from ..models.species import Species


class SensorSimulator:
    """Simulates realistic sensor readings for mushroom cultivation environments"""
    
    def __init__(self):
        self.base_readings = {
            'temperature': 22.0,  # Base temperature in Celsius
            'humidity': 85.0,     # Base humidity percentage
            'co2': 800.0,         # Base CO2 in PPM
            'airflow': 2.5,       # Base airflow in m/s
            'light': 12.0         # Base light hours per day
        }
        
        # Variation ranges for realistic fluctuations
        self.variations = {
            'temperature': 2.0,   # ±2°C variation
            'humidity': 5.0,      # ±5% variation
            'co2': 200.0,         # ±200 PPM variation
            'airflow': 0.5,       # ±0.5 m/s variation
            'light': 1.0          # ±1 hour variation
        }
    
    def generate_reading(self, sensor_type: str, environment: Environment, species: Optional[Species] = None) -> float:
        """Generate a realistic sensor reading based on environment and species requirements"""
        
        # Get base value
        base_value = self.base_readings.get(sensor_type, 0.0)
        variation = self.variations.get(sensor_type, 1.0)
        
        # Adjust based on species requirements if available
        if species:
            if sensor_type == 'temperature':
                if species.default_temperature_min and species.default_temperature_max:
                    target = (species.default_temperature_min + species.default_temperature_max) / 2
                    base_value = target
            elif sensor_type == 'humidity':
                if species.default_humidity_min and species.default_humidity_max:
                    target = (species.default_humidity_min + species.default_humidity_max) / 2
                    base_value = target
            elif sensor_type == 'co2':
                if species.default_co2_min and species.default_co2_max:
                    target = (species.default_co2_min + species.default_co2_max) / 2
                    base_value = target
        
        # Add realistic variation with some trending
        trend = random.uniform(-0.3, 0.3)  # Small trending factor
        noise = random.uniform(-variation, variation)
        
        # Apply time-based variations (simulate day/night cycles for some sensors)
        time_factor = 1.0
        current_hour = datetime.now().hour
        
        if sensor_type == 'temperature':
            # Slight temperature variation based on time of day
            time_factor = 1.0 + 0.1 * math.sin((current_hour / 24) * 2 * math.pi)
        elif sensor_type == 'co2':
            # CO2 might vary with ventilation cycles
            time_factor = 1.0 + 0.05 * math.sin((current_hour / 12) * 2 * math.pi)
        
        reading = base_value * time_factor + trend + noise
        
        # Ensure readings stay within realistic bounds
        if sensor_type == 'temperature':
            reading = max(10.0, min(35.0, reading))  # 10-35°C
        elif sensor_type == 'humidity':
            reading = max(30.0, min(100.0, reading))  # 30-100%
        elif sensor_type == 'co2':
            reading = max(400.0, min(2000.0, reading))  # 400-2000 PPM
        elif sensor_type == 'airflow':
            reading = max(0.1, min(10.0, reading))  # 0.1-10 m/s
        elif sensor_type == 'light':
            reading = max(0.0, min(24.0, reading))  # 0-24 hours
        
        return round(reading, 2)
    
    def create_sensor_logs(self, db: Session, environment_id: int, species: Optional[Species] = None) -> List[SensorLog]:
        """Create sensor log entries for an environment"""
        
        sensor_types = ['temperature', 'humidity', 'co2', 'airflow']
        logs = []
        
        environment = db.query(Environment).filter(Environment.id == environment_id).first()
        if not environment:
            return logs
        
        for sensor_type in sensor_types:
            reading = self.generate_reading(sensor_type, environment, species)
            
            log = SensorLog(
                environment_id=environment_id,
                sensor_type=sensor_type,
                value=reading,
                unit=self.get_sensor_unit(sensor_type),
                timestamp=datetime.utcnow(),
                metadata={
                    'simulated': True,
                    'species_optimized': species is not None,
                    'species_name': species.name if species else None
                }
            )
            
            db.add(log)
            logs.append(log)
        
        db.commit()
        return logs
    
    def get_sensor_unit(self, sensor_type: str) -> str:
        """Get the unit for a sensor type"""
        units = {
            'temperature': '°C',
            'humidity': '%',
            'co2': 'PPM',
            'airflow': 'm/s',
            'light': 'hours'
        }
        return units.get(sensor_type, '')
    
    def generate_historical_data(self, db: Session, environment_id: int, days: int = 7) -> List[SensorLog]:
        """Generate historical sensor data for the past N days"""
        
        environment = db.query(Environment).filter(Environment.id == environment_id).first()
        if not environment:
            return []
        
        species = None
        if environment.species_id:
            species = db.query(Species).filter(Species.id == environment.species_id).first()
        
        logs = []
        sensor_types = ['temperature', 'humidity', 'co2', 'airflow']
        
        # Generate data points every hour for the past N days
        start_time = datetime.utcnow() - timedelta(days=days)
        current_time = start_time
        
        while current_time < datetime.utcnow():
            for sensor_type in sensor_types:
                reading = self.generate_reading(sensor_type, environment, species)
                
                log = SensorLog(
                    environment_id=environment_id,
                    sensor_type=sensor_type,
                    value=reading,
                    unit=self.get_sensor_unit(sensor_type),
                    timestamp=current_time,
                    metadata={
                        'simulated': True,
                        'historical': True,
                        'species_optimized': species is not None
                    }
                )
                
                logs.append(log)
            
            current_time += timedelta(hours=1)
        
        # Batch insert for performance
        db.add_all(logs)
        db.commit()
        
        return logs


# Import math for sine calculations
import math

# Global simulator instance
sensor_simulator = SensorSimulator()

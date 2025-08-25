from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class SensorLog(BaseModel):
    __tablename__ = "sensor_logs"
    
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Environmental readings
    temperature = Column(Float)  # Celsius
    humidity = Column(Float)     # Percentage
    co2_level = Column(Float)    # PPM
    light_level = Column(Float)  # Lux or percentage
    airflow = Column(Float)      # CFM or percentage
    
    # Sensor metadata
    sensor_type = Column(String(50))  # DHT22, SHT31, SCD30, etc.
    sensor_id = Column(String(50))    # Physical sensor identifier
    reading_quality = Column(String(20), default="good")  # good, warning, error
    
    # Additional data
    raw_data = Column(JSON)  # Store raw sensor data if needed
    calibration_offset = Column(JSON)  # Applied calibration offsets
    
    # Relationships
    environment = relationship("Environment", back_populates="sensor_logs")
    
    def __repr__(self):
        return f"<SensorLog(env='{self.environment.name if self.environment else 'Unknown'}', temp={self.temperature}, humidity={self.humidity})>"

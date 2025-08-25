from pydantic import BaseModel
from typing import Optional
import os

class Settings(BaseModel):
    # Application settings
    APP_NAME: str = "Mushroom Cultivation Automation System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./mushroom_cultivation.db"
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # MQTT settings
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: Optional[str] = None
    MQTT_PASSWORD: Optional[str] = None
    MQTT_TOPIC_PREFIX: str = "mushroom"
    
    # Serial communication settings
    SERIAL_PORT: Optional[str] = None
    SERIAL_BAUDRATE: int = 115200
    
    # Alert settings
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    ALERT_EMAIL_FROM: Optional[str] = None
    
    # SMS settings (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Webhook settings
    WEBHOOK_URL: Optional[str] = None
    WEBHOOK_SECRET: Optional[str] = None
    
    # File storage settings
    UPLOAD_DIR: str = "./uploads"
    LOG_DIR: str = "./logs"
    BACKUP_DIR: str = "./backups"
    
    # Camera settings
    CAMERA_ENABLED: bool = False
    CAMERA_CAPTURE_INTERVAL_MINUTES: int = 60
    TIMELAPSE_ENABLED: bool = False
    
    # System settings
    SENSOR_READING_INTERVAL_SECONDS: int = 30
    AUTOMATION_CHECK_INTERVAL_SECONDS: int = 60
    DATA_RETENTION_DAYS: int = 365
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

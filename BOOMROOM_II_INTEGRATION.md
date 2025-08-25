# BoomRoom II Integration Guide for M.U.S.H System

## Overview
This guide shows how to integrate North Spore's BoomRoom II Automated Martha Tent System with the M.U.S.H (Mushroom Cultivation System) automation platform for advanced control and monitoring.

## BoomRoom II Hardware Specifications

### Included Components:
- **Tent**: 27"(W) x 19"(D) x 63"(H) - 18 cubic ft capacity
- **Mycontroller**: Humidity controller with built-in sensor
- **Myco-Mister II**: 4.4 gallon ultrasonic humidifier (3 transducers)
- **FAE Fan**: Fresh Air Exchange fan with 8ft ducting
- **5-Rack System**: Accommodates trays, blocks, jars, and kits
- **Fan Filters**: 3 reusable filters for air filtration
- **Spore Floor II**: Drip tray protection system

## Integration Architecture

### Hardware Modifications Required:

#### 1. ESP32 Microcontroller Setup
```
ESP32 DevKit v1 (recommended)
├── GPIO Pins for Sensor Input
│   ├── Pin 4: DHT22 Temperature/Humidity Sensor
│   ├── Pin 5: SCD30 CO2 Sensor (I2C SDA)
│   ├── Pin 18: SCD30 CO2 Sensor (I2C SCL)
│   └── Pin 34: Analog input for additional sensors
├── GPIO Pins for Relay Control
│   ├── Pin 2: Myco-Mister II Control Relay
│   ├── Pin 16: FAE Fan Control Relay
│   ├── Pin 17: Optional Heater Control Relay
│   └── Pin 21: Optional Light Control Relay
└── Power: 5V from USB or external adapter
```

#### 2. Sensor Integration
- **Primary Humidity**: Tap into existing Mycontroller sensor
- **Temperature**: Add DHT22 sensor near intake
- **CO2 Monitoring**: Install SCD30 sensor in tent
- **Optional**: Light sensor for day/night cycles

#### 3. Actuator Control
- **Humidifier**: Control Myco-Mister II via relay
- **FAE Fan**: Control existing fan via relay or PWM
- **Optional**: Add heating element for temperature control
- **Optional**: LED grow lights with timer control

## Wiring Diagram

### Power Distribution:
```
120V AC Main Power
├── BoomRoom II Original Controllers (if keeping as backup)
├── 5V DC Power Supply → ESP32
└── Relay Module (5V) → Controlled Devices
    ├── Myco-Mister II (120V AC)
    ├── FAE Fan (120V AC)
    ├── Optional Heater (120V AC)
    └── Optional Lights (120V AC)
```

### Sensor Connections:
```
ESP32 → DHT22 Temperature/Humidity Sensor
├── 3.3V → VCC
├── GND → GND
└── GPIO 4 → Data Pin

ESP32 → SCD30 CO2 Sensor
├── 3.3V → VCC
├── GND → GND
├── GPIO 5 → SDA
└── GPIO 18 → SCL
```

### Relay Control:
```
ESP32 → 4-Channel Relay Module
├── 5V → VCC
├── GND → GND
├── GPIO 2 → Relay 1 (Humidifier)
├── GPIO 16 → Relay 2 (FAE Fan)
├── GPIO 17 → Relay 3 (Heater)
└── GPIO 21 → Relay 4 (Lights)
```

## Software Configuration

### ESP32 Arduino Code Structure:
```cpp
// Libraries
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <SCD30.h>

// Pin Definitions
#define DHT_PIN 4
#define RELAY_HUMIDIFIER 2
#define RELAY_FAN 16
#define RELAY_HEATER 17
#define RELAY_LIGHTS 21

// Sensor Objects
DHT dht(DHT_PIN, DHT22);
SCD30 scd30;

// MQTT Configuration
const char* mqtt_server = "192.168.1.100";  // M.U.S.H server IP
const char* chamber_id = "boomroom_01";

// Main Functions
void setup() {
  // Initialize sensors and relays
  // Connect to WiFi and MQTT
  // Subscribe to control topics
}

void loop() {
  // Read sensor data every 30 seconds
  // Publish to M.U.S.H system
  // Listen for automation commands
  // Execute relay controls
}
```

### M.U.S.H System Integration:

#### Backend API Extensions:
```python
# Add BoomRoom II specific endpoints
@app.get("/api/boomroom/{chamber_id}/status")
async def get_boomroom_status(chamber_id: str):
    """Get real-time BoomRoom II status"""
    
@app.post("/api/boomroom/{chamber_id}/control")
async def control_boomroom_device(chamber_id: str, command: dict):
    """Control BoomRoom II devices"""
```

#### MQTT Topics Structure:
```
boomroom/01/sensors/temperature    → Temperature readings
boomroom/01/sensors/humidity       → Humidity readings  
boomroom/01/sensors/co2           → CO2 readings
boomroom/01/control/humidifier    → Humidifier on/off
boomroom/01/control/fan           → FAE fan control
boomroom/01/control/heater        → Heater control
boomroom/01/control/lights        → Light control
boomroom/01/status                → Overall system status
```

## Installation Steps

### Phase 1: Basic Integration
1. **Install ESP32** in BoomRoom II tent
2. **Add DHT22 sensor** for temperature monitoring
3. **Install relay module** for device control
4. **Connect to existing Myco-Mister II** via relay
5. **Connect to FAE fan** via relay
6. **Test basic on/off control** from M.U.S.H dashboard

### Phase 2: Advanced Monitoring
1. **Install SCD30 CO2 sensor** in tent
2. **Add light sensor** for day/night detection
3. **Implement MQTT communication** with M.U.S.H server
4. **Configure automation rules** for BoomRoom II
5. **Test species-specific automation**

### Phase 3: Professional Features
1. **Add heating element** for temperature control
2. **Install LED grow lights** with timer
3. **Implement advanced FAE cycling**
4. **Add emergency shutdown** protection
5. **Configure mobile alerts** and remote monitoring

## Safety Considerations

### Electrical Safety:
- Use proper relay modules rated for 120V AC
- Install GFCI protection for all AC devices
- Keep all low-voltage wiring separate from AC wiring
- Use proper enclosures for all electrical connections

### Mushroom Safety:
- Maintain sterile conditions during installation
- Use food-grade materials for any tent modifications
- Ensure proper ventilation and filtration
- Test all systems before introducing mushroom cultures

## Automation Rules for BoomRoom II

### Species-Specific Profiles:
```yaml
Lion's Mane BoomRoom Profile:
  temperature: 65-75°F
  humidity: 85-95%
  co2: 400-800 ppm
  fae_cycles: 4 per day (15 min each)
  light_schedule: 12 hours on/off

Shiitake BoomRoom Profile:
  temperature: 55-75°F
  humidity: 80-90%
  co2: 800-1200 ppm
  fae_cycles: 3 per day (20 min each)
  light_schedule: 8 hours on/16 off
```

### Emergency Protocols:
- Temperature > 85°F: Activate emergency cooling
- Humidity < 70%: Increase misting frequency
- CO2 > 2000 ppm: Force FAE cycle
- Power failure: Send immediate alert

## Troubleshooting

### Common Issues:
1. **WiFi Connection**: Check network credentials and signal strength
2. **Sensor Readings**: Verify wiring and power connections
3. **Relay Control**: Test relay module independently
4. **MQTT Communication**: Check broker settings and topics
5. **Automation Rules**: Verify rule logic and conditions

### Diagnostic Commands:
```bash
# Test MQTT connection
mosquitto_pub -h localhost -t boomroom/01/test -m "hello"

# Monitor sensor data
mosquitto_sub -h localhost -t boomroom/01/sensors/+

# Check relay status
curl http://localhost:8001/api/boomroom/01/status
```

## Parts List

### Required Components:
- ESP32 DevKit v1 ($10)
- DHT22 Temperature/Humidity Sensor ($5)
- SCD30 CO2 Sensor ($50)
- 4-Channel Relay Module ($8)
- Breadboard and Jumper Wires ($10)
- 5V Power Supply ($8)
- Electrical Enclosure ($15)

### Optional Components:
- Heating Element ($20)
- LED Grow Lights ($30)
- Light Sensor ($3)
- Additional Relays ($5)

**Total Cost: ~$100-160 for full integration**

## Support and Updates

This integration guide will be updated as new features are added to the M.U.S.H system. For technical support or custom modifications, refer to the main M.U.S.H documentation.

---
**© Kroll Management LLC - Professional Mushroom Cultivation Automation**

# M.U.S.H - Mushroom Cultivation Automation System

A comprehensive mushroom cultivation automation system with **Batch + Cell Manager**, environmental monitoring, and species-specific grow profiles. Features a dark cyberpunk CMD terminal interface.

## 🚀 Key Features

### Batch + Cell Manager
- **Complete Batch Workflow**: Create, start, pause, resume, and abort cultivation batches
- **Species Assignment**: One-click assignment of species profiles to grow chambers
- **Live Monitoring**: Real-time environmental data with safety threshold alerts
- **Action Logging**: Complete audit trail of all batch operations and adjustments
- **Photo Documentation**: Upload and manage batch progress photos with notes

### Core System
- **Independent Grow Chambers**: Each chamber functions independently with species-specific automation
- **Multi-Stage Profiles**: Support for distinct grow phases (colonization, consolidation, fruiting)
- **Environmental Control**: Temperature, humidity, CO₂, airflow, and lighting automation
- **Species Library**: Comprehensive database with customizable grow profiles
- **Real-time Dashboard**: Terminal-style UI with live sensor data and control interface
- **Automation Rules**: Visual rule builder with conditional logic and threshold-based actions
- **Alert System**: Configurable alerts with multi-channel notifications
- **User Management**: Role-based access control (Admin/Viewer)

## Architecture

- **Frontend**: React dashboard with tile-based chamber views
- **Backend**: Python (FastAPI) with SQLite/PostgreSQL database
- **Hardware**: Raspberry Pi controller with ESP32/Arduino microcontrollers
- **Communication**: MQTT/Serial for sensor and actuator control
- **Sensors**: DHT22/SHT31 (temp/humidity), SCD30/MH-Z19B (CO₂)
- **Actuators**: Relay-controlled fans, humidifiers, heat mats, CO₂ valves, lighting

## Default Species Supported

- Shiitake
- Lion's Mane
- Blue Oyster
- Pink Oyster
- King Oyster
- Enoki

## 📁 Project Structure

```
mushroom-cultivation-system/
├── simple_server.py        # FastAPI backend with all endpoints
├── frontend/               # Terminal-style web interface
│   ├── index.html         # Main dashboard
│   ├── grow.html          # Batch + Cell Manager
│   ├── automation-rules.html
│   ├── alerts.html
│   ├── phase-management.html
│   ├── batch-operations.html
│   ├── sensor-data.html
│   ├── user-management.html
│   ├── login.html
│   ├── simple_app.js      # Core JavaScript functionality
│   ├── grow-manager.js    # Batch + Cell Manager logic
│   └── terminal-status.css # CMD terminal styling
└── README.md
```

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   python simple_server.py
   ```

2. **Access the system:**
   - Main Dashboard: http://127.0.0.1:8001/
   - Batch Manager: http://127.0.0.1:8001/grow.html

3. **Login:**
   - Username: `admin`
   - Password: `admin123`

## 🍄 Usage

### Creating a Batch
1. Navigate to **Grow** → **Start Batch**
2. Enter batch name and select species
3. Choose an available chamber
4. Click **Create & Start Batch**

### Monitoring Batches
1. Go to **Batch Monitor** tab
2. Select active batch from dropdown
3. View live environmental data
4. Use pause/resume/abort controls as needed

### Managing Species
1. Visit **Species Library** tab
2. View all available mushroom profiles
3. Click **Assign to Chamber** for quick batch creation

## License

MIT License

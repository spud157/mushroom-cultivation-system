class MushroomCultivationApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.environments = [];
        this.species = [];
        this.selectedChamber = null;
        this.selectedSpecies = null;
        this.refreshInterval = null;
    }

    async init() {
        try {
            await this.loadSpecies();
            await this.loadEnvironments();
            this.renderSpecies();
            this.renderChambers();
            this.updateSystemStatus();
            this.loadAlerts();
            this.setupEventListeners();
            this.startAutoRefresh();
            // Initialize sensor monitoring with live data tab
            this.showSensorTab('live');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    setupEventListeners() {
        // Close alerts panel when clicking outside
        document.addEventListener('click', (e) => {
            const alertsPanel = document.getElementById('alerts-panel');
            const alertsButton = document.querySelector('.alert-indicator');
            
            if (alertsPanel && alertsPanel.style.display === 'block' && 
                !alertsPanel.contains(e.target) && !alertsButton.contains(e.target)) {
                alertsPanel.style.display = 'none';
            }
        });

        // Close alerts panel button
        const closeAlertsBtn = document.getElementById('close-alerts');
        if (closeAlertsBtn) {
            closeAlertsBtn.onclick = () => {
                document.getElementById('alerts-panel').style.display = 'none';
            };
        }
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async loadSpecies() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/species/`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.species = await response.json();
        } catch (error) {
            console.error('Error loading species:', error);
            this.species = [];
        }
    }

    async loadEnvironments() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.environments = await response.json();
        } catch (error) {
            console.error('Error loading environments:', error);
            this.environments = [];
        }
    }

    renderChambers() {
        const chambersGrid = document.getElementById('chambers-grid');
        if (!chambersGrid) return;

        if (this.environments.length === 0) {
            chambersGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-home"></i>
                    <h3>No Chambers Available</h3>
                    <p>Connect to API to load chamber data</p>
                </div>
            `;
            return;
        }

        chambersGrid.innerHTML = this.environments.map(env => {
            const species = env.species_id ? this.species.find(s => s.id === env.species_id) : null;
            const statusClass = env.is_active ? 'active' : 'inactive';
            
            // Use direct sensor data fields from environment
            const temperature = { 
                value: env.temperature, 
                display: env.temperature ? `${env.temperature.toFixed(1)}°C` : '--°C' 
            };
            const humidity = { 
                value: env.humidity, 
                display: env.humidity ? `${env.humidity.toFixed(1)}%` : '--%' 
            };
            const co2 = { 
                value: env.co2, 
                display: env.co2 ? `${env.co2} PPM` : '-- PPM' 
            };
            const airflow = { 
                value: env.airflow, 
                display: env.airflow ? `${env.airflow.toFixed(1)} m/s` : '-- m/s' 
            };

            return `
                <div class="chamber-card ${statusClass}" onclick="app.openChamberModal(${env.id})">
                    <div class="chamber-header">
                        <div class="chamber-name">${env.name}</div>
                        <div class="chamber-status ${statusClass}">
                            <i class="fas fa-circle"></i>
                            ${env.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    
                    <div class="chamber-species">
                        ${species ? 
                            `<i class="fas fa-leaf"></i> ${species.name}` : 
                            '<i class="fas fa-plus"></i> No species assigned'
                        }
                    </div>
                    
                    <div class="sensor-grid">
                        <div class="sensor-item">
                            <div class="sensor-label">Temperature</div>
                            <div class="sensor-value">${temperature.display}</div>
                        </div>
                        <div class="sensor-item">
                            <div class="sensor-label">Humidity</div>
                            <div class="sensor-value">${humidity.display}</div>
                        </div>
                        <div class="sensor-item">
                            <div class="sensor-label">CO2</div>
                            <div class="sensor-value">${co2.display}</div>
                        </div>
                        <div class="sensor-item">
                            <div class="sensor-label">Airflow</div>
                            <div class="sensor-value">${airflow.display}</div>
                        </div>
                    </div>
                    
                    <div class="sensor-timestamp">
                        Last updated: ${env.last_sensor_update ? 
                            new Date(env.last_sensor_update).toLocaleString() : 
                            'Never'
                        }
                    </div>
                    
                    <div class="chamber-actions">
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.simulateSensorData(${env.id})">
                            📊 Update Sensors
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.openSpeciesModal(${env.id})">
                            ${species ? 'Change Species' : 'Assign Species'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async refreshData() {
        try {
            await this.loadSpecies();
            await this.loadEnvironments();
            this.renderSpecies();
            this.renderChambers();
            this.updateSystemStatus();
            this.loadAlerts();
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    updateSystemStatus() {
        const activeChambers = this.environments.filter(env => env.is_active).length;
        const speciesCount = this.species.length;
        
        document.getElementById('active-chambers-count').textContent = activeChambers;
        document.getElementById('species-count').textContent = speciesCount;
        document.getElementById('system-status').textContent = 'Online';
    }

    async loadAlerts() {
        // Simulate alert checking
        const alerts = this.checkSystemAlerts();
        const alertCount = alerts.length;
        
        const alertCountElement = document.getElementById('active-alerts-count');
        alertCountElement.textContent = alertCount;
        alertCountElement.className = `status-value alert-indicator ${alertCount > 0 ? 'has-alerts' : ''}`;
        
        // Make alert count clickable to show alerts panel
        alertCountElement.onclick = alertCount > 0 ? () => this.showAlertsPanel(alerts) : null;
        alertCountElement.style.cursor = alertCount > 0 ? 'pointer' : 'default';
    }

    checkSystemAlerts() {
        const alerts = [];
        
        // Check for sensor issues
        this.environments.forEach(env => {
            if (env.is_active) {
                if (!env.temperature || env.temperature < 15 || env.temperature > 30) {
                    alerts.push({
                        type: 'warning',
                        chamber: env.name,
                        message: `Temperature out of range: ${env.temperature || 'N/A'}°C`,
                        timestamp: new Date().toISOString()
                    });
                }
                
                if (!env.humidity || env.humidity < 70 || env.humidity > 95) {
                    alerts.push({
                        type: 'warning',
                        chamber: env.name,
                        message: `Humidity out of range: ${env.humidity || 'N/A'}%`,
                        timestamp: new Date().toISOString()
                    });
                }
                
                if (!env.co2 || env.co2 > 1000) {
                    alerts.push({
                        type: 'error',
                        chamber: env.name,
                        message: `CO2 levels critical: ${env.co2 || 'N/A'} PPM`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        return alerts;
    }

    showAlertsPanel(alerts) {
        const panel = document.getElementById('alerts-panel');
        const container = document.getElementById('alerts-container');
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No Active Alerts</h3>
                    <p>All systems operating normally</p>
                </div>
            `;
        } else {
            container.innerHTML = alerts.map(alert => `
                <div class="alert-item ${alert.type}">
                    <div class="alert-icon">
                        <i class="fas fa-${alert.type === 'error' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.chamber}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
        
        panel.style.display = 'block';
    }

    renderSpecies() {
        const speciesGrid = document.getElementById('species-grid');
        if (!speciesGrid) return;

        if (this.species.length === 0) {
            speciesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-leaf"></i>
                    <h3>No Species Available</h3>
                    <p>Species data is loading from the backend...</p>
                </div>
            `;
            return;
        }

        speciesGrid.innerHTML = this.species.map(species => this.createSpeciesCard(species)).join('');
    }

    createSpeciesCard(species) {
        const phaseCount = species.grow_phases ? species.grow_phases.length : 0;
        const difficultyClass = species.difficulty_level || 'beginner';

        return `
            <div class="species-card">
                <div class="species-header">
                    <div>
                        <div class="species-name-card">${species.name}</div>
                        <div class="species-scientific">${species.scientific_name || ''}</div>
                    </div>
                    <div class="difficulty-badge ${difficultyClass}">${species.difficulty_level || 'Beginner'}</div>
                </div>
                <div class="species-phases">${phaseCount} grow phases • ${species.typical_grow_time_days || '--'} days</div>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem; line-height: 1.4;">
                    ${species.description || 'No description available'}
                </p>
            </div>
        `;
    }

    openSpeciesModal(environmentId) {
        this.selectedChamber = this.environments.find(env => env.id === environmentId);
        if (!this.selectedChamber) return;

        const modal = document.getElementById('species-modal');
        const chamberName = document.getElementById('selected-chamber-name');
        const speciesOptions = document.getElementById('species-options');

        if (chamberName) chamberName.textContent = this.selectedChamber.name;

        if (speciesOptions) {
            speciesOptions.innerHTML = this.species.map(species => `
                <div class="species-option" onclick="app.selectSpecies(${species.id})">
                    <div class="species-option-name">${species.name}</div>
                    <div class="species-option-scientific">${species.scientific_name || ''}</div>
                    <div class="species-option-difficulty">${species.difficulty_level || 'Beginner'}</div>
                </div>
            `).join('');
        }

        if (modal) modal.style.display = 'block';
    }

    selectSpecies(speciesId) {
        this.selectedSpecies = this.species.find(s => s.id === speciesId);
        
        // Highlight selected species
        document.querySelectorAll('.species-option').forEach(option => {
            option.classList.remove('selected');
        });
        event.target.closest('.species-option').classList.add('selected');
    }

    async assignSpecies() {
        if (!this.selectedChamber || !this.selectedSpecies) {
            this.showError('Please select a species first');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${this.selectedChamber.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...this.selectedChamber,
                    species_id: this.selectedSpecies.id
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Update local data
            this.selectedChamber.species_id = this.selectedSpecies.id;
            
            // Refresh UI
            this.renderChambers();
            this.closeModal('species-modal');
            this.showSuccess(`${this.selectedSpecies.name} assigned to ${this.selectedChamber.name}`);
        } catch (error) {
            console.error('Error assigning species:', error);
            this.showError('Failed to assign species');
        }
    }

    async simulateSensorData(environmentId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/simulate-sensors`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Refresh data to show updated sensors
            await this.refreshData();
            this.showSuccess('Sensor data updated');
        } catch (error) {
            console.error('Error simulating sensor data:', error);
            this.showError('Failed to update sensor data');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        
        // Reset selections
        this.selectedChamber = null;
        this.selectedSpecies = null;
    }

    showSuccess(message) {
        // Simple success notification (could be enhanced with a proper notification system)
        console.log('Success:', message);
        alert(message); // Replace with better notification system
    }

    showError(message) {
        // Simple error notification (could be enhanced with a proper notification system)
        console.error('Error:', message);
        alert('Error: ' + message); // Replace with better notification system
    }

    async addNewChamber() {
        const name = prompt('Enter chamber name:');
        if (!name) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    is_active: true,
                    temperature: 20.0,
                    humidity: 80.0,
                    co2: 400,
                    airflow: 0.5
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Refresh data to show new chamber
            await this.refreshData();
            this.showSuccess(`Chamber "${name}" created successfully`);
        } catch (error) {
            console.error('Error creating chamber:', error);
            this.showError('Failed to create chamber');
        }
    }

    async addNewSpecies() {
        openModal('add-species-modal');
    }

    async saveNewSpecies() {
        const name = document.getElementById('species-name')?.value;
        const scientificName = document.getElementById('species-scientific-name')?.value;
        const description = document.getElementById('species-description')?.value;
        const difficulty = document.getElementById('species-difficulty')?.value;
        const growTime = document.getElementById('species-grow-time')?.value;

        if (!name) {
            this.showError('Species name is required');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/species/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    scientific_name: scientificName || '',
                    description: description || '',
                    difficulty_level: difficulty || 'beginner',
                    typical_grow_time_days: parseInt(growTime) || 30,
                    grow_phases: [
                        { name: 'inoculation', duration_days: 7, temperature_range: [20, 25], humidity_range: [80, 90] },
                        { name: 'colonization', duration_days: 14, temperature_range: [22, 26], humidity_range: [85, 95] },
                        { name: 'fruiting', duration_days: 10, temperature_range: [18, 22], humidity_range: [90, 95] }
                    ]
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Refresh data and close modal
            await this.refreshData();
            closeModal('add-species-modal');
            this.showSuccess(`Species "${name}" added successfully`);
            
            // Clear form
            document.getElementById('add-species-form')?.reset();
        } catch (error) {
            console.error('Error adding species:', error);
            this.showError('Failed to add species');
        }
    }

    openChamberModal(environmentId) {
        this.selectedChamber = this.environments.find(env => env.id === environmentId);
        if (!this.selectedChamber) return;

        const modal = document.getElementById('chamber-modal');
        const chamberName = document.getElementById('chamber-name');
        const chamberStatus = document.getElementById('chamber-status');
        const sensorData = document.getElementById('sensor-data');

        if (chamberName) chamberName.textContent = this.selectedChamber.name;
        if (chamberStatus) {
            chamberStatus.textContent = this.selectedChamber.is_active ? 'Active' : 'Inactive';
            chamberStatus.className = `status ${this.selectedChamber.is_active ? 'active' : 'inactive'}`;
        }

        // Update sensor data display
        if (sensorData) {
            sensorData.innerHTML = `
                <div class="sensor-row">
                    <span>Temperature:</span>
                    <span>${this.selectedChamber.temperature ? this.selectedChamber.temperature.toFixed(1) + '°C' : 'N/A'}</span>
                </div>
                <div class="sensor-row">
                    <span>Humidity:</span>
                    <span>${this.selectedChamber.humidity ? this.selectedChamber.humidity.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="sensor-row">
                    <span>CO2:</span>
                    <span>${this.selectedChamber.co2 ? this.selectedChamber.co2 + ' PPM' : 'N/A'}</span>
                </div>
                <div class="sensor-row">
                    <span>Airflow:</span>
                    <span>${this.selectedChamber.airflow ? this.selectedChamber.airflow.toFixed(1) + ' m/s' : 'N/A'}</span>
                </div>
            `;
        }

        if (modal) modal.style.display = 'block';
    }

    // Sensor monitoring methods
    showSensorTab(tab) {
        const content = document.getElementById('sensor-content');
        if (!content) return;
        
        // Update tab buttons
        document.querySelectorAll('.sensor-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.sensor-tabs .tab-btn[onclick*="${tab}"]`).classList.add('active');
        
        switch(tab) {
            case 'live':
                content.innerHTML = this.renderLiveSensorData();
                break;
            case 'control':
                content.innerHTML = this.renderDeviceControl();
                break;
            case 'history':
                content.innerHTML = this.renderSensorHistory();
                break;
        }
    }

    renderLiveSensorData() {
        if (this.environments.length === 0) {
            return '<div class="empty-state">No sensor data available</div>';
        }

        return `
            <div class="sensor-controls">
                <div class="auto-refresh-control">
                    <label class="checkbox-label">
                        <input type="checkbox" checked onchange="app.toggleAutoRefresh()">
                        Auto-refresh (30s)
                    </label>
                    <span class="last-update">Last updated: ${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="sensors-grid">
                ${this.environments.map(env => `
                    <div class="sensor-device">
                        <div class="device-header">
                            <h4>${env.name}</h4>
                            <span class="device-status ${env.is_active ? 'active' : 'inactive'}">${env.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div class="sensor-readings">
                            <div class="reading-item">
                                <span class="reading-label">Temperature:</span>
                                <span class="reading-value ${this.getReadingStatus(env.temperature, 18, 25)}">${env.temperature ? env.temperature.toFixed(1) + '°C' : 'N/A'}</span>
                            </div>
                            <div class="reading-item">
                                <span class="reading-label">Humidity:</span>
                                <span class="reading-value ${this.getReadingStatus(env.humidity, 80, 95)}">${env.humidity ? env.humidity.toFixed(1) + '%' : 'N/A'}</span>
                            </div>
                            <div class="reading-item">
                                <span class="reading-label">CO2:</span>
                                <span class="reading-value ${this.getReadingStatus(env.co2, 400, 1000)}">${env.co2 ? env.co2 + ' ppm' : 'N/A'}</span>
                            </div>
                            <div class="reading-item">
                                <span class="reading-label">Airflow:</span>
                                <span class="reading-value">${env.airflow ? env.airflow.toFixed(1) + ' m/s' : 'N/A'}</span>
                            </div>
                            <div class="reading-item">
                                <span class="reading-label">Last Update:</span>
                                <span class="reading-value">${env.last_sensor_update ? new Date(env.last_sensor_update).toLocaleString() : 'Never'}</span>
                            </div>
                        </div>
                        <div class="device-actions">
                            <button class="btn btn-sm btn-primary" onclick="app.viewDeviceDetails(${env.id})">Details</button>
                            <button class="btn btn-sm btn-warning" onclick="app.calibrateDevice(${env.id})">Calibrate</button>
                            <button class="btn btn-sm btn-secondary" onclick="app.simulateSensorData(${env.id})">Update</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDeviceControl() {
        return `
            <div class="device-control">
                <div class="control-form">
                    <h4>Device Control Panel</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Chamber:</label>
                            <select id="control-device" class="form-select">
                                ${this.environments.map(env => `<option value="${env.id}">${env.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Action:</label>
                            <select id="control-action" class="form-select" onchange="app.updateControlForm()">
                                <option value="">Select Action</option>
                                <option value="set_temperature">Set Temperature Target</option>
                                <option value="set_humidity">Set Humidity Target</option>
                                <option value="toggle_fan">Toggle Fan</option>
                                <option value="toggle_heater">Toggle Heater</option>
                                <option value="toggle_humidifier">Toggle Humidifier</option>
                                <option value="calibrate">Calibrate Sensors</option>
                                <option value="restart">Restart Device</option>
                            </select>
                        </div>
                        <div class="form-group" id="control-value-group" style="display: none;">
                            <label id="control-value-label">Value:</label>
                            <input type="text" id="control-value" class="form-input" placeholder="Enter value">
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.sendDeviceCommand()">Send Command</button>
                </div>
                
                <div class="command-history">
                    <h4>Recent Commands</h4>
                    <div id="command-history-list">
                        <div class="empty-state">No recent commands</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSensorHistory() {
        return `
            <div class="sensor-history">
                <div class="history-controls">
                    <h4>Sensor Data History</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Chamber:</label>
                            <select id="history-device" class="form-select">
                                <option value="">All Chambers</option>
                                ${this.environments.map(env => `<option value="${env.id}">${env.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Time Range:</label>
                            <select id="history-range" class="form-select">
                                <option value="1h">Last Hour</option>
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Data Type:</label>
                            <select id="history-type" class="form-select">
                                <option value="all">All Sensors</option>
                                <option value="temperature">Temperature Only</option>
                                <option value="humidity">Humidity Only</option>
                                <option value="co2">CO2 Only</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.loadHistoryData()">Load History</button>
                </div>
                
                <div class="history-chart">
                    <div class="chart-placeholder">
                        <p>Select parameters and click "Load History" to view sensor data trends</p>
                        <div class="chart-mock">
                            <div class="chart-line"></div>
                            <div class="chart-points"></div>
                        </div>
                    </div>
                </div>
                
                <div class="history-table">
                    <h5>Data Points</h5>
                    <div id="history-table-content">
                        <div class="empty-state">No history data loaded</div>
                    </div>
                </div>
            </div>
        `;
    }

    getReadingStatus(value, min, max) {
        if (!value || value < min || value > max) return 'warning';
        return 'normal';
    }

    updateControlForm() {
        const action = document.getElementById('control-action').value;
        const valueGroup = document.getElementById('control-value-group');
        const valueLabel = document.getElementById('control-value-label');
        const valueInput = document.getElementById('control-value');
        
        valueGroup.style.display = 'none';
        
        switch(action) {
            case 'set_temperature':
                valueGroup.style.display = 'block';
                valueLabel.textContent = 'Temperature (°C):';
                valueInput.placeholder = 'e.g., 22';
                break;
            case 'set_humidity':
                valueGroup.style.display = 'block';
                valueLabel.textContent = 'Humidity (%):';
                valueInput.placeholder = 'e.g., 85';
                break;
        }
    }

    async sendDeviceCommand() {
        const deviceId = document.getElementById('control-device').value;
        const action = document.getElementById('control-action').value;
        const value = document.getElementById('control-value').value;
        
        if (!action) {
            this.showError('Please select an action');
            return;
        }
        
        try {
            // Simulate device command (in real implementation, this would call the API)
            console.log(`Sending command: ${action} to device ${deviceId} with value ${value}`);
            
            this.showSuccess(`Command sent successfully: ${action}`);
            
            // Add to command history
            this.addToCommandHistory({ deviceId, action, value, timestamp: new Date().toISOString() });
        } catch (error) {
            console.error('Device control error:', error);
            this.showError('Failed to send command');
        }
    }

    addToCommandHistory(command) {
        const historyList = document.getElementById('command-history-list');
        if (!historyList) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <p><strong>Chamber ${command.deviceId}:</strong> ${command.action} ${command.value || ''}</p>
            <p class="timestamp">${new Date(command.timestamp).toLocaleString()}</p>
        `;
        
        if (historyList.querySelector('.empty-state')) {
            historyList.innerHTML = '';
        }
        
        historyList.insertBefore(historyItem, historyList.firstChild);
    }

    refreshSensorData() {
        this.refreshData().then(() => {
            if (document.querySelector('.sensor-tabs .tab-btn.active')?.textContent.includes('Live')) {
                this.showSensorTab('live');
            }
            this.showSuccess('Sensor data refreshed successfully!');
        });
    }

    calibrateSensors() {
        this.showSuccess('Sensor calibration initiated for all devices');
    }

    exportSensorData() {
        this.showSuccess('Sensor data export functionality - Coming Soon!');
    }

    viewDeviceDetails(deviceId) {
        const device = this.environments.find(env => env.id === deviceId);
        this.showSuccess(`Viewing details for ${device ? device.name : 'Unknown Device'}`);
    }

    calibrateDevice(deviceId) {
        const device = this.environments.find(env => env.id === deviceId);
        this.showSuccess(`Calibrating ${device ? device.name : 'Unknown Device'}`);
    }

    loadHistoryData() {
        const device = document.getElementById('history-device')?.value;
        const range = document.getElementById('history-range')?.value;
        const type = document.getElementById('history-type')?.value;
        
        this.showSuccess(`Loading history: ${device || 'All chambers'}, ${range}, ${type}`);
    }

    toggleSensorSection() {
        const sensorTabs = document.getElementById('sensor-tabs');
        const sensorContent = document.getElementById('sensor-content');
        const toggleBtn = document.getElementById('sensor-toggle');
        
        if (sensorTabs.style.display === 'none') {
            sensorTabs.style.display = 'flex';
            sensorContent.style.display = 'block';
            toggleBtn.textContent = '[-] Collapse';
        } else {
            sensorTabs.style.display = 'none';
            sensorContent.style.display = 'none';
            toggleBtn.textContent = '[+] Expand';
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MushroomCultivationApp();
    app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.stopAutoRefresh();
    }
});

// Global functions for HTML onclick handlers
function refreshData() {
    if (app) {
        app.refreshData();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showAddSpeciesModal() {
    openModal('add-species-modal');
}

function toggleSpeciesLibrary() {
    const speciesGrid = document.getElementById('species-grid');
    const toggleBtn = document.getElementById('species-toggle');
    
    if (speciesGrid.style.display === 'none') {
        speciesGrid.style.display = 'grid';
        toggleBtn.textContent = '[-] Collapse';
    } else {
        speciesGrid.style.display = 'none';
        toggleBtn.textContent = '[+] Expand';
    }
}

function toggleAnalytics() {
    const analyticsGrid = document.getElementById('analyticsGrid');
    const toggleBtn = document.getElementById('analyticsToggle');
    
    if (analyticsGrid.style.display === 'none') {
        analyticsGrid.style.display = 'grid';
        toggleBtn.textContent = '[-] Collapse';
    } else {
        analyticsGrid.style.display = 'none';
        toggleBtn.textContent = '[+] Expand';
    }
}

function showAlertsTab(tab) {
    const content = document.getElementById('alerts-content');
    if (!content) return;
    
    // Update tab buttons
    document.querySelectorAll('.alerts-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    switch(tab) {
        case 'active':
            content.innerHTML = `
                <div class="alerts-list">
                    <div class="alert-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <h4>Temperature Alert</h4>
                            <p>Chamber 1 temperature is above optimal range (25.2°C)</p>
                            <small>2 minutes ago</small>
                        </div>
                    </div>
                    <div class="alert-item info">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <h4>Growth Phase Update</h4>
                            <p>Chamber 2 has entered fruiting phase</p>
                            <small>15 minutes ago</small>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'history':
            content.innerHTML = `
                <div class="alerts-history">
                    <div class="history-filters">
                        <select class="form-select">
                            <option>Last 24 hours</option>
                            <option>Last week</option>
                            <option>Last month</option>
                        </select>
                        <select class="form-select">
                            <option>All types</option>
                            <option>Warnings</option>
                            <option>Errors</option>
                            <option>Info</option>
                        </select>
                    </div>
                    <div class="empty-state">
                        <p>No alert history available</p>
                    </div>
                </div>
            `;
            break;
        case 'channels':
            content.innerHTML = `
                <div class="notification-channels">
                    <div class="channel-item">
                        <h4>Email Notifications</h4>
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Enable email alerts
                        </label>
                        <input type="email" class="form-input" placeholder="admin@mushroom.farm" value="admin@mushroom.farm">
                    </div>
                    <div class="channel-item">
                        <h4>SMS Notifications</h4>
                        <label class="checkbox-label">
                            <input type="checkbox"> Enable SMS alerts
                        </label>
                        <input type="tel" class="form-input" placeholder="+1 (555) 123-4567">
                    </div>
                </div>
            `;
            break;
    }
}

function createAlert() {
    alert('Create Alert functionality - Coming Soon!');
}

// Missing global functions that are referenced in HTML
function showPhaseTab(tab) {
    console.log('Phase tab:', tab);
    // Implementation for phase management tabs
}

function schedulePhaseChange() {
    alert('Schedule Phase Change - Coming Soon!');
}

function recordHarvest() {
    alert('Record Harvest - Coming Soon!');
}

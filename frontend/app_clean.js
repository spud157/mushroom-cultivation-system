// Mushroom Cultivation System - Clean Implementation
const API_BASE_URL = 'http://localhost:8001/api';

class MushroomCultivationApp {
    constructor() {
        this.environments = [];
        this.species = [];
        this.init();
    }

    async init() {
        console.log('Initializing Mushroom Cultivation System...');
        await this.loadData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadData() {
        try {
            // Load environments and species
            const [environmentsResponse, speciesResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/environments/`),
                fetch(`${API_BASE_URL}/species/`)
            ]);

            if (environmentsResponse.ok && speciesResponse.ok) {
                this.environments = await environmentsResponse.json();
                this.species = await speciesResponse.json();
                
                // Load sensor data for each environment
                await this.loadSensorData();
                
                this.renderChambers();
                this.renderSpecies();
            } else {
                console.error('Failed to load data');
                this.showError('Failed to connect to backend');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Connection error');
        }
    }

    async loadSensorData() {
        try {
            for (let env of this.environments) {
                const response = await fetch(`${API_BASE_URL}/environments/${env.id}/sensors/latest`);
                if (response.ok) {
                    env.sensorData = await response.json();
                } else {
                    env.sensorData = [];
                }
            }
        } catch (error) {
            console.error('Error loading sensor data:', error);
        }
    }

    renderChambers() {
        const container = document.getElementById('chambers-grid');
        if (!container) return;

        if (this.environments.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No chambers available. Click "Add Chamber" to create one.</p></div>';
            return;
        }

        container.innerHTML = this.environments.map(env => {
            const species = env.species_id ? this.species.find(s => s.id === env.species_id) : null;
            const statusClass = env.is_active ? 'active' : 'inactive';
            
            // Get sensor readings
            const sensorData = env.sensorData || [];
            const temperature = this.getSensorValue(sensorData, 'temperature', '°C');
            const humidity = this.getSensorValue(sensorData, 'humidity', '%');
            const co2 = this.getSensorValue(sensorData, 'co2', 'PPM');
            const airflow = this.getSensorValue(sensorData, 'airflow', 'm/s');
            
            return `
                <div class="chamber-tile ${statusClass}">
                    <div class="chamber-header">
                        <h3>${env.name}</h3>
                        <span class="status-indicator ${statusClass}">${env.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    
                    <div class="chamber-info">
                        <div class="species-info">
                            <strong>Species:</strong> ${species ? species.name : 'None assigned'}
                            ${species ? `<div class="phase-info">Phase: ${env.current_phase || 'Not started'}</div>` : ''}
                        </div>
                        
                        <div class="environmental-readings">
                            <div class="reading ${this.getSensorStatus(temperature.value, species, 'temperature')}">
                                <span class="label">🌡️ Temperature:</span>
                                <span class="value">${temperature.display}</span>
                            </div>
                            <div class="reading ${this.getSensorStatus(humidity.value, species, 'humidity')}">
                                <span class="label">💧 Humidity:</span>
                                <span class="value">${humidity.display}</span>
                            </div>
                            <div class="reading ${this.getSensorStatus(co2.value, species, 'co2')}">
                                <span class="label">🌬️ CO2:</span>
                                <span class="value">${co2.display}</span>
                            </div>
                            <div class="reading">
                                <span class="label">💨 Airflow:</span>
                                <span class="value">${airflow.display}</span>
                            </div>
                        </div>
                        
                        <div class="sensor-timestamp">
                            Last updated: ${this.getLastSensorUpdate(sensorData)}
                        </div>
                    </div>
                    
                    <div class="chamber-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.simulateSensorData(${env.id})">
                            📊 Update Sensors
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="app.openSpeciesModal(${env.id})">
                            ${species ? 'Change Species' : 'Assign Species'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSpecies() {
        const container = document.getElementById('species-list');
        if (!container) return;

        if (this.species.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No species available</p></div>';
            return;
        }

        container.innerHTML = this.species.map(species => `
            <div class="species-card" data-species-id="${species.id}" onclick="showMushroomDetails(${species.id})">
                <h3>${species.name}</h3>
                <p class="scientific-name">${species.scientific_name || ''}</p>
                <p class="description">${species.description || 'No description available'}</p>
                <div class="species-stats">
                    <div class="stat">
                        <span class="label">Difficulty:</span>
                        <span class="value">${species.difficulty_level || 'Unknown'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Grow Time:</span>
                        <span class="value">${species.typical_grow_time_days ? species.typical_grow_time_days + ' days' : 'Unknown'}</span>
                    </div>
                </div>
                <div class="species-card-hint">Click for details</div>
            </div>
        `).join('');
    }

    getSensorValue(sensorData, type, unit) {
        const sensor = sensorData.find(s => s.sensor_type === type);
        if (sensor) {
            return {
                value: sensor.value,
                display: `${sensor.value}${unit}`,
                timestamp: sensor.timestamp
            };
        }
        return {
            value: null,
            display: `-- ${unit}`,
            timestamp: null
        };
    }

    getSensorStatus(value, species, sensorType) {
        if (!value || !species) return '';
        
        let min, max;
        switch(sensorType) {
            case 'temperature':
                min = species.default_temperature_min;
                max = species.default_temperature_max;
                break;
            case 'humidity':
                min = species.default_humidity_min;
                max = species.default_humidity_max;
                break;
            case 'co2':
                min = species.default_co2_min;
                max = species.default_co2_max;
                break;
            default:
                return '';
        }
        
        if (min && max) {
            if (value < min || value > max) {
                return 'sensor-warning';
            } else {
                return 'sensor-optimal';
            }
        }
        return '';
    }

    getLastSensorUpdate(sensorData) {
        if (!sensorData || sensorData.length === 0) {
            return 'No data';
        }
        
        const latest = sensorData.reduce((latest, current) => {
            return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
        });
        
        const updateTime = new Date(latest.timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
        
        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else {
            const diffHours = Math.floor(diffMinutes / 60);
            return `${diffHours}h ago`;
        }
    }

    async simulateSensorData(environmentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/environments/${environmentId}/sensors/simulate`, {
                method: 'POST'
            });
            if (response.ok) {
                // Reload sensor data for this environment
                const sensorResponse = await fetch(`${API_BASE_URL}/environments/${environmentId}/sensors/latest`);
                if (sensorResponse.ok) {
                    const env = this.environments.find(e => e.id === environmentId);
                    if (env) {
                        env.sensorData = await sensorResponse.json();
                        this.renderChambers(); // Re-render to show new data
                    }
                }
            }
        } catch (error) {
            console.error('Error simulating sensor data:', error);
        }
    }

    openSpeciesModal(environmentId) {
        // Implementation for species assignment modal
        console.log('Opening species modal for environment:', environmentId);
    }

    setupEventListeners() {
        // Add Chamber button
        const addChamberBtn = document.getElementById('addChamberBtn');
        if (addChamberBtn) {
            addChamberBtn.addEventListener('click', showAddChamberModal);
        }

        // Refresh button
        const refreshBtn = document.querySelector('.btn:contains("Refresh")');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }
    }

    startAutoRefresh() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadSensorData().then(() => {
                this.renderChambers();
            });
        }, 30000);
    }

    showError(message) {
        console.error(message);
        // Could show a toast notification here
    }
}

// Global app instance
let app;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new MushroomCultivationApp();
    
    // Add event listener for Add Chamber button
    const addChamberBtn = document.getElementById('addChamberBtn');
    if (addChamberBtn) {
        addChamberBtn.addEventListener('click', showAddChamberModal);
    }
});

// Chamber Creation Functions
function showAddChamberModal() {
    document.getElementById('addChamberModal').style.display = 'block';
}

function closeAddChamberModal() {
    document.getElementById('addChamberModal').style.display = 'none';
    document.getElementById('addChamberForm').reset();
}

async function createChamber() {
    const name = document.getElementById('chamberName').value;
    const location = document.getElementById('chamberLocation').value;
    const description = document.getElementById('chamberDescription').value;
    
    if (!name.trim()) {
        alert('Please enter a chamber name');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/environments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name.trim(),
                location: location.trim() || null,
                description: description.trim() || null
            })
        });
        
        if (response.ok) {
            closeAddChamberModal();
            app.loadData(); // Refresh the data
            alert('Chamber created successfully!');
        } else {
            const error = await response.json();
            alert(`Error creating chamber: ${error.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error creating chamber:', error);
        alert('Error creating chamber. Please try again.');
    }
}

// Mushroom Details Functions
let selectedMushroomForAssignment = null;

function showMushroomDetails(speciesId) {
    const species = app.species.find(s => s.id === speciesId);
    if (!species) return;
    
    selectedMushroomForAssignment = species;
    
    const modal = document.getElementById('mushroomDetailsModal');
    const title = document.getElementById('mushroomDetailsTitle');
    const content = document.getElementById('mushroomDetailsContent');
    
    title.textContent = `🍄 ${species.name}`;
    
    content.innerHTML = `
        <div class="mushroom-detail-section">
            <h3>Basic Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Scientific Name</strong>
                    <span>${species.scientific_name || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <strong>Difficulty Level</strong>
                    <span>${species.difficulty_level || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <strong>Grow Time</strong>
                    <span>${species.typical_grow_time_days ? species.typical_grow_time_days + ' days' : 'Not specified'}</span>
                </div>
            </div>
            <p><strong>Description:</strong> ${species.description || 'No description available.'}</p>
        </div>
        
        <div class="mushroom-detail-section">
            <h3>Environmental Requirements</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Temperature</strong>
                    <span>${species.default_temperature_min || 'N/A'}°C - ${species.default_temperature_max || 'N/A'}°C</span>
                </div>
                <div class="detail-item">
                    <strong>Humidity</strong>
                    <span>${species.default_humidity_min || 'N/A'}% - ${species.default_humidity_max || 'N/A'}%</span>
                </div>
                <div class="detail-item">
                    <strong>CO2</strong>
                    <span>${species.default_co2_min || 'N/A'} - ${species.default_co2_max || 'N/A'} PPM</span>
                </div>
                <div class="detail-item">
                    <strong>Fresh Air Exchange</strong>
                    <span>${species.default_fae_cycles_per_day || 'N/A'} cycles/day</span>
                </div>
                <div class="detail-item">
                    <strong>Light</strong>
                    <span>${species.default_light_hours_per_day || 'N/A'} hours/day</span>
                </div>
            </div>
        </div>
        
        ${species.grow_phases && species.grow_phases.length > 0 ? `
        <div class="mushroom-detail-section">
            <h3>Growth Phases</h3>
            ${species.grow_phases.map(phase => `
                <div class="phase-card">
                    <h4>${phase.name} (${phase.duration_days} days)</h4>
                    <p>${phase.description || 'No description'}</p>
                    <div class="phase-requirements">
                        <div><strong>Temp:</strong> ${phase.temperature_min || 'N/A'}°C - ${phase.temperature_max || 'N/A'}°C</div>
                        <div><strong>Humidity:</strong> ${phase.humidity_min || 'N/A'}% - ${phase.humidity_max || 'N/A'}%</div>
                        <div><strong>CO2:</strong> ${phase.co2_min || 'N/A'} - ${phase.co2_max || 'N/A'} PPM</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${species.notes ? `
        <div class="mushroom-detail-section">
            <h3>Notes</h3>
            <p>${species.notes}</p>
        </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
}

function closeMushroomDetailsModal() {
    document.getElementById('mushroomDetailsModal').style.display = 'none';
    selectedMushroomForAssignment = null;
}

function assignFromDetails() {
    if (!selectedMushroomForAssignment) return;
    
    const availableChambers = app.environments.filter(env => !env.species_id);
    
    if (availableChambers.length === 0) {
        alert('No available chambers. Please create a chamber first or unassign a species from an existing chamber.');
        return;
    }
    
    const chamberList = availableChambers.map(c => c.name).join(', ');
    alert(`Available chambers: ${chamberList}\n\nPlease use the chamber tiles to assign this species.`);
    closeMushroomDetailsModal();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const addChamberModal = document.getElementById('addChamberModal');
    const mushroomModal = document.getElementById('mushroomDetailsModal');
    
    if (event.target === addChamberModal) {
        closeAddChamberModal();
    }
    if (event.target === mushroomModal) {
        closeMushroomDetailsModal();
    }
});

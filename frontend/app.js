// Mushroom Cultivation System Frontend
class MushroomCultivationApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.environments = [];
        this.species = [];
        this.selectedChamber = null;
        this.selectedSpecies = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Mushroom Cultivation System...');
        await this.loadData();
        this.setupEventListeners();
        this.startDataRefresh();
    }

    async loadData() {
        try {
            // Load environments and species in parallel
            const [environmentsResponse, speciesResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/environments/`),
                fetch(`${this.apiBaseUrl}/species/`)
            ]);

            if (environmentsResponse.ok && speciesResponse.ok) {
                this.environments = await environmentsResponse.json();
                this.species = await speciesResponse.json();
                
                // Load sensor data for each environment
                await this.loadSensorData();
                
                this.renderChambers();
                this.renderSpecies();
                this.updateSystemStatus();
            } else {
                console.error('Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadSensorData() {
        try {
            // Load latest sensor readings for all environments
            for (let env of this.environments) {
                const response = await fetch(`${this.apiBaseUrl}/environments/${env.id}/sensors/latest`);
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

    async simulateSensorData(environmentId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/sensors/simulate`, {
                method: 'POST'
            });
            if (response.ok) {
                // Reload sensor data for this environment
                const sensorResponse = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/sensors/latest`);
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

    async loadEnvironments() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/`);
            if (!response.ok) throw new Error('Failed to load environments');
            this.environments = await response.json();
        } catch (error) {
            console.error('Error loading environments:', error);
            // Create default environments if none exist
            this.environments = this.createDefaultEnvironments();
        }
    }

    async loadSpecies() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/species/`);
            if (!response.ok) throw new Error('Failed to load species');
            this.species = await response.json();
        } catch (error) {
            console.error('Error loading species:', error);
            this.species = [];
        }
    }

    createDefaultEnvironments() {
        return [
            { id: 1, name: 'Environment 1', status: 'idle', species_id: null, current_temperature: null, current_humidity: null, current_co2: null },
            { id: 2, name: 'Environment 2', status: 'idle', species_id: null, current_temperature: null, current_humidity: null, current_co2: null },
            { id: 3, name: 'Environment 3', status: 'idle', species_id: null, current_temperature: null, current_humidity: null, current_co2: null },
            { id: 4, name: 'Environment 4', status: 'idle', species_id: null, current_temperature: null, current_humidity: null, current_co2: null }
        ];
    }

    renderChambers() {
        const chambersGrid = document.getElementById('chambers-grid');
        if (!chambersGrid) return;

        if (this.environments.length === 0) {
            chambersGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-home"></i>
                    <h3>No Chambers Available</h3>
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
                <div class="chamber-tile ${statusClass}" onclick="app.openChamberDetails(${env.id})">
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
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.simulateSensorData(${env.id})">
                            📊 Update Sensors
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.openSpeciesModal(${env.id})">
                            ${species ? 'Change Species' : 'Assign Species'}
                        </button>
                    </div>
                </div>
            </div>
        `;
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

    updateSystemStatus() {
        const backendStatus = document.getElementById('backend-status');
        const databaseStatus = document.getElementById('database-status');
        const activeChambers = document.getElementById('active-chambers');

        if (backendStatus) backendStatus.textContent = 'Connected';
        if (databaseStatus) databaseStatus.textContent = 'Online';
        if (activeChambers) {
            const activeCount = this.environments.filter(env => env.species_id).length;
            activeChambers.textContent = activeCount.toString();
        }
    }

    setupEventListeners() {
        // Modal close events
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.closeModal(event.target.id);
            }
        });
    }

    startDataRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    async refreshData() {
        try {
            await this.loadEnvironments();
            this.renderChambers();
            this.updateSystemStatus();
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
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
                <div class="species-option" onclick="selectSpecies(${species.id})">
                    <div class="species-option-name">${species.name}</div>
                    <div class="species-option-difficulty">${species.difficulty_level || 'Beginner'}</div>
                </div>
            `).join('');
        }

        modal.style.display = 'block';
    }

    selectSpecies(speciesId) {
        this.selectedSpecies = this.species.find(s => s.id === speciesId);
        
        // Update UI to show selection
        document.querySelectorAll('.species-option').forEach(option => {
            option.classList.remove('selected');
        });
        event.target.closest('.species-option').classList.add('selected');

        // Populate phase options
        const phaseSelect = document.getElementById('phase-select');
        if (phaseSelect && this.selectedSpecies.grow_phases) {
            phaseSelect.innerHTML = '<option value="">Select Phase</option>' +
                this.selectedSpecies.grow_phases.map(phase => 
                    `<option value="${phase.name}">${phase.name}</option>`
                ).join('');
        }
    }

    async assignSpecies() {
        if (!this.selectedChamber || !this.selectedSpecies) {
            this.showError('Please select a species and phase');
            return;
        }

        const phaseSelect = document.getElementById('phase-select');
        const selectedPhase = phaseSelect ? phaseSelect.value : '';

        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${this.selectedChamber.id}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    species_id: this.selectedSpecies.id,
                    phase_name: selectedPhase || undefined
                })
            });

            if (!response.ok) throw new Error('Failed to assign species');

            this.closeModal('species-modal');
            await this.refreshData();
            this.showSuccess(`${this.selectedSpecies.name} assigned to ${this.selectedChamber.name}`);
        } catch (error) {
            console.error('Error assigning species:', error);
            this.showError('Failed to assign species. Please try again.');
        }
    }

    openChamberDetails(environmentId) {
        const environment = this.environments.find(env => env.id === environmentId);
        if (!environment) return;

        // If no species assigned, open assignment modal instead
        if (!environment.species_id) {
            this.openSpeciesModal(environmentId);
            return;
        }

        this.selectedChamber = environment;
        const modal = document.getElementById('chamber-modal');
        const title = document.getElementById('chamber-modal-title');

        if (title) title.textContent = `${environment.name} Details`;

        // Update readings
        this.updateChamberReadings(environment);
        
        // Update actuator states
        this.updateActuatorStates(environment);

        modal.style.display = 'block';
    }

    updateChamberReadings(environment) {
        const readings = {
            'chamber-temperature': environment.current_temperature ? `${environment.current_temperature.toFixed(1)}°C` : '--°C',
            'chamber-humidity': environment.current_humidity ? `${environment.current_humidity.toFixed(1)}%` : '--%',
            'chamber-co2': environment.current_co2 ? `${environment.current_co2.toFixed(0)} ppm` : '-- ppm',
            'chamber-light': environment.current_light_level ? `${environment.current_light_level.toFixed(0)} lux` : '-- lux'
        };

        Object.entries(readings).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateActuatorStates(environment) {
        const actuators = {
            'fan-toggle': environment.fan_state,
            'humidifier-toggle': environment.humidifier_state,
            'heat-mat-toggle': environment.heat_mat_state,
            'co2-valve-toggle': environment.co2_valve_state,
            'light-toggle': environment.light_state
        };

        Object.entries(actuators).forEach(([id, state]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = state ? 'ON' : 'OFF';
                element.className = `btn-toggle ${state ? 'on' : 'off'}`;
            }
        });
    }

    async toggleActuator(actuatorType) {
        if (!this.selectedChamber) return;

        try {
            // This would typically call the backend API to toggle the actuator
            // For now, we'll simulate the toggle
            const currentState = this.selectedChamber[`${actuatorType}_state`];
            
            // Simulate API call
            console.log(`Toggling ${actuatorType} for ${this.selectedChamber.name}: ${!currentState}`);
            
            // Update local state (in real implementation, this would come from the API response)
            this.selectedChamber[`${actuatorType}_state`] = !currentState;
            
            // Update UI
            this.updateActuatorStates(this.selectedChamber);
            
            this.showSuccess(`${actuatorType.replace('_', ' ')} ${!currentState ? 'activated' : 'deactivated'}`);
        } catch (error) {
            console.error(`Error toggling ${actuatorType}:`, error);
            this.showError(`Failed to toggle ${actuatorType}`);
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
                    description: `Grow chamber: ${name}`,
                    status: 'idle'
                })
            });

            if (!response.ok) throw new Error('Failed to create chamber');

            await this.refreshData();
            this.showSuccess(`Chamber "${name}" created successfully`);
        } catch (error) {
            console.error('Error creating chamber:', error);
            this.showError('Failed to create chamber. Please try again.');
        }
    }
}

// Global functions for HTML onclick events
let app;

function refreshData() {
    if (app) app.refreshData();
}

function showSettings() {
    alert('Settings panel coming soon!');
}

function openSpeciesModal(environmentId) {
    if (app) app.openSpeciesModal(environmentId);
}

function selectSpecies(speciesId) {
    if (app) app.selectSpecies(speciesId);
}

function assignSpecies() {
    if (app) app.assignSpecies();
}

function openChamberDetails(environmentId) {
    if (app) app.openChamberDetails(environmentId);
}

function toggleActuator(actuatorType) {
    if (app) app.toggleActuator(actuatorType);
}

function closeModal(modalId) {
    if (app) app.closeModal(modalId);
}

function addNewChamber() {
    if (app) app.addNewChamber();
}

function showSpeciesManager() {
    alert('Species manager coming soon!');
}

function changePhase() {
    alert('Phase change functionality coming soon!');
}

function unassignSpecies() {
    if (app && app.selectedChamber) {
        if (confirm(`Unassign species from ${app.selectedChamber.name}?`)) {
            // Implement unassign functionality
            alert('Unassign functionality coming soon!');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new MushroomCultivationApp();
    
    // Add event listener for Add Chamber button
    document.getElementById('addChamberBtn').addEventListener('click', showAddChamberModal);
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
    
    title.textContent = ` ${species.name}`;
    
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
    
    // Show chamber selection for assignment
    const availableChambers = app.environments.filter(env => !env.species_id);
    
    if (availableChambers.length === 0) {
        alert('No available chambers. Please create a chamber first or unassign a species from an existing chamber.');
        return;
    }
    
    const chamberOptions = availableChambers.map(chamber => 
        `<option value="${chamber.id}">${chamber.name}</option>`
    ).join('');
    
    const chamberSelect = `
        <select id="assignChamberSelect" style="width: 100%; padding: 10px; margin: 10px 0;">
            <option value="">Select a chamber...</option>
            ${chamberOptions}
        </select>
    `;
    
    const result = confirm(`Assign ${selectedMushroomForAssignment.name} to a chamber?`);
    if (result) {
        // For now, just show available chambers in an alert
        const chamberList = availableChambers.map(c => c.name).join(', ');
        alert(`Available chambers: ${chamberList}\n\nPlease use the chamber tiles to assign this species.`);
        closeMushroomDetailsModal();
    }
}

// Make species cards clickable
function makeSpeciesCardsClickable() {
    const speciesCards = document.querySelectorAll('.species-card');
    speciesCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const speciesId = parseInt(this.dataset.speciesId);
            if (speciesId) {
                showMushroomDetails(speciesId);
            }
        });
    });
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

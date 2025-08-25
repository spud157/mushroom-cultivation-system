// Simple, working mushroom cultivation app
// Connect to the simple server running on port 8001
const API_BASE_URL = 'http://127.0.0.1:8001/api';

// Global variables
let environments = [];
let species = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing simple mushroom app...');
    loadAllData();
    
    // Add event listeners - Note: addChamberBtn was removed from header
    // The Add Chamber button is now only in the Grow Chambers section
});

// Load all data from API
async function loadAllData() {
    console.log('Loading data from API...');
    
    try {
        // Test basic connectivity first
        console.log('Testing API connectivity...');
        console.log('API Base URL:', API_BASE_URL);
        
        // Try different fetch configurations to bypass browser restrictions
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            cache: 'no-cache'
        };
        
        // Load species first with detailed error handling
        console.log('Fetching species from:', `${API_BASE_URL}/species/`);
        const speciesResponse = await fetch(`${API_BASE_URL}/species/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        console.log('Species response received');
        console.log('Species response status:', speciesResponse.status);
        console.log('Species response ok:', speciesResponse.ok);
        
        if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json();
            console.log('Species data parsed successfully');
            console.log('Species data:', speciesData);
            species = speciesData;
            console.log('Loaded species count:', species.length);
            renderSpecies();
        } else {
            console.error('Failed to load species. Status:', speciesResponse.status);
            console.error('Response text:', await speciesResponse.text());
            showError(`Failed to load species. Server returned status: ${speciesResponse.status}`);
        }
        
        // Load environments with detailed error handling
        console.log('Fetching environments from:', `${API_BASE_URL}/environments/`);
        const environmentsResponse = await fetch(`${API_BASE_URL}/environments/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        console.log('Environments response received');
        console.log('Environments response status:', environmentsResponse.status);
        console.log('Environments response ok:', environmentsResponse.ok);
        
        if (environmentsResponse.ok) {
            const environmentsData = await environmentsResponse.json();
            console.log('Environments data parsed successfully');
            console.log('Environments data:', environmentsData);
            environments = environmentsData;
            console.log('Loaded environments count:', environments.length);
            renderChambers();
        } else {
            console.error('Failed to load environments. Status:', environmentsResponse.status);
            console.error('Response text:', await environmentsResponse.text());
            showError(`Failed to load environments. Server returned status: ${environmentsResponse.status}`);
        }
        
    } catch (error) {
        console.error('Detailed error information:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Network error: Cannot connect to backend server. Please check if the server is running on port 8001.');
        } else if (error.name === 'SyntaxError') {
            showError('Data parsing error: Server returned invalid JSON.');
        } else {
            showError(`Connection error: ${error.message}`);
        }
    }
}

// Render species library
function renderSpecies() {
    console.log('Rendering species...');
    const container = document.getElementById('species-grid');
    if (!container) {
        console.error('Species container not found!');
        return;
    }

    if (species.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No species available</p></div>';
        return;
    }

    container.innerHTML = species.map(s => `
        <div class="species-card">
            <h3>${s.name}</h3>
            <p class="scientific-name">${s.scientific_name || ''}</p>
            <p class="description">${(s.description || 'No description available').substring(0, 100)}...</p>
            <div class="species-stats">
                <div class="stat">
                    <span class="label">Difficulty:</span>
                    <span class="value">${s.difficulty_level || 'Unknown'}</span>
                </div>
                <div class="stat">
                    <span class="label">Grow Time:</span>
                    <span class="value">${s.typical_grow_time_days ? s.typical_grow_time_days + ' days' : 'Unknown'}</span>
                </div>
            </div>
            <div class="species-card-actions">
                <button class="btn btn-sm btn-secondary" onclick="showMushroomDetails(${s.id})">
                    View Details
                </button>
                <button class="btn btn-sm btn-primary" onclick="assignSpeciesToChamber(${s.id})">
                    Assign to Chamber
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('Species rendered successfully');
}

// Get list of removed chamber IDs from localStorage
function getRemovedChambers() {
    const removed = localStorage.getItem('removedChambers');
    return removed ? JSON.parse(removed) : [];
}

// Add chamber ID to removed list
function markChamberAsRemoved(environmentId) {
    const removed = getRemovedChambers();
    if (!removed.includes(environmentId)) {
        removed.push(environmentId);
        localStorage.setItem('removedChambers', JSON.stringify(removed));
    }
}

// Render chambers (excluding removed ones)
function renderChambers() {
    console.log('Rendering chambers...');
    const container = document.getElementById('chambers-grid');
    if (!container) return;
    
    // Filter out removed chambers
    const removedIds = getRemovedChambers();
    const visibleEnvironments = environments.filter(env => !removedIds.includes(env.id));
    console.log('Filtered out removed chambers:', removedIds);
    console.log('Visible chambers:', visibleEnvironments.length);
    
    if (visibleEnvironments.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No chambers available. Use the "Add Chamber" button above to create your first grow chamber.</p></div>';
        return;
    }

    container.innerHTML = visibleEnvironments.map(env => {
        const assignedSpecies = species.find(s => s.id === env.species_id);
        const statusClass = env.is_active ? 'active' : 'inactive';
        
        return `
            <div class="chamber-tile ${statusClass}">
                <div class="chamber-header">
                    <h3>${env.name}</h3>
                    <span class="status-indicator ${statusClass}">${env.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                
                <div class="chamber-info">
                    <div class="species-info">
                        <strong>Species:</strong> ${assignedSpecies ? assignedSpecies.name : 'None assigned'}
                    </div>
                    
                    <div class="environmental-readings">
                        <div class="reading">
                            <span class="label">Temperature:</span>
                            <span class="value">${env.temperature}°C</span>
                        </div>
                        <div class="reading">
                            <span class="label">Humidity:</span>
                            <span class="value">${env.humidity}%</span>
                        </div>
                        <div class="reading">
                            <span class="label">CO2:</span>
                            <span class="value">${env.co2} PPM</span>
                        </div>
                        <div class="reading">
                            <span class="label">Airflow:</span>
                            <span class="value">${env.airflow} m/s</span>
                        </div>
                    </div>
                </div>
                
                <div class="chamber-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.simulateSensorData(${env.id})">
                        Update Sensors
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.markChamberAsRemoved(${env.id}); this.closest('.chamber-tile').remove(); alert('Chamber permanently removed!')" title="Remove this chamber">
                        Remove Chamber
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Chambers rendered successfully');
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    const container = document.getElementById('species-grid') || document.getElementById('chambers-grid');
    if (container) {
        container.innerHTML = `<div class="error-state"><p style="color: red;">${message}</p></div>`;
    }
}

// Chamber creation functions
function showAddChamberModal() {
    const modal = document.getElementById('addChamberModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Fix for HTML button that calls addNewChamber
function addNewChamber() {
    showAddChamberModal();
}

// Species assignment to chamber
function assignSpeciesToChamber(speciesId) {
    const selectedSpecies = species.find(s => s.id === speciesId);
    if (!selectedSpecies) {
        alert('Species not found!');
        return;
    }
    
    if (environments.length === 0) {
        alert('Please create a chamber first before assigning species!');
        return;
    }
    
    // Show chamber selection modal
    showChamberSelectionModal(selectedSpecies);
}

function showChamberSelectionModal(selectedSpecies) {
    // Filter out deleted chambers (same logic as renderChambers)
    const removedIds = getRemovedChambers();
    const availableChambers = environments.filter(env => !removedIds.includes(env.id));
    
    // Check if there are any available chambers
    if (availableChambers.length === 0) {
        alert('No chambers available for species assignment. Please create a chamber first.');
        return;
    }
    
    const modalHtml = `
        <div id="chamberSelectionModal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Assign ${selectedSpecies.name} to Chamber</h3>
                    <span class="close" onclick="closeChamberSelectionModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Select a chamber to assign <strong>${selectedSpecies.name}</strong>:</p>
                    <div class="chamber-selection">
                        ${availableChambers.map(env => {
                            const currentSpecies = env.species_id ? species.find(s => s.id === env.species_id) : null;
                            return `
                                <button class="chamber-option-btn" onclick="confirmSpeciesAssignment(${selectedSpecies.id}, ${env.id})">
                                    <div class="chamber-option-content">
                                        <h4>🏠 ${env.name}</h4>
                                        <p><strong>Location:</strong> ${env.location || 'Not specified'}</p>
                                        <p><strong>Current Species:</strong> ${currentSpecies ? currentSpecies.name : 'None assigned'}</p>
                                        ${currentSpecies ? '<p class="warning">⚠️ This will replace the current species</p>' : '<p class="available">✅ Available for assignment</p>'}
                                    </div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('chamberSelectionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeChamberSelectionModal() {
    const modal = document.getElementById('chamberSelectionModal');
    if (modal) {
        modal.remove();
    }
}

// 🍄 AUTOMATIC ENVIRONMENTAL PARAMETER UPDATE SYSTEM
// This function configures chamber parameters based on mushroom species requirements
function updateChamberEnvironmentalParameters(environment, selectedSpecies) {
    console.log('🚀 Configuring optimal environmental parameters...');
    
    // Calculate optimal values from species requirements (using mid-range values)
    const optimalTemperature = Math.round((selectedSpecies.default_temperature_min + selectedSpecies.default_temperature_max) / 2);
    const optimalHumidity = Math.round((selectedSpecies.default_humidity_min + selectedSpecies.default_humidity_max) / 2);
    const optimalCO2 = Math.round((selectedSpecies.default_co2_min + selectedSpecies.default_co2_max) / 2);
    
    // Calculate airflow based on FAE (Fresh Air Exchange) cycles
    // More FAE cycles = higher airflow for better air circulation
    const baseAirflow = 0.1; // Base airflow in m/s
    const optimalAirflow = (baseAirflow + (selectedSpecies.default_fae_cycles_per_day * 0.05)).toFixed(1);
    
    // Update chamber environmental parameters
    environment.temperature = optimalTemperature;
    environment.humidity = optimalHumidity;
    environment.co2 = optimalCO2;
    environment.airflow = parseFloat(optimalAirflow);
    
    // Store species-specific parameters for reference
    environment.target_temperature_min = selectedSpecies.default_temperature_min;
    environment.target_temperature_max = selectedSpecies.default_temperature_max;
    environment.target_humidity_min = selectedSpecies.default_humidity_min;
    environment.target_humidity_max = selectedSpecies.default_humidity_max;
    environment.target_co2_min = selectedSpecies.default_co2_min;
    environment.target_co2_max = selectedSpecies.default_co2_max;
    environment.fae_cycles_per_day = selectedSpecies.default_fae_cycles_per_day;
    environment.light_hours_per_day = selectedSpecies.default_light_hours_per_day;
    
    console.log('✅ Environmental parameters configured:');
    console.log(`  🌡️ Temperature: ${optimalTemperature}°C (range: ${selectedSpecies.default_temperature_min}-${selectedSpecies.default_temperature_max}°C)`);
    console.log(`  💧 Humidity: ${optimalHumidity}% (range: ${selectedSpecies.default_humidity_min}-${selectedSpecies.default_humidity_max}%)`);
    console.log(`  🌬️ CO2: ${optimalCO2} PPM (range: ${selectedSpecies.default_co2_min}-${selectedSpecies.default_co2_max} PPM)`);
    console.log(`  🌪️ Airflow: ${optimalAirflow} m/s (${selectedSpecies.default_fae_cycles_per_day} FAE cycles/day)`);
    console.log(`  💡 Light: ${selectedSpecies.default_light_hours_per_day} hours/day`);
}

async function confirmSpeciesAssignment(speciesId, environmentId) {
    try {
        // Update the environment with the selected species
        const environment = environments.find(env => env.id === environmentId);
        const selectedSpecies = species.find(s => s.id === speciesId);
        
        if (environment && selectedSpecies) {
            console.log('🍄 Assigning species to chamber and updating environmental parameters...');
            console.log('Species:', selectedSpecies.name);
            console.log('Chamber:', environment.name);
            
            // 🚀 AUTOMATIC PARAMETER UPDATE: Configure chamber for optimal mushroom growth
            updateChamberEnvironmentalParameters(environment, selectedSpecies);
            
            // 💾 SAVE TO BACKEND: Persist species assignment and environmental parameters
            try {
                console.log('💾 Saving species assignment to backend...');
                const response = await fetch(`${API_BASE_URL}/environments/${environmentId}/assign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        species_id: speciesId,
                        temperature: environment.temperature,
                        humidity: environment.humidity,
                        co2: environment.co2,
                        airflow: environment.airflow,
                        target_temperature_min: environment.target_temperature_min,
                        target_temperature_max: environment.target_temperature_max,
                        target_humidity_min: environment.target_humidity_min,
                        target_humidity_max: environment.target_humidity_max,
                        target_co2_min: environment.target_co2_min,
                        target_co2_max: environment.target_co2_max,
                        fae_cycles_per_day: environment.fae_cycles_per_day,
                        light_hours_per_day: environment.light_hours_per_day
                    })
                });
                
                if (response.ok) {
                    console.log('✅ Species assignment saved to backend successfully');
                    
                    // Update local data with species assignment
                    environment.species_id = speciesId;
                    
                    // Close modal
                    closeChamberSelectionModal();
                    
                    // Refresh the chambers display to show updated parameters
                    renderChambers();
                    
                    // Show success message with parameter details
                    const tempRange = `${selectedSpecies.default_temperature_min}-${selectedSpecies.default_temperature_max}°C`;
                    const humidityRange = `${selectedSpecies.default_humidity_min}-${selectedSpecies.default_humidity_max}%`;
                    const co2Range = `${selectedSpecies.default_co2_min}-${selectedSpecies.default_co2_max} PPM`;
                    
                    alert(`✅ Successfully assigned ${selectedSpecies.name} to ${environment.name}!\n\n🌡️ Temperature: ${tempRange}\n💧 Humidity: ${humidityRange}\n🌬️ CO2: ${co2Range}\n\nChamber parameters have been automatically optimized and saved for ${selectedSpecies.name} cultivation!`);
                } else {
                    console.error('❌ Failed to save species assignment to backend');
                    alert('Warning: Species assigned locally but could not save to database. Assignment may not persist after refresh.');
                    
                    // Still update local data and UI even if backend save fails
                    environment.species_id = speciesId;
                    closeChamberSelectionModal();
                    renderChambers();
                }
            } catch (backendError) {
                console.error('❌ Network error saving to backend:', backendError);
                alert('Warning: Network error saving assignment. Species assigned locally but may not persist after refresh.');
                
                // Still update local data and UI even if backend save fails
                environment.species_id = speciesId;
                closeChamberSelectionModal();
                renderChambers();
            }
        }
    } catch (error) {
        console.error('❌ Error assigning species to chamber:', error);
        alert('Error assigning species to chamber. Please try again.');
    }
}

function closeAddChamberModal() {
    const modal = document.getElementById('addChamberModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('addChamberForm');
    if (form) {
        form.reset();
    }
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
            const newChamber = await response.json();
            console.log('New chamber created:', newChamber);
            
            // Add the new chamber to the local environments array (don't reload all data)
            environments.push(newChamber);
            
            // Re-render only the chambers section
            renderChambers();
            
            closeAddChamberModal();
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

// Mushroom details functions
function showMushroomDetails(speciesId) {
    const selectedSpecies = species.find(s => s.id === speciesId);
    if (!selectedSpecies) return;
    
    const modal = document.getElementById('mushroomDetailsModal');
    const title = document.getElementById('mushroomDetailsTitle');
    const content = document.getElementById('mushroomDetailsContent');
    
    if (title) title.textContent = `🍄 ${selectedSpecies.name}`;
    
    if (content) {
        content.innerHTML = `
            <div class="mushroom-detail-section">
                <h3>Basic Information</h3>
                <p><strong>Scientific Name:</strong> ${selectedSpecies.scientific_name || 'Not specified'}</p>
                <p><strong>Difficulty Level:</strong> ${selectedSpecies.difficulty_level || 'Not specified'}</p>
                <p><strong>Grow Time:</strong> ${selectedSpecies.typical_grow_time_days ? selectedSpecies.typical_grow_time_days + ' days' : 'Not specified'}</p>
                <p><strong>Description:</strong> ${selectedSpecies.description || 'No description available.'}</p>
            </div>
            
            <div class="mushroom-detail-section">
                <h3>Environmental Requirements</h3>
                <p><strong>Temperature:</strong> ${selectedSpecies.default_temperature_min || 'N/A'}°C - ${selectedSpecies.default_temperature_max || 'N/A'}°C</p>
                <p><strong>Humidity:</strong> ${selectedSpecies.default_humidity_min || 'N/A'}% - ${selectedSpecies.default_humidity_max || 'N/A'}%</p>
                <p><strong>CO2:</strong> ${selectedSpecies.default_co2_min || 'N/A'} - ${selectedSpecies.default_co2_max || 'N/A'} PPM</p>
                <p><strong>Fresh Air Exchange:</strong> ${selectedSpecies.default_fae_cycles_per_day || 'N/A'} cycles/day</p>
                <p><strong>Light:</strong> ${selectedSpecies.default_light_hours_per_day || 'N/A'} hours/day</p>
            </div>
        `;
    }
    
    if (modal) modal.style.display = 'block';
}

function closeMushroomDetailsModal() {
    const modal = document.getElementById('mushroomDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Sensor simulation
async function simulateSensorData(environmentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sensors/environments/${environmentId}/sensors/simulate`, {
            method: 'POST'
        });
        if (response.ok) {
            console.log('Sensor data simulated for environment:', environmentId);
            // Could reload sensor data here
        }
    } catch (error) {
        console.error('Error simulating sensor data:', error);
    }
}

// Remove chamber function - Delete from both frontend and backend
async function removeChamber(environmentId) {
    console.log('🗑️ Removing chamber ID:', environmentId);
    
    const environment = environments.find(env => env.id == environmentId);
    if (!environment) {
        console.error('Chamber not found! ID:', environmentId);
        alert('Chamber not found!');
        return;
    }
    
    console.log('Found environment to remove:', environment);
    
    const assignedSpecies = environment.species_id ? species.find(s => s.id === environment.species_id) : null;
    const speciesWarning = assignedSpecies ? `\n\nThis chamber currently has ${assignedSpecies.name} assigned to it.` : '';
    
    const confirmMessage = `Are you sure you want to remove "${environment.name}"?${speciesWarning}\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            // 1. Delete from backend database first
            console.log('🌐 Deleting from backend API...');
            const response = await fetch(`${API_BASE_URL}/environments/${environmentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log('✅ Successfully deleted from backend');
                
                // 2. Remove from local environments array
                const index = environments.findIndex(env => env.id == environmentId);
                if (index !== -1) {
                    const removedChamber = environments.splice(index, 1)[0];
                    console.log('✅ Removed from local array:', removedChamber.name);
                    
                    // 3. Re-render chambers to show the updated list
                    renderChambers();
                    
                    alert(`Chamber "${removedChamber.name}" has been permanently removed!`);
                } else {
                    console.error('❌ Could not find chamber in local array');
                }
            } else {
                console.error('❌ Failed to delete from backend. Status:', response.status);
                alert('Error: Could not delete chamber from database. Please try again.');
            }
        } catch (error) {
            console.error('❌ Network error deleting chamber:', error);
            alert('Network error: Could not delete chamber. Please check your connection and try again.');
        }
    }
}

// Remove Chamber - Delete from both frontend and backend
function removeChamber(environmentId) {
    console.log('🗑️ Removing chamber ID:', environmentId);
    
    // Find the chamber
    const environment = environments.find(env => env.id == environmentId);
    if (!environment) {
        alert('Chamber not found!');
        return;
    }
    
    if (confirm(`Remove chamber "${environment.name}"?`)) {
        // 1. Remove from frontend array immediately
        const index = environments.findIndex(env => env.id == environmentId);
        if (index !== -1) {
            environments.splice(index, 1);
            console.log('✅ Removed from frontend array');
        }
        
        // 2. Hide the DOM element immediately
        const allTiles = document.querySelectorAll('.chamber-tile');
        for (let i = 0; i < allTiles.length; i++) {
            const tile = allTiles[i];
            const button = tile.querySelector('button[onclick*="removeChamber(' + environmentId + ')"]');
            if (button) {
                tile.style.display = 'none';
                setTimeout(() => tile.remove(), 100);
                console.log('✅ Hidden DOM element');
                break;
            }
        }
        
        // 3. Delete from backend API (this is the key fix!)
        fetch(`${API_BASE_URL}/environments/${environmentId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Deleted from backend API');
                alert(`Chamber "${environment.name}" permanently removed!`);
            } else {
                console.error('❌ Failed to delete from backend');
                alert('Warning: Chamber removed from display but may reappear on refresh');
            }
        })
        .catch(error => {
            console.error('❌ API delete error:', error);
            alert('Warning: Chamber removed from display but may reappear on refresh');
        });
        
        // 4. Re-render to update the display
        renderChambers();
    }
}

// Toggle species library visibility
function toggleSpeciesLibrary() {
    const speciesGrid = document.getElementById('species-grid');
    const toggleButton = document.getElementById('species-toggle');
    
    if (speciesGrid.style.display === 'none') {
        speciesGrid.style.display = 'grid';
        toggleButton.textContent = '[-] Collapse';
    } else {
        speciesGrid.style.display = 'none';
        toggleButton.textContent = '[+] Expand';
    }
}

// Analytics Dashboard Functions
function updateAnalytics() {
    // Update total chambers count
    const totalChambers = environments.length;
    document.getElementById('totalChambers').textContent = totalChambers;
    
    // Update species diversity
    const speciesDiversity = species.length;
    document.getElementById('speciesDiversity').textContent = speciesDiversity;
    
    // Update active rules (simulated)
    document.getElementById('activeRules').textContent = '8';
    
    // Update system uptime (simulated)
    const uptime = calculateUptime();
    document.getElementById('systemUptime').textContent = uptime;
    
    console.log('📊 Analytics updated:', {
        totalChambers,
        speciesDiversity,
        activeRules: 8,
        uptime
    });
}

function calculateUptime() {
    // Simple uptime calculation (hours since page load)
    const startTime = window.mushSystemStartTime || Date.now();
    if (!window.mushSystemStartTime) {
        window.mushSystemStartTime = startTime;
    }
    
    const uptimeMs = Date.now() - startTime;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (uptimeHours > 0) {
        return `${uptimeHours}h ${uptimeMinutes}m`;
    } else {
        return `${uptimeMinutes}m`;
    }
}

function toggleAnalytics() {
    const analyticsGrid = document.getElementById('analyticsGrid');
    const toggleButton = document.getElementById('analyticsToggle');
    
    if (analyticsGrid.style.display === 'none') {
        analyticsGrid.style.display = 'grid';
        toggleButton.textContent = '[-] Collapse';
    } else {
        analyticsGrid.style.display = 'none';
        toggleButton.textContent = '[+] Expand';
    }
}

// Make functions globally accessible
window.removeChamber = removeChamber;
window.simulateSensorData = simulateSensorData;
window.toggleSpeciesLibrary = toggleSpeciesLibrary;
window.showAddChamberModal = showAddChamberModal;
window.closeAddChamberModal = closeAddChamberModal;
window.addChamber = addChamber;
window.showChamberSelectionModal = showChamberSelectionModal;
window.closeChamberSelectionModal = closeChamberSelectionModal;
window.confirmSpeciesAssignment = confirmSpeciesAssignment;
window.showAddSpeciesModal = showAddSpeciesModal;
window.closeAddSpeciesModal = closeAddSpeciesModal;
window.generateRandomSpecies = generateRandomSpecies;
window.createSpecies = createSpecies;

// Authentication and Session Management
function checkAuthentication() {
    const token = localStorage.getItem('mush_token');
    const user = JSON.parse(localStorage.getItem('mush_user') || '{}');
    
    if (!token || !user.username) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Display user info in header
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `<span>Welcome, ${user.username} (${user.role})</span>`;
    document.querySelector('.dashboard-header').appendChild(userInfo);
    
    return true;
}

function logout() {
    const token = localStorage.getItem('mush_token');
    
    // Call logout API
    fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
    }).catch(console.error);
    
    // Clear local storage
    localStorage.removeItem('mush_token');
    localStorage.removeItem('mush_user');
    localStorage.removeItem('mush_permissions');
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Advanced Feature Modal Functions
function showAlertsModal() {
    document.getElementById('alerts-modal').style.display = 'block';
    loadAlertsData();
}

function showPhaseManagementModal() {
    document.getElementById('phase-management-modal').style.display = 'block';
    loadPhaseData();
}

function showBatchOperationsModal() {
    document.getElementById('batch-operations-modal').style.display = 'block';
    loadBatchOperationsData();
}

function showSensorDataModal() {
    document.getElementById('sensor-data-modal').style.display = 'block';
    loadSensorData();
}

function showUserManagementModal() {
    document.getElementById('user-management-modal').style.display = 'block';
    loadUserManagementData();
}

// Alerts & Notifications Functions
async function loadAlertsData() {
    try {
        const [alertsResponse, historyResponse, channelsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/alerts`),
            fetch(`${API_BASE_URL}/alerts/history`),
            fetch(`${API_BASE_URL}/alerts/channels`)
        ]);
        
        const alerts = await alertsResponse.json();
        const history = await historyResponse.json();
        const channels = await channelsResponse.json();
        
        // Store data for tab switching
        window.alertsData = { alerts, history, channels };
        showAlertsTab('active');
    } catch (error) {
        console.error('Error loading alerts data:', error);
    }
}

function showAlertsTab(tab) {
    const content = document.getElementById('alerts-content');
    const data = window.alertsData || {};
    
    // Update tab buttons
    document.querySelectorAll('.alerts-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(tab) {
        case 'active':
            content.innerHTML = renderActiveAlerts(data.alerts || []);
            break;
        case 'history':
            content.innerHTML = renderAlertHistory(data.history || []);
            break;
        case 'channels':
            content.innerHTML = renderAlertChannels(data.channels || []);
            break;
    }
}

function renderActiveAlerts(alerts) {
    if (!alerts.length) return '<p>No active alerts</p>';
    
    return alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <h4>${alert.message}</h4>
            <p>Chamber: ${alert.chamber_id} | Severity: ${alert.severity}</p>
            <p>Created: ${alert.created_at}</p>
            <button class="btn btn-sm btn-primary" onclick="acknowledgeAlert('${alert.id}')">Acknowledge</button>
        </div>
    `).join('');
}

function renderAlertHistory(history) {
    if (!history.length) return '<p>No alert history</p>';
    
    return history.map(alert => `
        <div class="alert-history-item">
            <h5>${alert.message}</h5>
            <p>Chamber: ${alert.chamber_id} | Status: ${alert.status}</p>
            <p>Created: ${alert.created_at} | Resolved: ${alert.resolved_at || 'N/A'}</p>
        </div>
    `).join('');
}

function renderAlertChannels(channels) {
    return channels.map(channel => `
        <div class="alert-channel-item">
            <h5>${channel.name} (${channel.type})</h5>
            <p>Endpoint: ${channel.endpoint}</p>
            <p>Status: ${channel.enabled ? 'Enabled' : 'Disabled'}</p>
            <button class="btn btn-sm btn-warning" onclick="toggleChannel('${channel.id}')">Toggle</button>
        </div>
    `).join('');
}

// Phase Management Functions
async function loadPhaseData() {
    try {
        const [phasesResponse, harvestResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/phases`),
            fetch(`${API_BASE_URL}/harvest`)
        ]);
        
        const phases = await phasesResponse.json();
        const harvest = await harvestResponse.json();
        
        window.phaseData = { phases, harvest };
        showPhaseTab('overview');
    } catch (error) {
        console.error('Error loading phase data:', error);
    }
}

function showPhaseTab(tab) {
    const content = document.getElementById('phase-content');
    const data = window.phaseData || {};
    
    // Update tab buttons
    document.querySelectorAll('.phase-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(tab) {
        case 'overview':
            content.innerHTML = renderPhaseOverview(data.phases || []);
            break;
        case 'schedule':
            content.innerHTML = renderPhaseScheduling();
            break;
        case 'harvest':
            content.innerHTML = renderHarvestTracking(data.harvest || []);
            break;
    }
}

function renderPhaseOverview(phases) {
    return phases.map(phase => `
        <div class="phase-item">
            <h4>${phase.name}</h4>
            <p>Duration: ${phase.duration_days} days</p>
            <p>Temperature: ${phase.temperature_min}-${phase.temperature_max}°C</p>
            <p>Humidity: ${phase.humidity_min}-${phase.humidity_max}%</p>
            <p>CO2: ${phase.co2_min}-${phase.co2_max} ppm</p>
        </div>
    `).join('');
}

function renderPhaseScheduling() {
    return `
        <div class="phase-scheduling">
            <h4>Schedule Phase Changes</h4>
            <div class="form-group">
                <label>Chamber:</label>
                <select id="phase-chamber-select" class="form-select">
                    <option value="">Select Chamber</option>
                    ${environments.map(env => `<option value="${env.id}">${env.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>New Phase:</label>
                <select id="phase-new-phase" class="form-select">
                    <option value="inoculation">Inoculation</option>
                    <option value="colonization">Colonization</option>
                    <option value="pinning">Pinning</option>
                    <option value="fruiting">Fruiting</option>
                    <option value="harvest">Harvest</option>
                </select>
            </div>
            <div class="form-group">
                <label>Schedule Date:</label>
                <input type="datetime-local" id="phase-schedule-date" class="form-input">
            </div>
        </div>
    `;
}

function renderHarvestTracking(harvests) {
    if (!harvests.length) return '<p>No harvest records</p>';
    
    return harvests.map(harvest => `
        <div class="harvest-item">
            <h5>Chamber ${harvest.chamber_id} - ${harvest.species_id}</h5>
            <p>Weight: ${harvest.weight_grams}g | Grade: ${harvest.quality_grade}</p>
            <p>Date: ${harvest.harvest_date}</p>
            <p>Notes: ${harvest.notes || 'None'}</p>
        </div>
    `).join('');
}

// Batch Operations Functions
async function loadBatchOperationsData() {
    const content = document.getElementById('chamber-selection');
    content.innerHTML = environments.map(env => `
        <label class="chamber-checkbox">
            <input type="checkbox" value="${env.id}" class="chamber-select">
            ${env.name} (${env.species_id || 'Unassigned'})
        </label>
    `).join('');
}

async function executeBulkAction() {
    const action = document.getElementById('bulk-action-select').value;
    const value = document.getElementById('bulk-action-value').value;
    const selectedChambers = Array.from(document.querySelectorAll('.chamber-select:checked')).map(cb => parseInt(cb.value));
    
    if (!action || selectedChambers.length === 0) {
        alert('Please select an action and at least one chamber');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/batch/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                chamber_ids: selectedChambers,
                value
            })
        });
        
        const result = await response.json();
        document.getElementById('batch-results').innerHTML = `
            <h4>Batch Operation Results:</h4>
            <p>Action: ${result.action}</p>
            <p>Chambers affected: ${result.chamber_ids.length}</p>
            <p>Status: ${result.results.filter(r => r.status === 'success').length} successful</p>
        `;
        
        // Refresh chamber data
        await loadEnvironments();
        renderChambers();
    } catch (error) {
        console.error('Batch operation error:', error);
        alert('Batch operation failed');
    }
}

// Sensor Data Functions
async function loadSensorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/sensors/data`);
        const sensorData = await response.json();
        window.sensorData = sensorData;
        showSensorTab('live');
    } catch (error) {
        console.error('Error loading sensor data:', error);
    }
}

function showSensorTab(tab) {
    const content = document.getElementById('sensor-content');
    const data = window.sensorData || {};
    
    // Update tab buttons
    document.querySelectorAll('.sensor-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(tab) {
        case 'live':
            content.innerHTML = renderLiveSensorData(data);
            break;
        case 'control':
            content.innerHTML = renderDeviceControl();
            break;
        case 'history':
            content.innerHTML = renderSensorHistory();
            break;
    }
}

function renderLiveSensorData(data) {
    return Object.entries(data).map(([deviceId, readings]) => `
        <div class="sensor-device">
            <h4>${deviceId}</h4>
            <div class="sensor-readings">
                <div class="reading">Temperature: ${readings.temperature}°C</div>
                <div class="reading">Humidity: ${readings.humidity}%</div>
                <div class="reading">CO2: ${readings.co2} ppm</div>
                <div class="reading">Status: ${readings.status}</div>
                <div class="reading">Last Update: ${readings.last_update}</div>
            </div>
        </div>
    `).join('');
}

function renderDeviceControl() {
    return `
        <div class="device-control">
            <h4>Device Control</h4>
            <div class="form-group">
                <label>Device:</label>
                <select id="control-device" class="form-select">
                    <option value="esp32_chamber_01">ESP32 Chamber 01</option>
                    <option value="esp32_chamber_02">ESP32 Chamber 02</option>
                </select>
            </div>
            <div class="form-group">
                <label>Action:</label>
                <select id="control-action" class="form-select">
                    <option value="set_temperature">Set Temperature</option>
                    <option value="set_humidity">Set Humidity</option>
                    <option value="toggle_fan">Toggle Fan</option>
                    <option value="toggle_heater">Toggle Heater</option>
                    <option value="calibrate">Calibrate Sensors</option>
                </select>
            </div>
            <div class="form-group">
                <label>Value:</label>
                <input type="text" id="control-value" class="form-input" placeholder="Enter value">
            </div>
            <button class="btn btn-primary" onclick="sendDeviceCommand()">Send Command</button>
        </div>
    `;
}

async function sendDeviceCommand() {
    const deviceId = document.getElementById('control-device').value;
    const action = document.getElementById('control-action').value;
    const value = document.getElementById('control-value').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sensors/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId, action, value })
        });
        
        const result = await response.json();
        alert(`Command sent successfully: ${result.status}`);
    } catch (error) {
        console.error('Device control error:', error);
        alert('Failed to send command');
    }
}

// User Management Functions
async function loadUserManagementData() {
    try {
        const [usersResponse, permissionsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/users`),
            fetch(`${API_BASE_URL}/auth/permissions`)
        ]);
        
        const users = await usersResponse.json();
        const permissions = await permissionsResponse.json();
        
        window.userManagementData = { users, permissions };
        showUserTab('users');
    } catch (error) {
        console.error('Error loading user management data:', error);
    }
}

function showUserTab(tab) {
    const content = document.getElementById('user-content');
    const data = window.userManagementData || {};
    
    // Update tab buttons
    document.querySelectorAll('.user-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(tab) {
        case 'users':
            content.innerHTML = renderUsers(data.users || []);
            break;
        case 'roles':
            content.innerHTML = renderRoles(data.permissions || {});
            break;
        case 'sessions':
            content.innerHTML = renderActiveSessions();
            break;
    }
}

function renderUsers(users) {
    return users.map(user => `
        <div class="user-item">
            <h5>${user.username}</h5>
            <p>Email: ${user.email}</p>
            <p>Role: ${user.role}</p>
            <p>Status: ${user.active ? 'Active' : 'Inactive'}</p>
            <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deactivateUser(${user.id})">Deactivate</button>
        </div>
    `).join('');
}

function renderRoles(permissions) {
    return Object.entries(permissions).map(([role, perms]) => `
        <div class="role-item">
            <h5>${role.toUpperCase()}</h5>
            <p>Permissions: ${perms.join(', ')}</p>
        </div>
    `).join('');
}

// Make all new functions globally accessible
window.checkAuthentication = checkAuthentication;
window.logout = logout;
window.showAlertsModal = showAlertsModal;
window.showPhaseManagementModal = showPhaseManagementModal;
window.showBatchOperationsModal = showBatchOperationsModal;
window.showSensorDataModal = showSensorDataModal;
window.showUserManagementModal = showUserManagementModal;
window.showAlertsTab = showAlertsTab;
window.showPhaseTab = showPhaseTab;
window.showSensorTab = showSensorTab;
window.showUserTab = showUserTab;
window.executeBulkAction = executeBulkAction;
window.sendDeviceCommand = sendDeviceCommand;
window.updateAnalytics = updateAnalytics;
window.toggleAnalytics = toggleAnalytics;

// Species assignment modal
function openSpeciesModal(environmentId) {
    console.log('Opening species modal for environment:', environmentId);
    // Could implement species assignment modal here
}

// ===== ADD SPECIES FUNCTIONALITY =====

// Comprehensive mushroom database for auto-generation
const MUSHROOM_DATABASE = {
    "Lion's Mane": {
        scientific_name: "Hericium erinaceus",
        description: "White, cascading icicle-like mushroom with a seafood-like taste. Excellent for beginners.",
        difficulty_level: "Beginner",
        typical_grow_time_days: 14,
        temp_min: 18, temp_max: 24,
        humidity_min: 85, humidity_max: 95,
        co2_min: 500, co2_max: 1000,
        fae_cycles: 4, light_hours: 12
    },
    "Shiitake": {
        scientific_name: "Lentinula edodes",
        description: "Popular brown mushroom with rich, umami flavor. Requires hardwood substrate.",
        difficulty_level: "Intermediate",
        typical_grow_time_days: 21,
        temp_min: 16, temp_max: 22,
        humidity_min: 80, humidity_max: 90,
        co2_min: 800, co2_max: 1500,
        fae_cycles: 3, light_hours: 8
    },
    "Oyster": {
        scientific_name: "Pleurotus ostreatus",
        description: "Fast-growing, fan-shaped mushrooms. Very forgiving and perfect for beginners.",
        difficulty_level: "Beginner",
        typical_grow_time_days: 10,
        temp_min: 20, temp_max: 26,
        humidity_min: 85, humidity_max: 95,
        co2_min: 400, co2_max: 800,
        fae_cycles: 5, light_hours: 12
    },
    "Reishi": {
        scientific_name: "Ganoderma lucidum",
        description: "Medicinal mushroom with glossy, varnish-like appearance. Slow growing but valuable.",
        difficulty_level: "Advanced",
        typical_grow_time_days: 45,
        temp_min: 24, temp_max: 28,
        humidity_min: 90, humidity_max: 95,
        co2_min: 1000, co2_max: 2000,
        fae_cycles: 2, light_hours: 6
    },
    "Maitake": {
        scientific_name: "Grifola frondosa",
        description: "Hen-of-the-woods with complex, frilly structure. Prized for culinary and medicinal uses.",
        difficulty_level: "Advanced",
        typical_grow_time_days: 28,
        temp_min: 18, temp_max: 22,
        humidity_min: 85, humidity_max: 90,
        co2_min: 600, co2_max: 1200,
        fae_cycles: 3, light_hours: 10
    },
    "Enoki": {
        scientific_name: "Flammulina velutipes",
        description: "Thin, white mushrooms with long stems. Grows in clusters and prefers cooler temperatures.",
        difficulty_level: "Intermediate",
        typical_grow_time_days: 18,
        temp_min: 12, temp_max: 18,
        humidity_min: 90, humidity_max: 95,
        co2_min: 1500, co2_max: 3000,
        fae_cycles: 2, light_hours: 4
    },
    "King Trumpet": {
        scientific_name: "Pleurotus eryngii",
        description: "Large oyster mushroom with thick, meaty stems. Excellent texture and flavor.",
        difficulty_level: "Intermediate",
        typical_grow_time_days: 16,
        temp_min: 18, temp_max: 24,
        humidity_min: 80, humidity_max: 90,
        co2_min: 500, co2_max: 1000,
        fae_cycles: 4, light_hours: 10
    },
    "Cordyceps": {
        scientific_name: "Cordyceps militaris",
        description: "Orange, finger-like medicinal mushroom. Requires specific growing conditions.",
        difficulty_level: "Advanced",
        typical_grow_time_days: 35,
        temp_min: 22, temp_max: 26,
        humidity_min: 85, humidity_max: 95,
        co2_min: 800, co2_max: 1500,
        fae_cycles: 3, light_hours: 14
    }
};

// Show Add Species modal
function showAddSpeciesModal() {
    console.log('🍄 Opening Add Species modal');
    const modal = document.getElementById('addSpeciesModal');
    if (modal) {
        modal.style.display = 'block';
        // Clear form
        document.getElementById('addSpeciesForm').reset();
    } else {
        console.error('Add Species modal not found!');
    }
}

// Close Add Species modal
function closeAddSpeciesModal() {
    console.log('🍄 Closing Add Species modal');
    const modal = document.getElementById('addSpeciesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Auto-generate optimal parameters based on species name
function autoGenerateParameters() {
    console.log('🤖 Auto-generating parameters');
    
    const speciesName = document.getElementById('speciesName').value.trim();
    if (!speciesName) {
        alert('Please enter a species name first to auto-generate parameters.');
        return;
    }
    
    // Try to find exact match or partial match in database
    let matchedData = null;
    const searchName = speciesName.toLowerCase();
    
    // First try exact match
    for (const [dbName, data] of Object.entries(MUSHROOM_DATABASE)) {
        if (dbName.toLowerCase() === searchName) {
            matchedData = data;
            break;
        }
    }
    
    // If no exact match, try partial match
    if (!matchedData) {
        for (const [dbName, data] of Object.entries(MUSHROOM_DATABASE)) {
            if (dbName.toLowerCase().includes(searchName) || searchName.includes(dbName.toLowerCase())) {
                matchedData = data;
                break;
            }
        }
    }
    
    if (matchedData) {
        // Fill in all the form fields
        document.getElementById('scientificName').value = matchedData.scientific_name || '';
        document.getElementById('speciesDescription').value = matchedData.description || '';
        document.getElementById('difficultyLevel').value = matchedData.difficulty_level || '';
        document.getElementById('growTime').value = matchedData.typical_grow_time_days || '';
        
        // Environmental parameters
        document.getElementById('tempMin').value = matchedData.temp_min || '';
        document.getElementById('tempMax').value = matchedData.temp_max || '';
        document.getElementById('humidityMin').value = matchedData.humidity_min || '';
        document.getElementById('humidityMax').value = matchedData.humidity_max || '';
        document.getElementById('co2Min').value = matchedData.co2_min || '';
        document.getElementById('co2Max').value = matchedData.co2_max || '';
        document.getElementById('faeCycles').value = matchedData.fae_cycles || '';
        document.getElementById('lightHours').value = matchedData.light_hours || '';
        
        alert(`✅ Auto-generated parameters for ${speciesName} based on our mushroom database!`);
    } else {
        // Generate reasonable defaults for unknown species
        document.getElementById('difficultyLevel').value = 'Intermediate';
        document.getElementById('growTime').value = '21';
        document.getElementById('tempMin').value = '18';
        document.getElementById('tempMax').value = '24';
        document.getElementById('humidityMin').value = '85';
        document.getElementById('humidityMax').value = '95';
        document.getElementById('co2Min').value = '500';
        document.getElementById('co2Max').value = '1000';
        document.getElementById('faeCycles').value = '4';
        document.getElementById('lightHours').value = '12';
        
        alert(`⚠️ Species "${speciesName}" not found in database. Generated standard mushroom parameters. Please adjust as needed.`);
    }
}

// Create new species
async function createSpecies() {
    console.log('🍄 Creating new species');
    
    const form = document.getElementById('addSpeciesForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const name = formData.get('name');
    if (!name || name.trim() === '') {
        alert('Species name is required!');
        return;
    }
    
    // Build species object
    const newSpecies = {
        id: Date.now(), // Simple ID generation
        name: name.trim(),
        scientific_name: formData.get('scientific_name') || '',
        description: formData.get('description') || '',
        difficulty_level: formData.get('difficulty_level') || 'Intermediate',
        typical_grow_time_days: parseInt(formData.get('typical_grow_time_days')) || 21,
        default_temperature_min: parseInt(formData.get('default_temperature_min')) || 18,
        default_temperature_max: parseInt(formData.get('default_temperature_max')) || 24,
        default_humidity_min: parseInt(formData.get('default_humidity_min')) || 85,
        default_humidity_max: parseInt(formData.get('default_humidity_max')) || 95,
        default_co2_min: parseInt(formData.get('default_co2_min')) || 500,
        default_co2_max: parseInt(formData.get('default_co2_max')) || 1000,
        default_fae_cycles_per_day: parseInt(formData.get('default_fae_cycles_per_day')) || 4,
        default_light_hours_per_day: parseInt(formData.get('default_light_hours_per_day')) || 12
    };
    
    console.log('New species data:', newSpecies);
    
    try {
        // Send to backend API
        const response = await fetch(`${API_BASE_URL}/species/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSpecies)
        });
        
        if (response.ok) {
            const savedSpecies = await response.json();
            console.log('✅ Species created successfully:', savedSpecies);
            
            // Add to local array
            species.push(savedSpecies);
            
            // Re-render species library
            renderSpecies();
            
            // Close modal
            closeAddSpeciesModal();
            
            alert(`✅ Species "${name}" added successfully to your library!`);
        } else {
            console.error('❌ Failed to create species. Status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            alert(`Failed to create species. Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Network error creating species:', error);
        alert('Network error: Could not create species. Please check your connection and try again.');
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const addChamberModal = document.getElementById('addChamberModal');
    const mushroomModal = document.getElementById('mushroomDetailsModal');
    const addSpeciesModal = document.getElementById('addSpeciesModal');
    
    if (event.target === addChamberModal) {
        closeAddChamberModal();
    }
    if (event.target === mushroomModal) {
        closeMushroomDetailsModal();
    }
    if (event.target === addSpeciesModal) {
        closeAddSpeciesModal();
    }
});

// Auto-refresh data every 30 seconds
setInterval(loadAllData, 30000);

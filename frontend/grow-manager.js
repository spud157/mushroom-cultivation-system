/**
 * Grow Manager JavaScript - Batch + Cell Manager functionality
 */

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8001/api';

// Global variables
let currentBatch = null;
let currentBatchId = null;
let batches = [];
let cells = [];
let speciesProfiles = [];
let monitorInterval = null;

// Page initialization
window.addEventListener('load', async function() {
    if (!checkAuthentication()) return;
    await loadGrowData();
    showGrowView('start');
    generateBatchName();
});

// Load all data for Grow Management
async function loadGrowData() {
    try {
        const [batchesResponse, cellsResponse, speciesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/batches`),
            fetch(`${API_BASE_URL}/cells`),
            fetch(`${API_BASE_URL}/species/profiles`)
        ]);
        
        batches = await batchesResponse.json();
        cells = await cellsResponse.json();
        speciesProfiles = await speciesResponse.json();
        
        updateStatusCounts();
        populateDropdowns();
        renderSpeciesLibrary();
        
    } catch (error) {
        console.error('Error loading grow data:', error);
        alert('Failed to load grow data');
    }
}

// Update status counts
function updateStatusCounts() {
    const activeBatches = batches.filter(b => b.status === 'Running' || b.status === 'Paused').length;
    const availableCells = cells.filter(c => c.status === 'Available').length;
    
    document.getElementById('active-batches-count').textContent = activeBatches;
    document.getElementById('available-cells-count').textContent = availableCells;
    document.getElementById('total-species-count').textContent = speciesProfiles.length;
}

// Show different grow views
function showGrowView(view) {
    document.querySelectorAll('.grow-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    
    document.getElementById(`${view}-${view === 'library' ? 'library' : view === 'monitor' ? 'monitor' : 'batch'}-view`).style.display = 'block';
    document.getElementById(`${view === 'library' ? 'library' : view === 'monitor' ? 'monitor' : 'start'}-tab`).classList.add('active');
    
    if (view === 'monitor') {
        populateMonitorBatchSelect();
    }
}

// Populate dropdowns
function populateDropdowns() {
    const speciesSelect = document.getElementById('species-select');
    speciesSelect.innerHTML = '<option value="">Select Species</option>';
    speciesProfiles.forEach(species => {
        speciesSelect.innerHTML += `<option value="${species.id}">${species.name}</option>`;
    });
    
    const chamberSelect = document.getElementById('chamber-select');
    chamberSelect.innerHTML = '<option value="">Select Chamber</option>';
    cells.filter(c => c.status === 'Available').forEach(cell => {
        chamberSelect.innerHTML += `<option value="${cell.id}">${cell.name} (${cell.location})</option>`;
    });
    
    populateMonitorBatchSelect();
}

function populateMonitorBatchSelect() {
    const monitorSelect = document.getElementById('monitor-batch-select');
    monitorSelect.innerHTML = '<option value="">Select Batch to Monitor</option>';
    batches.filter(b => b.status !== 'Completed' && b.status !== 'Aborted').forEach(batch => {
        const species = speciesProfiles.find(s => s.id === batch.speciesId);
        const cell = cells.find(c => c.id === batch.cellId);
        monitorSelect.innerHTML += `<option value="${batch.id}">${batch.name} (${species?.name} - ${cell?.name})</option>`;
    });
}

// Generate batch name
function generateBatchName() {
    const now = new Date();
    const week = Math.ceil(now.getDate() / 7);
    const farmNumber = Math.floor(Math.random() * 3) + 1;
    document.getElementById('batch-name').value = `Week ${week} - Farm ${farmNumber}`;
}

// Preview functions
function previewSpeciesProfile() {
    const speciesId = parseInt(document.getElementById('species-select').value);
    const species = speciesProfiles.find(s => s.id === speciesId);
    const preview = document.getElementById('species-preview');
    
    if (species) {
        preview.style.display = 'block';
        const stagesHtml = species.stages.map((stage, index) => `
            <div class="stage-preview">
                <h5>Stage ${index + 1}: ${stage.name}</h5>
                <p>Duration: ${Math.round(stage.durationHours / 24)} days</p>
                <div class="stage-targets">
                    <span>Temp: ${stage.targets.tempMin}-${stage.targets.tempMax}°C</span>
                    <span>RH: ${stage.targets.rhMin}-${stage.targets.rhMax}%</span>
                    <span>CO₂: ${stage.targets.co2Min}-${stage.targets.co2Max}ppm</span>
                </div>
            </div>
        `).join('');
        document.getElementById('species-stages').innerHTML = stagesHtml;
    } else {
        preview.style.display = 'none';
    }
}

function previewChamberInfo() {
    const cellId = parseInt(document.getElementById('chamber-select').value);
    const cell = cells.find(c => c.id === cellId);
    const preview = document.getElementById('chamber-preview');
    
    if (cell) {
        preview.style.display = 'block';
        document.getElementById('chamber-details').innerHTML = `
            <div class="chamber-detail">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${cell.location}</span>
            </div>
            <div class="chamber-detail">
                <span class="detail-label">Capacity:</span>
                <span class="detail-value">${cell.capacity}</span>
            </div>
        `;
    } else {
        preview.style.display = 'none';
    }
}

// Batch operations
async function createBatch() {
    const batchData = {
        name: document.getElementById('batch-name').value,
        speciesId: parseInt(document.getElementById('species-select').value),
        cellId: parseInt(document.getElementById('chamber-select').value),
        notes: document.getElementById('batch-notes').value
    };
    
    if (!batchData.name || !batchData.speciesId || !batchData.cellId) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(batchData)
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert(`Batch "${result.name}" created successfully!`);
            await loadGrowData();
            clearStartForm();
            return result;
        }
        
    } catch (error) {
        console.error('Error creating batch:', error);
        alert('Failed to create batch');
    }
}

async function createAndStartBatch() {
    const newBatch = await createBatch();
    if (newBatch && newBatch.status === 'Pending') {
        await startBatch(newBatch.id);
        showGrowView('monitor');
        document.getElementById('monitor-batch-select').value = newBatch.id;
        await loadBatchMonitor();
    }
}

async function startBatch(batchId) {
    try {
        const response = await fetch(`${API_BASE_URL}/batches/${batchId}/start`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert('Batch started successfully!');
            await loadGrowData();
        }
        
    } catch (error) {
        console.error('Error starting batch:', error);
        alert('Failed to start batch');
    }
}

function clearStartForm() {
    document.getElementById('batch-name').value = '';
    document.getElementById('species-select').value = '';
    document.getElementById('chamber-select').value = '';
    document.getElementById('batch-notes').value = '';
    document.getElementById('species-preview').style.display = 'none';
    document.getElementById('chamber-preview').style.display = 'none';
    generateBatchName();
}

// Monitor functions
async function loadBatchMonitor() {
    const batchId = document.getElementById('monitor-batch-select').value;
    const content = document.getElementById('batch-monitor-content');
    
    if (!batchId) {
        content.innerHTML = '<div class="loading-message">Select a batch to monitor</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches/${batchId}`);
        currentBatch = await response.json();
        currentBatchId = batchId;
        
        if (currentBatch.error) {
            alert(currentBatch.error);
            return;
        }
        
        renderBatchMonitor();
        
        if (monitorInterval) clearInterval(monitorInterval);
        monitorInterval = setInterval(refreshBatchMonitor, 30000);
        
    } catch (error) {
        console.error('Error loading batch monitor:', error);
        alert('Failed to load batch monitor');
    }
}

function renderBatchMonitor() {
    const content = document.getElementById('batch-monitor-content');
    const cell = cells.find(c => c.id === currentBatch.cellId);
    
    let stageInfo = 'Not started';
    let timeRemaining = '--';
    if (currentBatch.currentStageInfo) {
        stageInfo = `${currentBatch.currentStageInfo.stage.name} (${Math.round(currentBatch.currentStageInfo.progress * 100)}%)`;
        timeRemaining = `${Math.round(currentBatch.currentStageInfo.hoursRemaining)}h remaining`;
    }
    
    let envData = { tempC: '--', rh: '--', co2ppm: '--', lux: '--' };
    if (currentBatch.recentReadings && currentBatch.recentReadings.length > 0) {
        envData = currentBatch.recentReadings[currentBatch.recentReadings.length - 1];
    }
    
    content.innerHTML = `
        <div class="batch-header">
            <div class="batch-info-grid">
                <div class="batch-info-item">
                    <span class="info-label">Batch:</span>
                    <span class="info-value">${currentBatch.name}</span>
                </div>
                <div class="batch-info-item">
                    <span class="info-label">Species:</span>
                    <span class="info-value">${currentBatch.species?.name || 'Unknown'}</span>
                </div>
                <div class="batch-info-item">
                    <span class="info-label">Chamber:</span>
                    <span class="info-value">${cell?.name || 'Unknown'}</span>
                </div>
                <div class="batch-info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${currentBatch.status}</span>
                </div>
                <div class="batch-info-item">
                    <span class="info-label">Stage:</span>
                    <span class="info-value">${stageInfo}</span>
                </div>
                <div class="batch-info-item">
                    <span class="info-label">Time Remaining:</span>
                    <span class="info-value">${timeRemaining}</span>
                </div>
            </div>
            
            <div class="batch-controls">
                ${currentBatch.status === 'Running' ? 
                    '<button class="btn btn-warning" onclick="pauseBatch()">Pause</button>' :
                    currentBatch.status === 'Paused' ?
                    '<button class="btn btn-success" onclick="resumeBatch()">Resume</button>' : ''
                }
                ${currentBatch.status !== 'Completed' && currentBatch.status !== 'Aborted' ?
                    '<button class="btn btn-danger" onclick="abortBatch()">Abort</button>' : ''
                }
            </div>
        </div>

        <div class="live-data">
            <h4>Live Environmental Data</h4>
            <div class="env-tiles">
                <div class="env-tile">
                    <div class="env-label">Temperature</div>
                    <div class="env-value">${envData.tempC}°C</div>
                </div>
                <div class="env-tile">
                    <div class="env-label">Humidity</div>
                    <div class="env-value">${envData.rh}%</div>
                </div>
                <div class="env-tile">
                    <div class="env-label">CO₂</div>
                    <div class="env-value">${envData.co2ppm}ppm</div>
                </div>
                <div class="env-tile">
                    <div class="env-label">Light</div>
                    <div class="env-value">${envData.lux}lux</div>
                </div>
            </div>
        </div>
    `;
}

// Batch controls
async function pauseBatch() {
    if (!currentBatchId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches/${currentBatchId}/pause`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert('Batch paused successfully');
            await loadBatchMonitor();
        }
        
    } catch (error) {
        console.error('Error pausing batch:', error);
        alert('Failed to pause batch');
    }
}

async function resumeBatch() {
    if (!currentBatchId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches/${currentBatchId}/resume`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert('Batch resumed successfully');
            await loadBatchMonitor();
        }
        
    } catch (error) {
        console.error('Error resuming batch:', error);
        alert('Failed to resume batch');
    }
}

async function abortBatch() {
    if (!currentBatchId) return;
    
    if (!confirm('Are you sure you want to abort this batch?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/batches/${currentBatchId}/abort`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert('Batch aborted successfully');
            await loadBatchMonitor();
            await loadGrowData();
        }
        
    } catch (error) {
        console.error('Error aborting batch:', error);
        alert('Failed to abort batch');
    }
}

// Species library
function renderSpeciesLibrary() {
    const library = document.getElementById('species-library');
    
    if (speciesProfiles.length === 0) {
        library.innerHTML = '<div class="empty-state">No species profiles available</div>';
        return;
    }
    
    library.innerHTML = speciesProfiles.map(species => `
        <div class="species-card">
            <div class="species-header">
                <h4>${species.name}</h4>
                <span class="species-difficulty">${species.difficulty_level}</span>
            </div>
            <div class="species-info">
                <p><strong>Scientific Name:</strong> ${species.scientific_name}</p>
                <p>${species.description}</p>
                <p><strong>Stages:</strong> ${species.stages.length} stages</p>
            </div>
            <div class="species-actions">
                <button class="btn btn-primary" onclick="assignSpeciesToCell(${species.id})">Assign to Chamber</button>
                <button class="btn btn-secondary" onclick="viewSpeciesDetails(${species.id})">View Details</button>
            </div>
        </div>
    `).join('');
}

async function assignSpeciesToCell(speciesId) {
    const availableCells = cells.filter(c => c.status === 'Available');
    
    if (availableCells.length === 0) {
        alert('No available chambers for assignment');
        return;
    }
    
    const cellOptions = availableCells.map(c => `${c.id}: ${c.name}`).join('\n');
    const cellId = prompt(`Select Chamber:\n${cellOptions}\n\nEnter Chamber ID:`);
    
    if (!cellId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/species/${speciesId}/assign`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                cellId: parseInt(cellId),
                batchName: `Quick Assign - ${new Date().toLocaleDateString()}`
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            alert(`Species assigned successfully! Batch created: ${result.name}`);
            await loadGrowData();
        }
        
    } catch (error) {
        console.error('Error assigning species:', error);
        alert('Failed to assign species');
    }
}

function viewSpeciesDetails(speciesId) {
    const species = speciesProfiles.find(s => s.id === speciesId);
    if (species) {
        alert(`Species: ${species.name}\n\nStages:\n${species.stages.map((s, i) => `${i+1}. ${s.name} (${Math.round(s.durationHours/24)} days)`).join('\n')}`);
    }
}

// Refresh functions
async function refreshGrowData() {
    await loadGrowData();
    alert('Data refreshed successfully');
}

async function refreshBatchMonitor() {
    if (currentBatchId) {
        await loadBatchMonitor();
    }
}

function refreshSpeciesLibrary() {
    renderSpeciesLibrary();
}

// Placeholders
function createSpecies() { alert('Create species feature coming soon!'); }
function importSpecies() { alert('Import species feature coming soon!'); }
function adjustTargets() { alert('Adjust targets feature coming soon!'); }

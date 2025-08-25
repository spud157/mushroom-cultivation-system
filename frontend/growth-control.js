// Enhanced Growth Control System for Mushroom Cultivation
class GrowthController {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.growthData = {};
        this.autoRefreshInterval = null;
    }

    async loadGrowthStatus(environmentId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/growth-status`);
            if (response.ok) {
                this.growthData[environmentId] = await response.json();
                return this.growthData[environmentId];
            }
            return null;
        } catch (error) {
            console.error('Error loading growth status:', error);
            return null;
        }
    }

    async advancePhase(environmentId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/advance-phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const result = await response.json();
                await this.loadGrowthStatus(environmentId); // Refresh data
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to advance phase');
            }
        } catch (error) {
            console.error('Error advancing phase:', error);
            throw error;
        }
    }

    async setPhase(environmentId, phaseName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/environments/${environmentId}/set-phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase_name: phaseName })
            });
            
            if (response.ok) {
                const result = await response.json();
                await this.loadGrowthStatus(environmentId); // Refresh data
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to set phase');
            }
        } catch (error) {
            console.error('Error setting phase:', error);
            throw error;
        }
    }

    renderGrowthProgress(environmentId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const growthData = this.growthData[environmentId];
        if (!growthData || growthData.status) {
            container.innerHTML = `
                <div class="growth-status-empty">
                    <p>${growthData?.message || 'No growth data available'}</p>
                </div>
            `;
            return;
        }

        const currentStage = growthData.current_stage;
        const nextStage = growthData.next_stage;
        
        container.innerHTML = `
            <div class="growth-control-panel">
                <div class="growth-header">
                    <h3>🍄 ${growthData.species_name}</h3>
                    <div class="total-progress">
                        <span>Total Progress: ${growthData.total_progress}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${growthData.total_progress}%"></div>
                        </div>
                    </div>
                </div>

                <div class="current-stage">
                    <h4>Current Stage: ${currentStage.name}</h4>
                    <div class="stage-progress">
                        <div class="stage-info">
                            <span>Progress: ${currentStage.progress}%</span>
                            <span>Remaining: ${currentStage.days_remaining} days</span>
                        </div>
                        <div class="progress-bar stage-bar">
                            <div class="progress-fill" style="width: ${currentStage.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="stage-targets">
                        <h5>Optimal Conditions:</h5>
                        <div class="targets-grid">
                            <div class="target-item">
                                <span class="target-label">🌡️ Temperature:</span>
                                <span class="target-value">${currentStage.targets.tempMin}-${currentStage.targets.tempMax}°C</span>
                            </div>
                            <div class="target-item">
                                <span class="target-label">💧 Humidity:</span>
                                <span class="target-value">${currentStage.targets.rhMin}-${currentStage.targets.rhMax}%</span>
                            </div>
                            <div class="target-item">
                                <span class="target-label">🌬️ CO2:</span>
                                <span class="target-value">${currentStage.targets.co2Min}-${currentStage.targets.co2Max}ppm</span>
                            </div>
                            <div class="target-item">
                                <span class="target-label">💡 Light:</span>
                                <span class="target-value">${currentStage.targets.lightHoursPerDay}h/day</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="growth-controls">
                    <div class="control-buttons">
                        ${nextStage ? `
                            <button class="btn btn-primary" onclick="growthController.advancePhaseWithConfirm(${environmentId})">
                                Advance to ${nextStage.name}
                            </button>
                        ` : `
                            <button class="btn btn-success" disabled>
                                Growth Complete! 🎉
                            </button>
                        `}
                        
                        <button class="btn btn-secondary" onclick="growthController.showPhaseSelector(${environmentId})">
                            Set Specific Phase
                        </button>
                        
                        <button class="btn btn-info" onclick="growthController.refreshGrowthData(${environmentId})">
                            Refresh Data
                        </button>
                    </div>
                </div>

                <div class="growth-timeline">
                    <h5>Growth Timeline:</h5>
                    <div class="timeline">
                        ${growthData.all_stages.map((stage, index) => `
                            <div class="timeline-item ${index === currentStage.index ? 'active' : index < currentStage.index ? 'completed' : 'pending'}">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <h6>${stage.name}</h6>
                                    <span>${Math.round(stage.durationHours / 24)} days</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    async advancePhaseWithConfirm(environmentId) {
        const growthData = this.growthData[environmentId];
        if (!growthData || !growthData.next_stage) return;

        const confirmed = confirm(`Advance to ${growthData.next_stage.name} phase?\n\nThis will reset the growth timer and apply new environmental targets.`);
        if (!confirmed) return;

        try {
            const result = await this.advancePhase(environmentId);
            alert(`✅ ${result.message}`);
            this.renderGrowthProgress(environmentId, 'growth-progress-container');
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    }

    showPhaseSelector(environmentId) {
        const growthData = this.growthData[environmentId];
        if (!growthData) return;

        const phases = growthData.all_stages.map(stage => stage.name);
        const currentPhase = growthData.current_stage.name;

        const phaseOptions = phases.map(phase => 
            `<option value="${phase}" ${phase === currentPhase ? 'selected' : ''}>${phase}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'modal phase-selector-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Growth Phase</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Current phase: <strong>${currentPhase}</strong></p>
                    <div class="form-group">
                        <label>New Phase:</label>
                        <select id="phase-selector" class="form-select">
                            ${phaseOptions}
                        </select>
                    </div>
                    <div class="warning">
                        ⚠️ Changing phases will reset the growth timer and apply new environmental conditions.
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="growthController.setPhaseFromSelector(${environmentId})">Set Phase</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async setPhaseFromSelector(environmentId) {
        const selector = document.getElementById('phase-selector');
        const selectedPhase = selector.value;
        
        try {
            const result = await this.setPhase(environmentId, selectedPhase);
            alert(`✅ ${result.message}`);
            document.querySelector('.phase-selector-modal').remove();
            this.renderGrowthProgress(environmentId, 'growth-progress-container');
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    }

    async refreshGrowthData(environmentId) {
        await this.loadGrowthStatus(environmentId);
        this.renderGrowthProgress(environmentId, 'growth-progress-container');
    }

    startAutoRefresh(environmentId, intervalMs = 30000) {
        this.stopAutoRefresh();
        this.autoRefreshInterval = setInterval(() => {
            this.refreshGrowthData(environmentId);
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }
}

// Global instance
let growthController = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof API_BASE_URL !== 'undefined') {
        growthController = new GrowthController(API_BASE_URL);
    } else if (window.app && window.app.apiBaseUrl) {
        growthController = new GrowthController(window.app.apiBaseUrl);
    } else {
        growthController = new GrowthController('http://localhost:8001/api');
    }
});

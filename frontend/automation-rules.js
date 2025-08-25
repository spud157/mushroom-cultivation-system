// Automation Rules Engine JavaScript
// Advanced rule-based automation system for M.U.S.H

const API_BASE_URL = 'http://localhost:8001/api';

// Global variables
let automationRules = [];
let ruleTemplates = {};
let executionLog = [];
let engineStatus = 'ACTIVE';
let executionInterval = null;

// Initialize automation engine
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Initializing Automation Rules Engine...');
    loadRules();
    loadChamberOptions();
    initializeRuleEngine();
    
    // Start rule execution engine
    startRuleEngine();
});

// Load existing automation rules
async function loadRules() {
    try {
        const response = await fetch(`${API_BASE_URL}/rules`);
        if (response.ok) {
            automationRules = await response.json();
            renderRules();
            updateEngineStatus();
        }
    } catch (error) {
        console.error('Failed to load automation rules:', error);
        automationRules = []; // Start with empty rules
        renderRules();
    }
}

// Render automation rules
function renderRules() {
    const container = document.getElementById('rulesGrid');
    if (!container) return;
    
    if (automationRules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Automation Rules</h3>
                <p>Create your first automation rule to get started with intelligent mushroom cultivation.</p>
                <button class="btn btn-primary" onclick="showCreateRuleModal()">Create First Rule</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = automationRules.map(rule => `
        <div class="rule-card ${rule.enabled ? 'active' : 'disabled'}" onclick="showRuleDetails('${rule.id}')">
            <div class="rule-header">
                <h4 class="rule-name">${rule.name}</h4>
                <span class="rule-status ${rule.enabled ? 'active' : 'disabled'}">
                    <span class="status-indicator ${rule.enabled ? 'active' : 'disabled'}"></span>
                    ${rule.enabled ? 'Active' : 'Disabled'}
                </span>
            </div>
            <p class="rule-description">${rule.description || 'No description'}</p>
            <div class="rule-stats">
                <span class="rule-stat">
                    <span class="rule-stat-label">Executions:</span> ${rule.executionCount || 0}
                </span>
                <span class="rule-stat">
                    <span class="rule-stat-label">Priority:</span> ${rule.priority || 'Medium'}
                </span>
                <span class="rule-stat">
                    <span class="rule-stat-label">Last Run:</span> ${rule.lastExecution || 'Never'}
                </span>
            </div>
        </div>
    `).join('');
}

// Show create rule modal
function showCreateRuleModal() {
    const modal = document.getElementById('createRuleModal');
    if (modal) {
        modal.style.display = 'block';
        loadChamberOptions();
    }
}

// Close create rule modal
function closeCreateRuleModal() {
    const modal = document.getElementById('createRuleModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('createRuleForm').reset();
    }
}

// Add condition to rule builder
function addCondition() {
    const builder = document.getElementById('conditionsBuilder');
    const conditionGroup = builder.querySelector('.condition-group');
    
    const newCondition = document.createElement('div');
    newCondition.className = 'condition-row';
    newCondition.innerHTML = `
        <select class="condition-field">
            <option value="">Select Field</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="co2">CO2 Level</option>
            <option value="species">Species</option>
            <option value="phase">Growth Phase</option>
            <option value="time">Time of Day</option>
            <option value="chamber">Chamber</option>
        </select>
        <select class="condition-operator">
            <option value="equals">=</option>
            <option value="not_equals">≠</option>
            <option value="greater_than">></option>
            <option value="less_than"><</option>
            <option value="greater_equal">≥</option>
            <option value="less_equal">≤</option>
            <option value="contains">contains</option>
        </select>
        <input type="text" class="condition-value" placeholder="Value">
        <button type="button" class="btn btn-sm btn-danger" onclick="removeCondition(this)">Remove</button>
    `;
    
    conditionGroup.appendChild(newCondition);
}

// Remove condition
function removeCondition(button) {
    const conditionRow = button.closest('.condition-row');
    const conditionGroup = conditionRow.parentElement;
    
    if (conditionGroup.children.length > 1) {
        conditionRow.remove();
    } else {
        alert('At least one condition is required');
    }
}

// Add action to rule builder
function addAction() {
    const builder = document.getElementById('actionsBuilder');
    const actionGroup = builder.querySelector('.action-group');
    
    const newAction = document.createElement('div');
    newAction.className = 'action-row';
    newAction.innerHTML = `
        <select class="action-type">
            <option value="">Select Action</option>
            <option value="set_temperature">Set Temperature</option>
            <option value="set_humidity">Set Humidity</option>
            <option value="set_co2">Set CO2 Level</option>
            <option value="turn_on_device">Turn On Device</option>
            <option value="turn_off_device">Turn Off Device</option>
            <option value="send_alert">Send Alert</option>
            <option value="change_phase">Change Growth Phase</option>
            <option value="wait">Wait/Delay</option>
        </select>
        <input type="text" class="action-value" placeholder="Value/Setting">
        <button type="button" class="btn btn-sm btn-danger" onclick="removeAction(this)">Remove</button>
    `;
    
    actionGroup.appendChild(newAction);
}

// Remove action
function removeAction(button) {
    const actionRow = button.closest('.action-row');
    const actionGroup = actionRow.parentElement;
    
    if (actionGroup.children.length > 1) {
        actionRow.remove();
    } else {
        alert('At least one action is required');
    }
}

// Create automation rule
async function createRule() {
    const form = document.getElementById('createRuleForm');
    const formData = new FormData(form);
    
    // Collect conditions
    const conditions = [];
    const conditionRows = document.querySelectorAll('.condition-row');
    conditionRows.forEach(row => {
        const field = row.querySelector('.condition-field').value;
        const operator = row.querySelector('.condition-operator').value;
        const value = row.querySelector('.condition-value').value;
        
        if (field && operator && value) {
            conditions.push({ field, operator, value });
        }
    });
    
    // Collect actions
    const actions = [];
    const actionRows = document.querySelectorAll('.action-row');
    actionRows.forEach(row => {
        const type = row.querySelector('.action-type').value;
        const value = row.querySelector('.action-value').value;
        
        if (type && value) {
            actions.push({ type, value });
        }
    });
    
    if (conditions.length === 0) {
        alert('At least one condition is required');
        return;
    }
    
    if (actions.length === 0) {
        alert('At least one action is required');
        return;
    }
    
    const rule = {
        id: Date.now().toString(),
        name: formData.get('name'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        enabled: formData.get('enabled') === 'on',
        interval: parseInt(formData.get('interval')) || 60,
        chambers: Array.from(document.getElementById('ruleChambers').selectedOptions).map(o => o.value),
        conditions: conditions,
        conditionLogic: document.getElementById('conditionLogic').value,
        actions: actions,
        createdAt: new Date().toISOString(),
        executionCount: 0,
        lastExecution: null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/automation/rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
        });
        
        if (response.ok) {
            automationRules.push(rule);
            renderRules();
            closeCreateRuleModal();
            updateEngineStatus();
            alert(`✅ Rule "${rule.name}" created successfully!`);
        } else {
            alert('Failed to create rule. Please try again.');
        }
    } catch (error) {
        console.error('Error creating rule:', error);
        alert('Network error. Please check your connection.');
    }
}

// Rule execution engine
function startRuleEngine() {
    if (executionInterval) {
        clearInterval(executionInterval);
    }
    
    // Execute rules every 30 seconds
    executionInterval = setInterval(executeAllRules, 30000);
    console.log('🤖 Automation engine started');
}

// Execute all active rules
async function executeAllRules() {
    if (engineStatus !== 'ACTIVE') return;
    
    console.log('🔄 Executing automation rules...');
    
    for (const rule of automationRules) {
        if (rule.enabled) {
            await executeRule(rule);
        }
    }
    
    updateEngineStatus();
}

// Execute individual rule
async function executeRule(rule) {
    try {
        // Get current chamber data
        const chambersResponse = await fetch(`${API_BASE_URL}/environments/`);
        const chambers = await chambersResponse.json();
        
        // Filter chambers based on rule settings
        let targetChambers = chambers;
        if (rule.chambers && !rule.chambers.includes('all')) {
            targetChambers = chambers.filter(c => rule.chambers.includes(c.id.toString()));
        }
        
        for (const chamber of targetChambers) {
            if (await evaluateConditions(rule.conditions, rule.conditionLogic, chamber)) {
                await executeActions(rule.actions, chamber);
                rule.executionCount = (rule.executionCount || 0) + 1;
                rule.lastExecution = new Date().toISOString();
                
                logExecution('info', `Rule "${rule.name}" executed for chamber ${chamber.name}`);
            }
        }
    } catch (error) {
        console.error(`Error executing rule ${rule.name}:`, error);
        logExecution('error', `Failed to execute rule "${rule.name}": ${error.message}`);
    }
}

// Evaluate rule conditions
async function evaluateConditions(conditions, logic, chamber) {
    const results = [];
    
    for (const condition of conditions) {
        const result = await evaluateCondition(condition, chamber);
        results.push(result);
    }
    
    if (logic === 'and') {
        return results.every(r => r);
    } else {
        return results.some(r => r);
    }
}

// Evaluate single condition
async function evaluateCondition(condition, chamber) {
    let actualValue;
    
    switch (condition.field) {
        case 'temperature':
            actualValue = chamber.temperature;
            break;
        case 'humidity':
            actualValue = chamber.humidity;
            break;
        case 'co2':
            actualValue = chamber.co2;
            break;
        case 'species':
            actualValue = chamber.species_id;
            break;
        case 'phase':
            actualValue = chamber.current_phase;
            break;
        case 'chamber':
            actualValue = chamber.id;
            break;
        case 'time':
            actualValue = new Date().getHours();
            break;
        default:
            return false;
    }
    
    const expectedValue = parseFloat(condition.value) || condition.value;
    
    switch (condition.operator) {
        case 'equals':
            return actualValue == expectedValue;
        case 'not_equals':
            return actualValue != expectedValue;
        case 'greater_than':
            return parseFloat(actualValue) > parseFloat(expectedValue);
        case 'less_than':
            return parseFloat(actualValue) < parseFloat(expectedValue);
        case 'greater_equal':
            return parseFloat(actualValue) >= parseFloat(expectedValue);
        case 'less_equal':
            return parseFloat(actualValue) <= parseFloat(expectedValue);
        case 'contains':
            return actualValue.toString().includes(expectedValue.toString());
        default:
            return false;
    }
}

// Execute rule actions
async function executeActions(actions, chamber) {
    for (const action of actions) {
        await executeAction(action, chamber);
    }
}

// Execute single action
async function executeAction(action, chamber) {
    try {
        switch (action.type) {
            case 'set_temperature':
                await updateChamberParameter(chamber.id, 'temperature', parseFloat(action.value));
                break;
            case 'set_humidity':
                await updateChamberParameter(chamber.id, 'humidity', parseFloat(action.value));
                break;
            case 'set_co2':
                await updateChamberParameter(chamber.id, 'co2', parseFloat(action.value));
                break;
            case 'send_alert':
                await sendAlert(action.value, chamber);
                break;
            case 'change_phase':
                await updateChamberParameter(chamber.id, 'current_phase', action.value);
                break;
            case 'turn_on_device':
                await controlDevice(chamber.id, action.value, 'on');
                break;
            case 'turn_off_device':
                await controlDevice(chamber.id, action.value, 'off');
                break;
            case 'wait':
                await new Promise(resolve => setTimeout(resolve, parseInt(action.value) * 1000));
                break;
        }
    } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        logExecution('error', `Failed to execute action ${action.type}: ${error.message}`);
    }
}

// Update chamber parameter
async function updateChamberParameter(chamberId, parameter, value) {
    const response = await fetch(`${API_BASE_URL}/environments/${chamberId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [parameter]: value })
    });
    
    if (response.ok) {
        logExecution('info', `Updated ${parameter} to ${value} for chamber ${chamberId}`);
    }
}

// Send alert
async function sendAlert(message, chamber) {
    const alert = {
        message: message,
        chamber: chamber.name,
        timestamp: new Date().toISOString(),
        level: 'warning'
    };
    
    // In a real system, this would send email/SMS/webhook
    console.log('🚨 ALERT:', alert);
    logExecution('warning', `Alert sent: ${message} (Chamber: ${chamber.name})`);
}

// Control device
async function controlDevice(chamberId, device, action) {
    // In a real system, this would control actual hardware
    console.log(`🔌 Device Control: ${device} ${action} for chamber ${chamberId}`);
    logExecution('info', `Device ${device} turned ${action} for chamber ${chamberId}`);
}

// Log execution
function logExecution(level, message) {
    const entry = {
        timestamp: new Date().toISOString(),
        level: level,
        message: message
    };
    
    executionLog.unshift(entry);
    
    // Keep only last 100 log entries
    if (executionLog.length > 100) {
        executionLog = executionLog.slice(0, 100);
    }
}

// Update engine status
function updateEngineStatus() {
    const activeRules = automationRules.filter(r => r.enabled).length;
    const totalExecutions = automationRules.reduce((sum, r) => sum + (r.executionCount || 0), 0);
    const lastExecution = automationRules.reduce((latest, r) => {
        if (r.lastExecution && (!latest || r.lastExecution > latest)) {
            return r.lastExecution;
        }
        return latest;
    }, null);
    
    document.getElementById('activeRules').textContent = activeRules;
    document.getElementById('rulesExecuted').textContent = totalExecutions;
    document.getElementById('lastExecution').textContent = lastExecution ? 
        new Date(lastExecution).toLocaleString() : 'Never';
}

// Load chamber options for rule builder
async function loadChamberOptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/environments/`);
        const chambers = await response.json();
        
        const select = document.getElementById('ruleChambers');
        if (select) {
            select.innerHTML = '<option value="all">All Chambers</option>' +
                chambers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load chambers:', error);
    }
}

// Create rule from template
function createFromTemplate(templateId) {
    showCreateRuleModal();
    
    // Pre-fill form based on template
    const templates = {
        'humidity-control': {
            name: 'Humidity Control',
            description: 'Maintain optimal humidity levels',
            conditions: [{ field: 'humidity', operator: 'less_than', value: '85' }],
            actions: [{ type: 'set_humidity', value: '90' }]
        },
        'temperature-regulation': {
            name: 'Temperature Regulation',
            description: 'Maintain optimal temperature range',
            conditions: [{ field: 'temperature', operator: 'less_than', value: '18' }],
            actions: [{ type: 'set_temperature', value: '21' }]
        }
        // Add more templates as needed
    };
    
    const template = templates[templateId];
    if (template) {
        document.getElementById('ruleName').value = template.name;
        document.getElementById('ruleDescription').value = template.description;
        // Additional template logic would go here
    }
}

// Global function exports
window.showCreateRuleModal = showCreateRuleModal;
window.closeCreateRuleModal = closeCreateRuleModal;
window.addCondition = addCondition;
window.removeCondition = removeCondition;
window.addAction = addAction;
window.removeAction = removeAction;
window.createRule = createRule;
window.createFromTemplate = createFromTemplate;
window.refreshRules = loadRules;
window.testAllRules = executeAllRules;

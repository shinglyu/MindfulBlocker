let blockedDomains = [];
let settings = {};

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Add domain button
    document.getElementById('add-domain-btn').addEventListener('click', addDomain);
    
    // Allow Enter key to add domain
    document.getElementById('new-domain').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addDomain();
        }
    });
    
    // Save settings button
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // Toggle emergency code visibility
    document.getElementById('toggle-code-btn').addEventListener('click', toggleEmergencyCode);
    
    // Copy code on click
    document.getElementById('emergency-code').addEventListener('click', copyEmergencyCode);
});

async function loadData() {
    // Load blocked domains
    chrome.runtime.sendMessage({ action: 'getBlockedDomains' }, function(response) {
        if (chrome.runtime.lastError) {
            showError('Failed to load blocked domains. Please reload the extension.');
            console.error('Runtime error:', chrome.runtime.lastError);
            return;
        }
        blockedDomains = response.blockedDomains || [];
        renderDomainList();
    });
    
    // Load settings
    chrome.runtime.sendMessage({ action: 'getSettings' }, function(response) {
        if (chrome.runtime.lastError) {
            showError('Failed to load settings. Please reload the extension.');
            console.error('Runtime error:', chrome.runtime.lastError);
            return;
        }
        settings = response.settings || {};
        document.getElementById('default-minutes').value = settings.defaultMinutes || 5;
        document.getElementById('cooldown-minutes').value = settings.cooldownMinutes || 30;
        // Use textContent to prevent XSS
        document.getElementById('emergency-code').textContent = settings.emergencyCode || 'N/A';
    });
}

function renderDomainList() {
    const domainList = document.getElementById('domain-list');
    
    if (blockedDomains.length === 0) {
        domainList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No blocked domains yet</div>';
        return;
    }
    
    domainList.innerHTML = '';
    
    blockedDomains.forEach((domain, index) => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';
        
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.className = 'domain-toggle';
        toggle.checked = domain.enabled;
        toggle.addEventListener('change', function() {
            toggleDomain(index, this.checked);
        });
        
        const name = document.createElement('span');
        name.className = 'domain-name';
        name.textContent = domain.pattern; // Use textContent to prevent XSS
        if (!domain.enabled) {
            name.style.textDecoration = 'line-through';
            name.style.color = '#999';
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'domain-remove';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove domain';
        removeBtn.addEventListener('click', function() {
            removeDomain(index);
        });
        
        domainItem.appendChild(toggle);
        domainItem.appendChild(name);
        domainItem.appendChild(removeBtn);
        
        domainList.appendChild(domainItem);
    });
}

function addDomain() {
    const input = document.getElementById('new-domain');
    const pattern = input.value.trim();
    
    if (!pattern) {
        showError('Please enter a domain pattern');
        return;
    }
    
    // Basic validation
    if (!pattern.includes('.')) {
        showError('Invalid domain pattern. Must include a dot (e.g., facebook.com or *.twitter.com)');
        return;
    }
    
    // Validate wildcard pattern
    if (pattern.startsWith('*.') && pattern.length < 4) {
        showError('Invalid wildcard pattern. Format: *.example.com');
        return;
    }
    
    // Check for duplicates
    const exists = blockedDomains.some(d => d.pattern === pattern);
    if (exists) {
        showError('This domain is already in the list');
        return;
    }
    
    blockedDomains.push({
        pattern: pattern,
        enabled: true
    });
    
    saveBlockedDomains();
    input.value = '';
}

function toggleDomain(index, enabled) {
    blockedDomains[index].enabled = enabled;
    saveBlockedDomains();
}

function removeDomain(index) {
    showConfirmDialog(
        `Remove ${blockedDomains[index].pattern} from blocked list?`,
        function() {
            blockedDomains.splice(index, 1);
            saveBlockedDomains();
        }
    );
}

function saveBlockedDomains() {
    chrome.runtime.sendMessage({
        action: 'updateBlockedDomains',
        blockedDomains: blockedDomains
    }, function(response) {
        if (chrome.runtime.lastError) {
            showError('Failed to save blocked domains. Please try again.');
            console.error('Runtime error:', chrome.runtime.lastError);
            return;
        }
        if (response && response.success) {
            renderDomainList();
        } else {
            showError('Failed to save blocked domains. Please try again.');
        }
    });
}

function saveSettings() {
    const defaultMinutes = parseInt(document.getElementById('default-minutes').value);
    const cooldownMinutes = parseInt(document.getElementById('cooldown-minutes').value);
    
    if (!defaultMinutes || defaultMinutes < 1 || defaultMinutes > 1440) {
        showError('Please enter a valid default duration (1-1440 minutes)');
        return;
    }
    
    if (!cooldownMinutes || cooldownMinutes < 1 || cooldownMinutes > 1440) {
        showError('Please enter a valid cooldown period (1-1440 minutes)');
        return;
    }
    
    settings.defaultMinutes = defaultMinutes;
    settings.cooldownMinutes = cooldownMinutes;
    
    chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: settings
    }, function(response) {
        if (chrome.runtime.lastError) {
            showError('Failed to save settings. Please try again.');
            console.error('Runtime error:', chrome.runtime.lastError);
            return;
        }
        if (response && response.success) {
            const btn = document.getElementById('save-settings-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } else {
            showError('Failed to save settings. Please try again.');
        }
    });
}

function toggleEmergencyCode() {
    const codeDisplay = document.getElementById('emergency-code');
    const toggleBtn = document.getElementById('toggle-code-btn');
    
    if (codeDisplay.classList.contains('hidden')) {
        codeDisplay.classList.remove('hidden');
        toggleBtn.textContent = 'Hide Code';
    } else {
        codeDisplay.classList.add('hidden');
        toggleBtn.textContent = 'Show Code';
    }
}

function copyEmergencyCode() {
    const code = settings.emergencyCode;
    if (!code) return;
    
    navigator.clipboard.writeText(code).then(() => {
        const codeDisplay = document.getElementById('emergency-code');
        const originalText = codeDisplay.textContent;
        codeDisplay.textContent = 'Copied!';
        setTimeout(() => {
            codeDisplay.textContent = originalText;
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy code:', err);
        showError('Failed to copy code to clipboard');
    });
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = 'background-color: #fee; border: 1px solid #c33; color: #c33; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 13px;';
        document.querySelector('.popup-container').insertBefore(errorDiv, document.querySelector('.popup-container').firstChild);
    }
    errorDiv.textContent = message; // Use textContent to prevent XSS
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Show confirmation dialog with custom UI
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when user confirms
 */
function showConfirmDialog(message, onConfirm) {
    let overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; padding: 20px; border-radius: 8px; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        
        const messageEl = document.createElement('p');
        messageEl.id = 'confirm-message';
        messageEl.style.cssText = 'margin: 0 0 20px 0; font-size: 14px;';
        dialog.appendChild(messageEl);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;';
        cancelBtn.onclick = () => overlay.remove();
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.cssText = 'padding: 8px 16px; border: none; background: #dc3545; color: white; border-radius: 4px; cursor: pointer;';
        confirmBtn.onclick = () => {
            overlay.remove();
            onConfirm();
        };
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        dialog.appendChild(buttonContainer);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }
    
    document.getElementById('confirm-message').textContent = message; // Use textContent to prevent XSS
}

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
        blockedDomains = response.blockedDomains || [];
        renderDomainList();
    });
    
    // Load settings
    chrome.runtime.sendMessage({ action: 'getSettings' }, function(response) {
        settings = response.settings || {};
        document.getElementById('default-minutes').value = settings.defaultMinutes || 5;
        document.getElementById('cooldown-minutes').value = settings.cooldownMinutes || 30;
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
        name.textContent = domain.pattern;
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
        alert('Please enter a domain pattern');
        return;
    }
    
    // Basic validation
    if (!pattern.includes('.')) {
        alert('Invalid domain pattern. Must include a dot (e.g., facebook.com or *.twitter.com)');
        return;
    }
    
    // Check for duplicates
    const exists = blockedDomains.some(d => d.pattern === pattern);
    if (exists) {
        alert('This domain is already in the list');
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
    if (confirm(`Remove ${blockedDomains[index].pattern} from blocked list?`)) {
        blockedDomains.splice(index, 1);
        saveBlockedDomains();
    }
}

function saveBlockedDomains() {
    chrome.runtime.sendMessage({
        action: 'updateBlockedDomains',
        blockedDomains: blockedDomains
    }, function(response) {
        if (response.success) {
            renderDomainList();
        }
    });
}

function saveSettings() {
    const defaultMinutes = parseInt(document.getElementById('default-minutes').value);
    const cooldownMinutes = parseInt(document.getElementById('cooldown-minutes').value);
    
    if (!defaultMinutes || defaultMinutes < 1) {
        alert('Please enter a valid default duration');
        return;
    }
    
    if (!cooldownMinutes || cooldownMinutes < 1) {
        alert('Please enter a valid cooldown period');
        return;
    }
    
    settings.defaultMinutes = defaultMinutes;
    settings.cooldownMinutes = cooldownMinutes;
    
    chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: settings
    }, function(response) {
        if (response.success) {
            const btn = document.getElementById('save-settings-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
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
    });
}

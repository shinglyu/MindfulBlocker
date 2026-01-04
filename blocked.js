document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    
    // Validate URL parameter
    if (!url) {
        showError('Invalid URL parameter');
        return;
    }
    
    const domain = extractDomain(url);
    
    // Use textContent to prevent XSS
    document.getElementById('domain').textContent = domain;
    
    let countdownInterval = null;
    
    // Check permission status and start countdown
    checkPermissionStatus();
    
    // Emergency override UI
    const showEmergencyBtn = document.getElementById('show-emergency');
    const emergencyForm = document.getElementById('emergency-form');
    const cancelEmergencyBtn = document.getElementById('cancel-emergency');
    const submitEmergencyBtn = document.getElementById('submit-emergency');
    const emergencyCodeInput = document.getElementById('emergency-code');
    const errorMessage = document.getElementById('error-message');
    
    showEmergencyBtn.addEventListener('click', function() {
        emergencyForm.classList.remove('hidden');
        showEmergencyBtn.classList.add('hidden');
        emergencyCodeInput.focus();
    });
    
    cancelEmergencyBtn.addEventListener('click', function() {
        emergencyForm.classList.add('hidden');
        showEmergencyBtn.classList.remove('hidden');
        emergencyCodeInput.value = '';
        errorMessage.classList.add('hidden');
    });
    
    submitEmergencyBtn.addEventListener('click', function() {
        const code = emergencyCodeInput.value.trim();
        
        if (!code) {
            showError('Please enter the emergency code');
            return;
        }
        
        submitEmergencyBtn.disabled = true;
        submitEmergencyBtn.textContent = 'Verifying...';
        
        chrome.runtime.sendMessage({
            action: 'checkEmergencyCode',
            code: code,
            domain: domain,
            url: url
        }, function(response) {
            if (chrome.runtime.lastError) {
                submitEmergencyBtn.disabled = false;
                submitEmergencyBtn.textContent = 'Submit Override';
                showError('Communication error. Please reload the page and try again.');
                console.error('Runtime error:', chrome.runtime.lastError);
                return;
            }
            
            submitEmergencyBtn.disabled = false;
            submitEmergencyBtn.textContent = 'Submit Override';
            
            if (response && response.success) {
                // Redirect to original URL
                window.location.href = url;
            } else {
                showError(response.error || 'Invalid emergency code');
                emergencyCodeInput.value = '';
                emergencyCodeInput.focus();
            }
        });
    });
    
    // Allow Enter key to submit
    emergencyCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitEmergencyBtn.click();
        }
    });
    
    // Open settings
    document.getElementById('open-settings').addEventListener('click', function(e) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
    
    function checkPermissionStatus() {
        chrome.runtime.sendMessage({
            action: 'checkPermissionStatus',
            domain: domain
        }, function(response) {
            if (chrome.runtime.lastError) {
                showError('Communication error. Please reload the page.');
                console.error('Runtime error:', chrome.runtime.lastError);
                return;
            }
            
            if (response && response.status === 'cooldown') {
                startCountdown(response.cooldownUntil);
            } else {
                // No longer in cooldown, redirect to justify page
                window.location.href = `justify.html?url=${encodeURIComponent(url)}`;
            }
        });
    }
    
    function startCountdown(cooldownUntil) {
        function updateCountdown() {
            const now = Date.now();
            const remaining = cooldownUntil - now;
            
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                document.getElementById('countdown').textContent = 'Cooldown expired';
                // Redirect to justify page
                setTimeout(() => {
                    window.location.href = `justify.html?url=${encodeURIComponent(url)}`;
                }, 1000);
                return;
            }
            
            document.getElementById('countdown').textContent = formatTime(remaining);
        }
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }
    
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Display error message to user
     * @param {string} message - Error message to display
     */
    function showError(message) {
        errorMessage.textContent = message; // Use textContent to prevent XSS
        errorMessage.classList.remove('hidden');
    }
    
    /**
     * Extract domain from URL
     * @param {string} url - URL to extract domain from
     * @returns {string} Hostname or sanitized URL
     */
    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }
});

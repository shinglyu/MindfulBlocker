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
        // Round up to nearest minute to avoid showing seconds ticking down
        const minutes = Math.ceil((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            // If we have hours and minutes rounded up to 60, add an hour
            if (minutes === 60) {
                return `${hours + 1}h`;
            }
            // If exactly on the hour, just show hours
            if (minutes === 0) {
                return `${hours}h`;
            }
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            // Less than a minute remaining
            return 'Less than a minute';
        }
    }
    
    /**
     * Display error message to user
     * @param {string} message - Error message to display
     */
    function showError(message) {
        const errorMessage = document.getElementById('error-message');
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
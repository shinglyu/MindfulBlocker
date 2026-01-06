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
    
    // Record this access attempt and get attempt stats
    recordAndDisplayAttempts();
    
    // Check permission status and start countdown
    checkPermissionStatus();
    
    // Open settings
    document.getElementById('open-settings').addEventListener('click', function(e) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
    
    /**
     * Record this access attempt and display attempt statistics
     */
    function recordAndDisplayAttempts() {
        // First record the attempt
        chrome.runtime.sendMessage({
            action: 'recordAccessAttempt',
            domain: domain
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error recording attempt:', chrome.runtime.lastError);
                return;
            }
            
            // Now get and display the attempt stats
            displayAttemptStats(response.count, response.lastAttempt);
        });
    }
    
    /**
     * Display attempt statistics
     * @param {number} count - Number of attempts today
     * @param {number} lastAttempt - Timestamp of last attempt
     */
    function displayAttemptStats(count, lastAttempt) {
        const attemptCountEl = document.getElementById('attempt-count');
        const lastAttemptEl = document.getElementById('last-attempt');
        
        if (count > 0) {
            attemptCountEl.textContent = `You have tried to access this site ${count} time${count !== 1 ? 's' : ''} today.`;
            
            if (lastAttempt) {
                const timeAgo = formatTimeAgo(lastAttempt);
                lastAttemptEl.textContent = `Last attempt: ${timeAgo}`;
            }
        }
    }
    
    /**
     * Format a timestamp as a relative time string
     * @param {number} timestamp - The timestamp to format
     * @returns {string} Relative time string (e.g., "5 minutes ago")
     */
    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else {
            return 'just now';
        }
    }
    
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
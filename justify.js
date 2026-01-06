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
    
    const form = document.getElementById('form');
    const customMinutesInput = document.getElementById('custom-minutes');
    const customRadio = document.getElementById('custom');
    const submitButton = form.querySelector('button[type="submit"]');
    const blockImmediatelyBtn = document.getElementById('block-immediately-btn');
    
    // Breathing exercise elements
    const breathingOverlay = document.getElementById('breathing-overlay');
    const breathingCircle = document.getElementById('breathing-circle');
    const breathingText = document.getElementById('breathing-text');
    const breathingProgressBar = document.getElementById('breathing-progress-bar');
    const breathingCyclesText = document.getElementById('breathing-cycles');
    
    // Start breathing exercise
    startBreathingExercise();

    // Record this access attempt and get attempt stats
    recordAndDisplayAttempts();

    // Enable/disable custom minutes input
    customRadio.addEventListener('change', function() {
        customMinutesInput.disabled = !this.checked;
        if (this.checked) {
            customMinutesInput.focus();
        }
    });
    
    // Also enable custom input when clicking on it
    customMinutesInput.addEventListener('focus', function() {
        customRadio.checked = true;
        customMinutesInput.disabled = false;
    });
    
    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const justification = document.getElementById('justification').value.trim();
        const maxLength = 500; // Limit justification length
        
        if (!justification) {
            showError('Please provide a justification for accessing this site.');
            return;
        }
        
        if (justification.length > maxLength) {
            showError(`Justification is too long (maximum ${maxLength} characters).`);
            return;
        }
        
        let minutes;
        const selectedType = document.querySelector('input[name="time"]:checked').value;
        
        if (selectedType === 'custom') {
            minutes = parseInt(customMinutesInput.value);
            if (!minutes || minutes < 1 || minutes > 1440) { // Max 24 hours
                showError('Please enter a valid number of minutes (1-1440).');
                customMinutesInput.focus();
                return;
            }
        } else {
            minutes = parseInt(selectedType);
        }
        
        // Disable submit button to prevent double submission
        submitButton.disabled = true;
        submitButton.textContent = 'Granting Access...';
        
        chrome.runtime.sendMessage({
            action: 'savePermission',
            domain: domain,
            justification: justification,
            minutes: minutes
        }, function(response) {
            if (chrome.runtime.lastError) {
                submitButton.disabled = false;
                submitButton.textContent = 'Grant Access';
                showError('Communication error. Please reload the page and try again.');
                console.error('Runtime error:', chrome.runtime.lastError);
                return;
            }
            
            if (response && response.success) {
                // Redirect to the original URL
                window.location.href = url;
            } else {
                submitButton.disabled = false;
                submitButton.textContent = 'Grant Access';
                showError(response.error || 'Failed to grant access. Please try again.');
            }
        });
    });
    
    // Handle "Block Immediately" button
    blockImmediatelyBtn.addEventListener('click', function() {
        // Close the current tab and return to previous page
        window.close();
    });
    
    /**
     * Start the breathing exercise before showing the justification form
     * 4-4-4-4 breathing: inhale 4, hold 4, exhale 4, hold 4 (single cycle)
     */
    function startBreathingExercise() {
        const INHALE_DURATION = 4000; // 4 seconds
        const HOLD_IN_DURATION = 4000; // 4 seconds
        const EXHALE_DURATION = 4000; // 4 seconds
        const HOLD_OUT_DURATION = 4000; // 4 seconds
        const TOTAL_DURATION = INHALE_DURATION + HOLD_IN_DURATION + EXHALE_DURATION + HOLD_OUT_DURATION;

        let startTime = Date.now();

        // Update breathing animation
        function updateBreathing() {
            const elapsed = Date.now() - startTime;

            if (elapsed >= TOTAL_DURATION) {
                completeBreathingExercise();
                return;
            }

            // Update progress bar
            const progress = (elapsed / TOTAL_DURATION) * 100;
            breathingProgressBar.style.width = `${Math.min(progress, 100)}%`;

            // Determine current phase
            if (elapsed < INHALE_DURATION) {
                // Inhale phase
                breathingCircle.classList.remove('hold-in', 'exhale', 'hold-out');
                breathingCircle.classList.add('inhale');
                breathingText.textContent = 'Inhale';
                breathingCyclesText.textContent = 'Breathing Exercise';
            } else if (elapsed < INHALE_DURATION + HOLD_IN_DURATION) {
                // Hold in phase
                breathingCircle.classList.remove('inhale', 'exhale', 'hold-out');
                breathingCircle.classList.add('hold-in');
                breathingText.textContent = 'Hold';
                breathingCyclesText.textContent = 'Breathing Exercise';
            } else if (elapsed < INHALE_DURATION + HOLD_IN_DURATION + EXHALE_DURATION) {
                // Exhale phase
                breathingCircle.classList.remove('inhale', 'hold-in', 'hold-out');
                breathingCircle.classList.add('exhale');
                breathingText.textContent = 'Exhale';
                breathingCyclesText.textContent = 'Breathing Exercise';
            } else {
                // Hold out phase
                breathingCircle.classList.remove('inhale', 'hold-in', 'exhale');
                breathingCircle.classList.add('hold-out');
                breathingText.textContent = 'Hold';
                breathingCyclesText.textContent = 'Breathing Exercise';
            }

            requestAnimationFrame(updateBreathing);
        }

        // Start the animation
        breathingCircle.classList.add('inhale');
        breathingText.textContent = 'Inhale';
        breathingCyclesText.textContent = 'Breathing Exercise';
        requestAnimationFrame(updateBreathing);
    }
    
    /**
     * Complete the breathing exercise and show the form
     */
    function completeBreathingExercise() {
        // Hide the breathing overlay
        breathingOverlay.classList.add('hidden');
        
        // Show the form
        form.classList.remove('hidden');
        
        // Focus on justification textarea
        setTimeout(() => {
            document.getElementById('justification').focus();
        }, 500);
    }
    
    /**
     * Display error message to user
     * @param {string} message - Error message to display
     */
    function showError(message) {
        // Create or update error message element
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'background-color: #fee; border: 1px solid #c33; color: #c33; padding: 12px; margin: 16px 0; border-radius: 4px;';
            form.insertBefore(errorDiv, form.firstChild);
        }
        errorDiv.textContent = message; // Use textContent to prevent XSS
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
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
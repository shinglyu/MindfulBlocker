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
     * 4 seconds inhale, 4 seconds exhale, 3 cycles
     */
    function startBreathingExercise() {
        const INHALE_DURATION = 4000; // 4 seconds
        const EXHALE_DURATION = 4000; // 4 seconds
        const TOTAL_CYCLES = 3;
        const CYCLE_DURATION = INHALE_DURATION + EXHALE_DURATION;
        const TOTAL_DURATION = CYCLE_DURATION * TOTAL_CYCLES;
        
        let currentCycle = 1;
        let isInhaling = true;
        let startTime = Date.now();
        
        // Update breathing animation
        function updateBreathing() {
            const elapsed = Date.now() - startTime;
            const cycleElapsed = elapsed % CYCLE_DURATION;
            
            // Determine current cycle
            currentCycle = Math.floor(elapsed / CYCLE_DURATION) + 1;
            if (currentCycle > TOTAL_CYCLES) {
                completeBreathingExercise();
                return;
            }
            
            // Update cycle text
            breathingCyclesText.textContent = `Breath ${currentCycle} of ${TOTAL_CYCLES}`;
            
            // Update progress bar
            const progress = (elapsed / TOTAL_DURATION) * 100;
            breathingProgressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Determine if inhaling or exhaling
            if (cycleElapsed < INHALE_DURATION) {
                if (!isInhaling) {
                    isInhaling = true;
                    breathingCircle.classList.remove('exhale');
                    breathingCircle.classList.add('inhale');
                    breathingText.textContent = 'Inhale';
                }
            } else {
                if (isInhaling) {
                    isInhaling = false;
                    breathingCircle.classList.remove('inhale');
                    breathingCircle.classList.add('exhale');
                    breathingText.textContent = 'Exhale';
                }
            }
            
            requestAnimationFrame(updateBreathing);
        }
        
        // Start the animation
        breathingCircle.classList.add('inhale');
        breathingText.textContent = 'Inhale';
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
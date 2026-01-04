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
    
    // Auto-focus justification textarea
    document.getElementById('justification').focus();
    
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

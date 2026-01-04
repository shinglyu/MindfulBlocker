document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    const domain = extractDomain(url);
    
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
        
        if (!justification) {
            alert('Please provide a justification for accessing this site.');
            return;
        }
        
        let minutes;
        const selectedType = document.querySelector('input[name="time"]:checked').value;
        
        if (selectedType === 'custom') {
            minutes = parseInt(customMinutesInput.value);
            if (!minutes || minutes < 1) {
                alert('Please enter a valid number of minutes.');
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
            if (response && response.success) {
                // Redirect to the original URL
                window.location.href = url;
            } else {
                submitButton.disabled = false;
                submitButton.textContent = 'Grant Access';
                alert('Failed to grant access. Please try again.');
            }
        });
    });
    
    // Auto-focus justification textarea
    document.getElementById('justification').focus();
    
    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }
});

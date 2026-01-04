document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    const domain = extractDomain(url);
    
    document.getElementById('domain').textContent = domain;
    
    const form = document.getElementById('form');
    const customMinutesInput = document.getElementById('custom-minutes');
    const customRadio = document.getElementById('custom');
    
    customRadio.addEventListener('change', function() {
        customMinutesInput.disabled = !this.checked;
    });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const justification = document.getElementById('justification').value;
        let minutes;
        
        const selectedType = document.querySelector('input[name="time"]:checked').value;
        if (selectedType === 'custom') {
            minutes = parseInt(customMinutesInput.value);
        } else {
            minutes = parseInt(selectedType);
        }
        
        chrome.runtime.sendMessage({
            action: 'savePermission',
            domain: domain,
            justification: justification,
            minutes: minutes
        }, function(response) {
            window.close();
        });
    });
    
    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }
});

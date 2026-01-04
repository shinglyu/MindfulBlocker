let usageLogs = [];

document.addEventListener('DOMContentLoaded', function() {
    loadUsageData();
});

function loadUsageData() {
    chrome.runtime.sendMessage({ action: 'getUsageLogs' }, function(response) {
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            showError('Failed to load usage data. Please reload the page.');
            return;
        }
        usageLogs = response.usageLogs || [];
        renderDashboard();
    });
}

function renderDashboard() {
    calculateStats();
    renderFrequencyChart();
    renderHistoryTable();
}

function calculateStats() {
    const totalSessions = usageLogs.length;
    const totalTime = usageLogs.reduce((sum, log) => sum + log.duration, 0);
    
    // Calculate most accessed domain
    const domainCounts = {};
    usageLogs.forEach(log => {
        domainCounts[log.domain] = (domainCounts[log.domain] || 0) + 1;
    });
    
    let mostAccessed = '-';
    let maxCount = 0;
    for (const [domain, count] of Object.entries(domainCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostAccessed = domain;
        }
    }
    
    // Update UI with textContent to prevent XSS
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('total-time').textContent = formatMinutes(totalTime);
    document.getElementById('most-accessed').textContent = mostAccessed;
}

function renderFrequencyChart() {
    const chartContainer = document.getElementById('frequency-chart');
    
    if (usageLogs.length === 0) {
        chartContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div>No usage data yet</div>
                <div style="font-size: 14px; margin-top: 8px;">Start using blocked sites to see your patterns here</div>
            </div>
        `;
        return;
    }
    
    // Aggregate data by domain
    const domainData = {};
    usageLogs.forEach(log => {
        if (!domainData[log.domain]) {
            domainData[log.domain] = {
                count: 0,
                totalTime: 0
            };
        }
        domainData[log.domain].count++;
        domainData[log.domain].totalTime += log.duration;
    });
    
    // Convert to array and sort by count
    const sortedDomains = Object.entries(domainData)
        .map(([domain, data]) => ({ domain, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 domains
    
    if (sortedDomains.length === 0) {
        chartContainer.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }
    
    // Find max count for scaling
    const maxCount = Math.max(...sortedDomains.map(d => d.count));
    
    // Create bar chart
    const barChart = document.createElement('div');
    barChart.className = 'bar-chart';
    
    sortedDomains.forEach(item => {
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        
        const height = (item.count / maxCount) * 100;
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${height}%`;
        // Use textContent for title to prevent XSS
        bar.title = `${item.domain}: ${item.count} sessions, ${formatMinutes(item.totalTime)}`;
        
        const barValue = document.createElement('div');
        barValue.className = 'bar-value';
        barValue.textContent = item.count; // Use textContent to prevent XSS
        bar.appendChild(barValue);
        
        const barLabel = document.createElement('div');
        barLabel.className = 'bar-label';
        barLabel.textContent = item.domain; // Use textContent to prevent XSS
        
        barItem.appendChild(bar);
        barItem.appendChild(barLabel);
        barChart.appendChild(barItem);
    });
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(barChart);
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    
    if (usageLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div>No access history yet</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by most recent first
    const sortedLogs = [...usageLogs].sort((a, b) => b.grantedAt - a.grantedAt);
    
    tbody.innerHTML = '';
    
    // Show last 50 entries
    sortedLogs.slice(0, 50).forEach(log => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDateTime(log.grantedAt); // Use textContent to prevent XSS
        
        const domainCell = document.createElement('td');
        domainCell.textContent = log.domain; // Use textContent to prevent XSS
        
        const justificationCell = document.createElement('td');
        justificationCell.textContent = log.justification; // Use textContent to prevent XSS
        justificationCell.style.maxWidth = '300px';
        justificationCell.style.overflow = 'hidden';
        justificationCell.style.textOverflow = 'ellipsis';
        justificationCell.style.whiteSpace = 'nowrap';
        justificationCell.title = log.justification; // Title also safe with textContent
        
        const durationCell = document.createElement('td');
        durationCell.textContent = `${log.duration} min`; // Use textContent to prevent XSS
        
        row.appendChild(dateCell);
        row.appendChild(domainCell);
        row.appendChild(justificationCell);
        row.appendChild(durationCell);
        
        tbody.appendChild(row);
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
        errorDiv.style.cssText = 'background-color: #fee; border: 1px solid #c33; color: #c33; padding: 12px; margin: 16px; border-radius: 4px;';
        const container = document.querySelector('.dashboard-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
    errorDiv.textContent = message; // Use textContent to prevent XSS
    errorDiv.style.display = 'block';
}

function formatMinutes(minutes) {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    if (isToday) {
        return `Today ${timeStr}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${timeStr}`;
    }
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
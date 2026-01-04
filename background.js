// Flow - Background Service Worker
// Handles domain blocking, permission management, and timer tracking

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Flow extension installed');
  
  // Initialize storage with defaults
  const result = await chrome.storage.local.get(['settings', 'blockedDomains', 'permissions', 'usageLogs']);
  
  if (!result.settings) {
    const emergencyCode = generateEmergencyCode();
    await chrome.storage.local.set({
      settings: {
        defaultMinutes: 5,
        cooldownMinutes: 30,
        emergencyCode: emergencyCode
      }
    });
  }
  
  if (!result.blockedDomains) {
    await chrome.storage.local.set({
      blockedDomains: [
        { pattern: 'facebook.com', enabled: true }
      ]
    });
  }
  
  if (!result.permissions) {
    await chrome.storage.local.set({ permissions: {} });
  }
  
  if (!result.usageLogs) {
    await chrome.storage.local.set({ usageLogs: [] });
  }
});

/**
 * Generate cryptographically secure 32-character emergency code
 * @returns {string} 32-character alphanumeric code
 */
function generateEmergencyCode() {
  const array = new Uint8Array(24); // 24 bytes = 32 base64 chars
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/[+/=]/g, c => ({'+':'A','/':'B','=':'C'}[c]))
    .slice(0, 32);
}

/**
 * Check if URL matches a blocked domain pattern
 * @param {string} url - The URL to check
 * @param {string} pattern - The domain pattern (supports wildcard)
 * @returns {boolean} True if URL matches pattern
 */
function matchesDomain(url, pattern) {
  try {
    const hostname = new URL(url).hostname;
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith('.' + suffix);
    }
    return hostname === pattern;
  } catch (e) {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The hostname or original URL if invalid
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

/**
 * Check if domain should be blocked and return blocking reason
 * @param {string} url - The URL to check
 * @returns {Promise<Object>} Blocking status and reason
 */
async function shouldBlockDomain(url) {
  const { blockedDomains, permissions } = await chrome.storage.local.get(['blockedDomains', 'permissions']);
  
  if (!blockedDomains || blockedDomains.length === 0) {
    return { blocked: false };
  }
  
  // Check if URL matches any blocked domain
  const matchedDomain = blockedDomains.find(d => d.enabled && matchesDomain(url, d.pattern));
  if (!matchedDomain) {
    return { blocked: false };
  }
  
  const domain = extractDomain(url);
  const permission = permissions[domain];
  const now = Date.now();
  
  // Check if in cooldown
  if (permission && permission.cooldownUntil && permission.cooldownUntil > now) {
    return { 
      blocked: true, 
      reason: 'cooldown',
      cooldownUntil: permission.cooldownUntil,
      domain: domain
    };
  }
  
  // Check if has active permission
  if (permission && permission.expiresAt && permission.expiresAt > now) {
    return { blocked: false };
  }
  
  // No permission, needs justification
  return { 
    blocked: true, 
    reason: 'no-permission',
    domain: domain
  };
}

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation
  if (details.frameId !== 0) return;
  
  const url = details.url;
  
  // Don't block extension pages
  if (url.startsWith('chrome-extension://')) return;
  
  const blockResult = await shouldBlockDomain(url);
  
  if (blockResult.blocked) {
    const extensionUrl = chrome.runtime.getURL(
      blockResult.reason === 'cooldown' 
        ? `blocked.html?url=${encodeURIComponent(url)}`
        : `justify.html?url=${encodeURIComponent(url)}`
    );
    
    chrome.tabs.update(details.tabId, { url: extensionUrl });
  }
});

// Listen for messages from content pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'savePermission') {
    handleSavePermission(message, sender, sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'checkEmergencyCode') {
    handleEmergencyCode(message, sender, sendResponse);
    return true;
  }
  
  if (message.action === 'getSettings') {
    handleGetSettings(sendResponse);
    return true;
  }
  
  if (message.action === 'updateSettings') {
    handleUpdateSettings(message, sendResponse);
    return true;
  }
  
  if (message.action === 'getBlockedDomains') {
    handleGetBlockedDomains(sendResponse);
    return true;
  }
  
  if (message.action === 'updateBlockedDomains') {
    handleUpdateBlockedDomains(message, sendResponse);
    return true;
  }
  
  if (message.action === 'getUsageLogs') {
    handleGetUsageLogs(sendResponse);
    return true;
  }
  
  if (message.action === 'checkPermissionStatus') {
    handleCheckPermissionStatus(message, sendResponse);
    return true;
  }
});

/**
 * Prune old logs to prevent unbounded storage growth
 * @param {Array} logs - Array of usage log entries
 * @returns {Array} Pruned log array
 */
function pruneOldLogs(logs) {
  const MAX_LOGS = 1000;
  const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
  const cutoffTime = Date.now() - MAX_AGE_MS;
  
  return logs
    .filter(log => log.grantedAt > cutoffTime)
    .slice(-MAX_LOGS);
}

/**
 * Handle saving permission after justification
 */
async function handleSavePermission(message, sender, sendResponse) {
  try {
    const { domain, justification, minutes } = message;
    const now = Date.now();
    const expiresAt = now + (minutes * 60 * 1000);
    const { settings } = await chrome.storage.local.get('settings');
    const cooldownUntil = expiresAt + (settings.cooldownMinutes * 60 * 1000);
    
    // Update permissions
    const { permissions } = await chrome.storage.local.get('permissions');
    permissions[domain] = {
      expiresAt: expiresAt,
      cooldownUntil: cooldownUntil
    };
    await chrome.storage.local.set({ permissions });
    
    // Log usage and prune old logs
    const { usageLogs } = await chrome.storage.local.get('usageLogs');
    const logEntry = {
      id: crypto.randomUUID(),
      domain: domain,
      justification: justification,
      grantedAt: now,
      duration: minutes,
      expiresAt: expiresAt,
      wasEmergencyOverride: false
    };
    usageLogs.push(logEntry);
    const prunedLogs = pruneOldLogs(usageLogs);
    await chrome.storage.local.set({ usageLogs: prunedLogs });
    
    // Set alarm for expiration
    chrome.alarms.create(`expire-${domain}`, { when: expiresAt });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving permission:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle emergency code verification
 */
async function handleEmergencyCode(message, sender, sendResponse) {
  try {
    const { code, domain, url } = message;
    const { settings } = await chrome.storage.local.get('settings');
    
    if (code === settings.emergencyCode) {
      // Grant permission
      const now = Date.now();
      const { permissions } = await chrome.storage.local.get('permissions');
      const expiresAt = now + (settings.defaultMinutes * 60 * 1000);
      const cooldownUntil = expiresAt + (settings.cooldownMinutes * 60 * 1000);
      
      permissions[domain] = {
        expiresAt: expiresAt,
        cooldownUntil: cooldownUntil
      };
      await chrome.storage.local.set({ permissions });
      
      // Log as emergency override and prune old logs
      const { usageLogs } = await chrome.storage.local.get('usageLogs');
      const logEntry = {
        id: crypto.randomUUID(),
        domain: domain,
        justification: 'EMERGENCY OVERRIDE',
        grantedAt: now,
        duration: settings.defaultMinutes,
        expiresAt: expiresAt,
        wasEmergencyOverride: true
      };
      usageLogs.push(logEntry);
      const prunedLogs = pruneOldLogs(usageLogs);
      await chrome.storage.local.set({ usageLogs: prunedLogs });
      
      // Set alarm
      chrome.alarms.create(`expire-${domain}`, { when: expiresAt });
      
      sendResponse({ success: true, url: url });
    } else {
      sendResponse({ success: false, error: 'Incorrect emergency code' });
    }
  } catch (error) {
    console.error('Error handling emergency code:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle get settings request
 */
async function handleGetSettings(sendResponse) {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    sendResponse({ settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({ settings: null, error: error.message });
  }
}

/**
 * Handle update settings request
 */
async function handleUpdateSettings(message, sendResponse) {
  try {
    const { settings } = message;
    await chrome.storage.local.set({ settings });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle get blocked domains request
 */
async function handleGetBlockedDomains(sendResponse) {
  try {
    const { blockedDomains } = await chrome.storage.local.get('blockedDomains');
    sendResponse({ blockedDomains });
  } catch (error) {
    console.error('Error getting blocked domains:', error);
    sendResponse({ blockedDomains: [], error: error.message });
  }
}

/**
 * Handle update blocked domains request
 */
async function handleUpdateBlockedDomains(message, sendResponse) {
  try {
    const { blockedDomains } = message;
    await chrome.storage.local.set({ blockedDomains });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error updating blocked domains:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle get usage logs request
 */
async function handleGetUsageLogs(sendResponse) {
  try {
    const { usageLogs } = await chrome.storage.local.get('usageLogs');
    sendResponse({ usageLogs: usageLogs || [] });
  } catch (error) {
    console.error('Error getting usage logs:', error);
    sendResponse({ usageLogs: [], error: error.message });
  }
}

/**
 * Handle check permission status request
 */
async function handleCheckPermissionStatus(message, sendResponse) {
  try {
    const { domain } = message;
    const { permissions } = await chrome.storage.local.get('permissions');
    const permission = permissions[domain];
    const now = Date.now();
    
    if (!permission) {
      sendResponse({ status: 'no-permission' });
      return;
    }
    
    if (permission.cooldownUntil && permission.cooldownUntil > now) {
      sendResponse({ 
        status: 'cooldown',
        cooldownUntil: permission.cooldownUntil
      });
      return;
    }
    
    if (permission.expiresAt && permission.expiresAt > now) {
      sendResponse({ 
        status: 'active',
        expiresAt: permission.expiresAt
      });
      return;
    }
    
    sendResponse({ status: 'expired' });
  } catch (error) {
    console.error('Error checking permission status:', error);
    sendResponse({ status: 'error', error: error.message });
  }
}

/**
 * Handle alarm events (timer expirations)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('expire-')) {
    const domain = alarm.name.replace('expire-', '');
    console.log(`Permission expired for: ${domain}`);
    
    // Optional: Close tabs accessing the expired domain
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && matchesDomain(tab.url, domain)) {
          const blockUrl = chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(tab.url)}`);
          await chrome.tabs.update(tab.id, { url: blockUrl });
        }
      }
    } catch (error) {
      console.error('Error handling expired permission:', error);
    }
  }
});

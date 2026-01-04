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

// Generate random 32-character emergency code
function generateEmergencyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if URL matches a blocked domain pattern
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

// Extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Check if domain should be blocked
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

// Handle saving permission after justification
async function handleSavePermission(message, sender, sendResponse) {
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
  
  // Log usage
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
  await chrome.storage.local.set({ usageLogs });
  
  // Set alarm for expiration
  chrome.alarms.create(`expire-${domain}`, { when: expiresAt });
  
  sendResponse({ success: true });
}

// Handle emergency code verification
async function handleEmergencyCode(message, sender, sendResponse) {
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
    
    // Log as emergency override
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
    await chrome.storage.local.set({ usageLogs });
    
    // Set alarm
    chrome.alarms.create(`expire-${domain}`, { when: expiresAt });
    
    sendResponse({ success: true, url: url });
  } else {
    sendResponse({ success: false, error: 'Incorrect emergency code' });
  }
}

// Handle get settings
async function handleGetSettings(sendResponse) {
  const { settings } = await chrome.storage.local.get('settings');
  sendResponse({ settings });
}

// Handle update settings
async function handleUpdateSettings(message, sendResponse) {
  const { settings } = message;
  await chrome.storage.local.set({ settings });
  sendResponse({ success: true });
}

// Handle get blocked domains
async function handleGetBlockedDomains(sendResponse) {
  const { blockedDomains } = await chrome.storage.local.get('blockedDomains');
  sendResponse({ blockedDomains });
}

// Handle update blocked domains
async function handleUpdateBlockedDomains(message, sendResponse) {
  const { blockedDomains } = message;
  await chrome.storage.local.set({ blockedDomains });
  sendResponse({ success: true });
}

// Handle get usage logs
async function handleGetUsageLogs(sendResponse) {
  const { usageLogs } = await chrome.storage.local.get('usageLogs');
  sendResponse({ usageLogs: usageLogs || [] });
}

// Handle check permission status
async function handleCheckPermissionStatus(message, sendResponse) {
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
}

// Handle alarm events (timer expirations)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('expire-')) {
    // Permission expired, cooldown is already set
    console.log(`Permission expired for: ${alarm.name}`);
  }
});

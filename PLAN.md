# Flow - Productivity Browser Extension

## Overview
A Chrome extension that blocks customizable domains and requires justification before allowing temporary access. Designed to help users manage distractions and analyze productivity patterns.

## Architecture

### File Structure
```
flow/
├── manifest.json          # Chrome Manifest V3 configuration
├── background.js          # Service worker (core blocking logic)
├── blocked.html           # Cooldown page
├── blocked.js             # Cooldown page logic
├── justify.html           # Justification form (existing, to update)
├── justify.js             # Justification form logic (existing, to update)
├── popup.html             # Extension popup for settings
├── popup.js               # Settings management
├── dashboard.html         # Analytics/visualization
├── dashboard.js           # Vanilla JS charts
├── styles.css             # Shared styling
└── PLAN.md                # This file
```

## Core Features

### 1. Domain Blocking with Wildcards
- **Exact Match**: `facebook.com` blocks only `facebook.com`
- **Wildcard Match**: `*.facebook.com` blocks all subdomains (m.facebook.com, www.facebook.com, etc.)
- Users can add/remove/enable/disable domains via popup

Pattern matching logic:
```javascript
function matchesDomain(url, pattern) {
  const hostname = new URL(url).hostname;
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return hostname === suffix || hostname.endsWith('.' + suffix);
  }
  return hostname === pattern;
}
```

### 2. Justification System
- User must provide reason before accessing blocked site
- Justification is logged with timestamp
- Redirects to original URL after submission

### 3. Timed Access
- Default: 5 minutes
- Options: 5, 15, 30, 60, 120 minutes, or custom
- Timer tracked in background service worker
- Access automatically revoked when timer expires

### 4. Cooldown Period
- Default: 30 minutes after access expires
- Strictly enforced (shows blocked page)
- Countdown displayed in real-time
- Cannot re-request access until cooldown ends

### 5. Emergency Override
- 32-character random alphanumeric passcode
- Generated on first install
- Visible in settings (requires intentional effort)
- Each override logged separately
- Used to bypass cooldown in emergencies

### 6. Usage Logging
- Every access request logged with:
  - Domain
  - Justification text
  - Timestamp (granted)
  - Duration (minutes)
  - Expiration timestamp
  - Emergency override flag

### 7. Data Visualization (Dashboard)
- Usage frequency by domain (bar chart)
- Access timeline by hour/day
- Recent justifications table
- Statistics: total time, most accessed domains
- All rendered with vanilla JavaScript (Canvas API or DOM)

## Data Structure

```javascript
// Stored in chrome.storage.local
{
  blockedDomains: [
    { pattern: "*.facebook.com", enabled: true },
    { pattern: "twitter.com", enabled: true }
  ],
  settings: {
    defaultMinutes: 5,
    cooldownMinutes: 30,
    emergencyCode: "aB3xK9mN2pQ7rT5wY8zC1dF4gH6jL0vE"  // Auto-generated
  },
  permissions: {
    "facebook.com": {
      expiresAt: 1704456000000,
      cooldownUntil: 1704458000000
    }
  },
  usageLogs: [
    {
      id: "uuid-here",
      domain: "facebook.com",
      justification: "Check work messages",
      grantedAt: 1704456000000,
      duration: 5,
      expiresAt: 1704456300000,
      wasEmergencyOverride: false
    }
  ]
}
```

## Implementation Steps

### Phase 1: Core Infrastructure
- [x] Create PLAN.md
- [ ] Create manifest.json (Manifest V3)
- [ ] Create background.js (service worker)
  - Navigation interception
  - Permission management
  - Timer tracking
  - Storage operations

### Phase 2: User Interface
- [ ] Create blocked.html/js (cooldown page)
  - Show countdown timer
  - Emergency override input
  - Styling
- [ ] Update justify.html/js
  - Integrate with background service
  - Improve UX
  - Handle redirects
- [ ] Create popup.html/js (settings)
  - Domain list management
  - Add/remove/toggle domains
  - Configure default times
  - Show/hide emergency code
  - Link to dashboard

### Phase 3: Analytics
- [ ] Create dashboard.html/js
  - Usage frequency chart (Canvas)
  - Timeline visualization
  - Statistics calculations
  - Justification history table
  - Export data functionality

### Phase 4: Polish
- [ ] Create styles.css (shared styling)
- [ ] Test all functionality
- [ ] Fix bugs and edge cases
- [ ] Optimize performance

### Phase 5: Documentation
- [ ] Update README.md
- [ ] Add installation instructions
- [ ] Document usage patterns
- [ ] Git commits for each phase

## User Flow

### First Time Access
1. User navigates to blocked domain (e.g., facebook.com)
2. No permission exists → Redirect to `justify.html`
3. User enters justification and selects time
4. Permission granted → Redirect to original URL
5. Access allowed for specified duration

### Access Expiration
1. Timer expires
2. Cooldown period begins (30 min default)
3. If user navigates to blocked site → Redirect to `blocked.html`
4. Cooldown countdown displayed
5. After cooldown expires → Can request access again

### Emergency Override
1. During cooldown, user clicks "Emergency Override"
2. Input field appears for emergency code
3. User enters code from settings
4. If correct → Permission granted, override logged
5. If incorrect → Error message shown

## Test Plan

### Manual Testing Checklist

#### Installation & Setup
- [ ] Extension loads without errors in Chrome
- [ ] Emergency code is auto-generated on first install
- [ ] Default blocked domain (facebook.com) is pre-configured
- [ ] Default settings (5 min access, 30 min cooldown) are applied

#### Domain Blocking
- [ ] Exact domain match: `facebook.com` blocks only `facebook.com`
- [ ] Wildcard match: `*.facebook.com` blocks `m.facebook.com`, `www.facebook.com`
- [ ] Non-blocked domains remain accessible
- [ ] Adding new domain via popup works
- [ ] Removing domain via popup works
- [ ] Disabling domain via toggle works (temporarily allows access)

#### Justification Flow
- [ ] Navigating to blocked domain redirects to justification page
- [ ] Domain name displays correctly on justification page
- [ ] Cannot submit without entering justification text
- [ ] All time options (5, 15, 30, 60, 120 min, custom) work
- [ ] Custom minutes input enables only when selected
- [ ] After submission, user is redirected to original blocked site

#### Timer & Cooldown
- [ ] Access is allowed for exactly the specified duration
- [ ] Timer expires correctly (test with 1-minute duration)
- [ ] After timer expires, cooldown begins immediately
- [ ] During cooldown, blocked page shows with countdown
- [ ] Cooldown countdown updates in real-time
- [ ] After cooldown expires, justification page is shown again

#### Emergency Override
- [ ] Emergency code input appears on blocked page
- [ ] Incorrect code shows error message
- [ ] Correct code bypasses cooldown
- [ ] Emergency override is logged in usage history
- [ ] Settings page shows/hides emergency code with toggle

#### Data Logging
- [ ] Each justification is logged with timestamp
- [ ] Domain name is recorded correctly
- [ ] Duration is recorded correctly
- [ ] Emergency overrides are flagged in logs

#### Dashboard/Visualization
- [ ] Dashboard loads and displays data
- [ ] Usage frequency chart renders correctly
- [ ] Timeline shows access patterns
- [ ] Justification history table is populated
- [ ] Statistics (total time, most accessed) calculate correctly
- [ ] Empty state displays when no data exists

#### Settings (Popup)
- [ ] Popup opens when clicking extension icon
- [ ] Domain list displays correctly
- [ ] Add domain with wildcard pattern works
- [ ] Edit default access time works
- [ ] Edit cooldown duration works
- [ ] Settings persist after browser restart

#### Edge Cases
- [ ] Multiple tabs to same blocked domain handled correctly
- [ ] Browser restart preserves permission state
- [ ] Browser restart preserves cooldown state
- [ ] Very long justification text handled properly
- [ ] Special characters in justification handled properly
- [ ] Rapid navigation to blocked site doesn't cause issues
- [ ] System time changes handled gracefully
- [ ] Invalid URLs handled properly

#### Browser Compatibility
- [ ] Chrome (latest stable)
- [ ] Chrome (latest beta) - optional

### Testing Strategy
1. Unit test each major function manually
2. Integration test user flows end-to-end
3. Test edge cases and error conditions
4. Performance test with large datasets
5. User acceptance testing with real usage

## Progress Tracking

### Completed
- [x] Planning and architecture
- [x] Test plan creation

### In Progress
- [ ] Core implementation

### Pending
- [ ] Testing and refinement
- [ ] Documentation

## Notes
- Chrome Manifest V3 required (service workers, not background pages)
- Use chrome.storage.local for persistence
- Use chrome.webNavigation API for URL interception
- Use chrome.alarms API for timer management (more reliable than setTimeout in service workers)
- All times stored as Unix timestamps (milliseconds)
- Emergency code uses crypto.randomUUID() or similar for generation

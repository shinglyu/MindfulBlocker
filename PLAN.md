# Flow Extension - Implementation Plan

## Current Task: Remove Emergency Override Feature & Fix Initial Cooldown

### Problem Statement
1. The emergency override feature allows bypassing the cooldown period using a code
2. First-time users encounter a cooldown even when they haven't used the extension before

### Emergency Override Feature Components Identified

#### 1. **background.js**
- `generateEmergencyCode()` function (lines ~35-42)
- Emergency code generation in `onInstalled` (line 13)
- Emergency code storage in settings
- `handleEmergencyCode()` message handler (lines ~264-300)
- Emergency override logging with `wasEmergencyOverride: true` flag

#### 2. **blocked.html**
- Emergency override section (lines ~30-52)
- "Emergency Override" button
- Emergency code input form
- Warning message about logging

#### 3. **blocked.js**
- Emergency override UI handlers (lines ~24-75)
- `showEmergencyBtn`, `emergencyForm`, `submitEmergencyBtn` event listeners
- Emergency code submission logic
- Error handling for incorrect codes

#### 4. **popup.html**
- Emergency code section (lines ~81-92)
- Emergency code display with blur effect
- Show/hide toggle button
- Copy-to-clipboard functionality

#### 5. **popup.js**
- `toggleEmergencyCode()` function (lines ~160-170)
- `copyEmergencyCode()` function (lines ~172-185)
- Emergency code display in settings loading

#### 6. **dashboard.js**
- `wasEmergencyOverride` flag handling in stats (line 21)
- Override count display (line 43)
- Override badge in history table (lines ~150-155)

### Implementation Steps

#### Phase 1: Planning ✅
- [x] Read and analyze all relevant files
- [x] Identify all emergency override code locations
- [x] Create comprehensive removal plan

#### Phase 2: Backend Changes (background.js) ✅
- [x] Remove `generateEmergencyCode()` function
- [x] Remove emergency code from initial settings in `onInstalled`
- [x] Remove `handleEmergencyCode` message handler
- [x] Remove emergency code storage references
- [x] Keep `wasEmergencyOverride` field in logs for historical data (set to false)

#### Phase 3: Blocked Page Changes ✅
- [x] Remove emergency override section from `blocked.html`
- [x] Remove all emergency override handlers from `blocked.js`
- [x] Clean up unused variables and event listeners

#### Phase 4: Settings/Popup Changes ✅
- [x] Remove emergency code section from `popup.html`
- [x] Remove `toggleEmergencyCode()` and `copyEmergencyCode()` from `popup.js`
- [x] Remove emergency code loading and display logic

#### Phase 5: Dashboard Changes ✅
- [x] Remove override count from stats calculation (dashboard.js)
- [x] Remove override count stat card (dashboard.html)
- [x] Remove override badge from history table (dashboard.js)
- [x] Remove Type column from history table (dashboard.html)
- [x] Keep `wasEmergencyOverride` field for backward compatibility

#### Phase 6: Fix Initial Cooldown Issue ✅
- [x] Analyze cooldown logic in `shouldBlockDomain()`
- [x] Ensure first-time access (no existing permission) shows justify page, not blocked page
- [x] The current logic already handles this correctly - verified no regression needed

#### Phase 7: Bug Fix - Immediate Cooldown After Justification ✅
- [x] Identified bug: cooldown check was happening before active permission check
- [x] Root cause: In `shouldBlockDomain()`, cooldown was checked first, blocking users immediately after granting access
- [x] Solution: Swapped check order - now checks active permission first, then cooldown
- [x] This ensures users can access sites during their granted permission period
- [x] Cooldown only applies after the permission expires

**Technical Details:**
When a user grants 5 minutes access:
- `expiresAt` = now + 5 min
- `cooldownUntil` = now + 35 min (5 min + 30 min cooldown)

Previous logic checked cooldown first, saw cooldownUntil > now, and blocked immediately.
New logic checks active permission first, sees expiresAt > now, and allows access.

#### Phase 8: Testing
- [ ] Test blocked domain flow without emergency override
- [ ] Verify first-time access shows justify page
- [ ] Verify users can access site after justification during permission period
- [ ] Verify cooldown works after permission expires
- [ ] Test settings page without emergency code section
- [ ] Check dashboard displays correctly

#### Phase 9: Documentation & Commit
- [x] Update PLAN.md with bug fix details
- [ ] Create git commit with descriptive message
- [ ] Update README if necessary

### Technical Notes

**Cooldown Logic (Already Correct)**:
The `shouldBlockDomain()` function in background.js:
1. First checks if in cooldown → returns 'cooldown' (blocked page)
2. Then checks if has active permission → returns not blocked
3. Otherwise returns 'no-permission' (justify page)

This means first-time users will see the justify page, not the blocked page. ✅

**Emergency Override Removal Strategy**:
- Remove all UI components
- Remove all message handlers
- Keep `wasEmergencyOverride` field in existing logs (for history)
- Set `wasEmergencyOverride: false` for new logs (since feature is removed)
- Don't break existing usage data

### Files to Modify
1. ✅ PLAN.md (this file)
2. background.js
3. blocked.html
4. blocked.js
5. popup.html
6. popup.js
7. dashboard.js

### Expected Outcome
- No emergency override functionality in any part of the extension
- First-time users see justify page (not blocked page)
- Existing cooldown logic remains functional
- Historical data preserved but no new overrides possible
- Cleaner, simpler codebase
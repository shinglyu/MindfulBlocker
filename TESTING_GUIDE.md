# Testing Guide - Flow Extension

This guide will help you manually test the Flow extension after applying the code review fixes.

## Installation Steps

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `/home/shinglyu/workspace/flow` directory
5. The Flow extension should now appear in your extensions list

## Quick Smoke Test

### 1. Verify Installation
- [ ] Extension icon appears in Chrome toolbar
- [ ] No errors in console when loading extension
- [ ] Click extension icon - popup should open without errors

### 2. Check Emergency Code Generation
1. Click the extension icon
2. Scroll to "Emergency Override Code" section
3. Click "Show Code"
4. **Verify**: Code should be 32 characters long (letters and numbers)
5. Copy the code somewhere safe for testing

### 3. Test Domain Blocking
1. In the popup, add a test domain (e.g., `example.com`)
2. Navigate to `http://example.com`
3. **Expected**: You should be redirected to the justification page
4. **Verify**: Domain name displays correctly on justification page

### 4. Test Justification Flow
1. Enter a justification (e.g., "Testing the extension")
2. Select "5 minutes" time option
3. Click "Grant Access"
4. **Expected**: Redirected to `example.com`
5. **Expected**: Site loads normally

### 5. Test Error Handling
1. Try submitting justification without entering text
2. **Expected**: Inline error message appears (not alert())
3. Try entering a very long justification (over 500 characters)
4. **Expected**: Error message about character limit

### 6. Test Cooldown
1. Wait 5 minutes (or use browser DevTools to speed up time)
2. Try navigating to `example.com` again
3. **Expected**: Redirected to blocked page with countdown
4. **Verify**: Countdown updates every second

### 7. Test Emergency Override
1. While on the blocked page, click "Use Emergency Override"
2. Enter the emergency code from step 2
3. Click "Submit Override"
4. **Expected**: Redirected to `example.com`
5. Check dashboard - override should be logged

### 8. Test Dashboard
1. Click the extension icon
2. Click "Dashboard" (or navigate to dashboard.html)
3. **Verify**: Usage statistics display correctly
4. **Verify**: Bar chart shows your test domain
5. **Verify**: History table shows your access entries

## Detailed Testing Checklist

### Security Tests

#### XSS Protection
1. Try entering this in justification: `<script>alert('XSS')</script>`
2. Submit and check dashboard
3. **Expected**: Text displays as-is, no script execution
4. **Pass/Fail**: ___

#### Emergency Code Security
1. Open browser console
2. Check if emergency code is visible in localStorage
3. **Expected**: Code should be in chrome.storage.local (not visible in console)
4. **Pass/Fail**: ___

### Error Handling Tests

#### Runtime Error Test
1. Open browser console (F12)
2. Disable the extension
3. Try to submit a justification
4. **Expected**: Error message displayed to user (not just console error)
5. Re-enable extension
6. **Pass/Fail**: ___

#### Invalid Input Test
1. Try custom minutes with value `-5`
2. **Expected**: Error message
3. Try custom minutes with value `2000`
4. **Expected**: Error message (max 1440)
5. **Pass/Fail**: ___

### Storage Tests

#### Log Rotation Test
This is harder to test manually, but you can verify the code works:

1. Open browser console
2. Navigate to "Application" tab → "Storage" → "Extension storage"
3. Check `usageLogs` array
4. **Expected**: Should not exceed 1000 entries (create many test entries if you want to verify)
5. **Pass/Fail**: ___

### UI/UX Tests

#### Popup Error Messages
1. Try adding a domain without a dot (e.g., `facebook`)
2. **Expected**: Inline error message appears (not alert)
3. Try adding a duplicate domain
4. **Expected**: Inline error message
5. **Pass/Fail**: ___

#### Confirm Dialog
1. Add a test domain
2. Click the × button to remove it
3. **Expected**: Custom confirmation dialog appears (not browser confirm)
4. Click "Cancel" - domain should remain
5. Click × again, then "Confirm" - domain should be removed
6. **Pass/Fail**: ___

### Performance Tests

#### Multiple Tabs
1. Open 5 tabs to blocked domain

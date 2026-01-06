# Test Plan for TODO.md Features

## Automated Unit Tests
Run with: `node tests/run_tests.js`

### Current Test Coverage:
- ✅ `formatTime()` - 12 tests (minutes-only display, no seconds)
- ✅ `matchesDomain()` - 9 tests (wildcard pattern matching)
- ✅ `extractDomain()` - 5 tests (URL parsing)

## Manual Testing Required

### 1. Show Only Minutes for Cooldown (IMPLEMENTED)
**Test Steps:**
1. Load extension in Chrome (`chrome://extensions/` -> Load unpacked)
2. Add a blocked domain (e.g., `*.example.com`)
3. Grant access for 1 minute
4. Wait for access to expire
5. Try to access the site again

**Expected Results:**
- [ ] Cooldown timer shows "X minutes" instead of "Xm Ys"
- [ ] Timer rounds up (e.g., 59 seconds shows as "1 minute")
- [ ] No seconds are displayed
- [ ] "Less than a minute" shows when < 1 minute remaining

### 2. Breathing Exercise Before Justification (IMPLEMENTED)
**Test Steps:**
1. Navigate to a blocked domain
2. Observe the breathing exercise overlay

**Expected Results:**
- [ ] Breathing overlay appears immediately
- [ ] Circle expands for 4 seconds (Inhale)
- [ ] Circle contracts for 4 seconds (Exhale)
- [ ] Text changes between "Inhale" and "Exhale"
- [ ] Progress bar advances smoothly
- [ ] "Breath X of 3" counter updates correctly
- [ ] After 3 cycles (~24 seconds), overlay fades out
- [ ] Justification form becomes visible
- [ ] Justification textarea is auto-focused

### 3. Attempt Count and Last Attempt Time (TODO)
**Test Steps:**
1. Navigate to a blocked domain
2. Check the blocked page

**Expected Results:**
- [ ] Shows "You have attempted to access this site X times today"
- [ ] Shows "Last attempt: X minutes/hours ago"
- [ ] Count resets at midnight

### 4. FB Redirect Page Conflicts (TODO)
**Test Steps:**
1. Block `*.facebook.com`
2. On Facebook, click an external link
3. Observe behavior during FB's redirect page

**Expected Results:**
- [ ] No conflicting block pages appear
- [ ] Final destination is properly blocked (if in blocklist)
- [ ] No flickering between block pages

### 5. Security Review (COMPLETED)
**Checks Performed:**
- [x] No hardcoded secrets or API keys
- [x] No Math.random() usage (checked, none found)
- [x] All user input uses textContent (XSS prevention)
- [x] URL parameters are validated
- [x] Runtime errors are properly caught

### 6. GitHub Repository (TODO)
**Test Steps:**
1. Create public repository
2. Push code
3. Verify .gitignore excludes sensitive files

**Expected Results:**
- [ ] Repository is public
- [ ] All source files present
- [ ] No secrets in commit history
- [ ] README.md has proper documentation

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Chrome (1 version back)
- [ ] Edge (Chromium-based)

## Running Tests

### Unit Tests
```bash
node tests/run_tests.js
```

### Visual Test (Browser)
Open `tests/unit_tests.html` in a browser to see test results visually.

### Manual Extension Testing
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project directory
5. Follow manual test steps above
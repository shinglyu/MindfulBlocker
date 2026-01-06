// Flow Extension - Unit Tests
// Run with: node tests/run_tests.js

// Test framework
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('✓', name);
    } catch (error) {
        failed++;
        console.log('✗', name, '-', error.message);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} Expected "${expected}", got "${actual}"`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(`${message} Expected true, got false`);
    }
}

// ============================================
// Functions to test (copied from source files)
// ============================================

// From blocked.js - formatTime function (new version with minutes only)
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    // Round up to nearest minute to avoid showing seconds ticking down
    const minutes = Math.ceil((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
        // If we have hours and minutes rounded up to 60, add an hour
        if (minutes === 60) {
            return `${hours + 1}h`;
        }
        // If exactly on the hour, just show hours
        if (minutes === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        // Less than a minute remaining
        return 'Less than a minute';
    }
}

// From background.js - matchesDomain function
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

// From background.js/blocked.js - extractDomain function
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
}

// From background.js - isKnownRedirectPage function
function isKnownRedirectPage(url) {
    try {
        const hostname = new URL(url).hostname;
        
        const redirectPatterns = [
            'l.facebook.com',
            'lm.facebook.com',
            'l.instagram.com',
            'l.messenger.com',
            't.co',
            'out.reddit.com',
            'away.vk.com',
            'exit.sc',
            'href.li',
        ];
        
        for (const pattern of redirectPatterns) {
            if (hostname === pattern) {
                return true;
            }
        }
        
        if (hostname.includes('youtube.com') && url.includes('/redirect')) {
            return true;
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

// From blocked.js - formatTimeAgo function
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        return 'just now';
    }
}

// ============================================
// Test Suite: formatTime (minutes-only version)
// ============================================

console.log('\n=== formatTime Tests (Minutes Only - No Anxiety) ===');

test('formatTime: 0 milliseconds returns "Less than a minute"', () => {
    assertEqual(formatTime(0), 'Less than a minute');
});

test('formatTime: 30 seconds rounds up to 1 minute', () => {
    assertEqual(formatTime(30000), '1 minute');
});

test('formatTime: 59 seconds rounds up to 1 minute', () => {
    assertEqual(formatTime(59000), '1 minute');
});

test('formatTime: 60 seconds (1 minute) returns "1 minute"', () => {
    assertEqual(formatTime(60000), '1 minute');
});

test('formatTime: 90 seconds rounds up to 2 minutes', () => {
    assertEqual(formatTime(90000), '2 minutes');
});

test('formatTime: 5 minutes returns "5 minutes"', () => {
    assertEqual(formatTime(5 * 60 * 1000), '5 minutes');
});

test('formatTime: 30 minutes returns "30 minutes"', () => {
    assertEqual(formatTime(30 * 60 * 1000), '30 minutes');
});

test('formatTime: 1 hour exactly returns "1h"', () => {
    assertEqual(formatTime(60 * 60 * 1000), '1h');
});

test('formatTime: 1 hour 1 second rounds up to "1h 1m"', () => {
    assertEqual(formatTime(60 * 60 * 1000 + 1000), '1h 1m');
});

test('formatTime: 1 hour 30 minutes returns "1h 30m"', () => {
    assertEqual(formatTime(90 * 60 * 1000), '1h 30m');
});

test('formatTime: 1 hour 59 minutes 59 seconds rounds up to "2h"', () => {
    assertEqual(formatTime((60 + 59) * 60 * 1000 + 59 * 1000), '2h');
});

test('formatTime: does not show seconds (anxiety reduction)', () => {
    const result = formatTime(125000); // 2 min 5 sec
    // Check it doesn't contain patterns like "5s" or "30s" (seconds notation)
    assertTrue(!/\d+s\b/.test(result), 'Should not contain seconds notation');
    assertEqual(result, '3 minutes'); // Rounds up
});

// ============================================
// Test Suite: matchesDomain
// ============================================

console.log('\n=== matchesDomain Tests ===');

test('matchesDomain: exact match works', () => {
    assertTrue(matchesDomain('https://facebook.com/page', 'facebook.com'));
});

test('matchesDomain: exact match fails for subdomain', () => {
    assertTrue(!matchesDomain('https://www.facebook.com', 'facebook.com'));
});

test('matchesDomain: wildcard matches base domain', () => {
    assertTrue(matchesDomain('https://facebook.com', '*.facebook.com'));
});

test('matchesDomain: wildcard matches www subdomain', () => {
    assertTrue(matchesDomain('https://www.facebook.com', '*.facebook.com'));
});

test('matchesDomain: wildcard matches deep subdomain', () => {
    assertTrue(matchesDomain('https://m.facebook.com', '*.facebook.com'));
});

test('matchesDomain: wildcard does not match different domain', () => {
    assertTrue(!matchesDomain('https://notfacebook.com', '*.facebook.com'));
});

test('matchesDomain: wildcard does not match partial match', () => {
    assertTrue(!matchesDomain('https://myfacebook.com', '*.facebook.com'));
});

test('matchesDomain: handles invalid URL gracefully', () => {
    assertTrue(!matchesDomain('not-a-url', 'facebook.com'));
});

test('matchesDomain: handles empty pattern', () => {
    assertTrue(!matchesDomain('https://facebook.com', ''));
});

// ============================================
// Test Suite: extractDomain
// ============================================

console.log('\n=== extractDomain Tests ===');

test('extractDomain: extracts domain from HTTPS URL', () => {
    assertEqual(extractDomain('https://www.facebook.com/page?q=1'), 'www.facebook.com');
});

test('extractDomain: extracts domain from HTTP URL', () => {
    assertEqual(extractDomain('http://example.com'), 'example.com');
});

test('extractDomain: handles URL with port', () => {
    assertEqual(extractDomain('https://localhost:3000/app'), 'localhost');
});

test('extractDomain: returns original string for invalid URL', () => {
    assertEqual(extractDomain('not-a-valid-url'), 'not-a-valid-url');
});

test('extractDomain: handles empty string', () => {
    assertEqual(extractDomain(''), '');
});

// ============================================
// Test Suite: isKnownRedirectPage
// ============================================

console.log('\n=== isKnownRedirectPage Tests (FB Redirect Handling) ===');

test('isKnownRedirectPage: detects l.facebook.com redirect', () => {
    assertTrue(isKnownRedirectPage('https://l.facebook.com/l.php?u=https://example.com'));
});

test('isKnownRedirectPage: detects lm.facebook.com redirect', () => {
    assertTrue(isKnownRedirectPage('https://lm.facebook.com/l.php?u=https://example.com'));
});

test('isKnownRedirectPage: detects t.co (Twitter) redirect', () => {
    assertTrue(isKnownRedirectPage('https://t.co/abc123'));
});

test('isKnownRedirectPage: detects out.reddit.com redirect', () => {
    assertTrue(isKnownRedirectPage('https://out.reddit.com/?url=https://example.com'));
});

test('isKnownRedirectPage: detects YouTube redirect', () => {
    assertTrue(isKnownRedirectPage('https://www.youtube.com/redirect?q=https://example.com'));
});

test('isKnownRedirectPage: does not flag regular facebook.com', () => {
    assertTrue(!isKnownRedirectPage('https://www.facebook.com/profile'));
});

test('isKnownRedirectPage: does not flag regular websites', () => {
    assertTrue(!isKnownRedirectPage('https://example.com'));
});

test('isKnownRedirectPage: handles invalid URLs gracefully', () => {
    assertTrue(!isKnownRedirectPage('not-a-url'));
});

// ============================================
// Test Suite: formatTimeAgo
// ============================================

console.log('\n=== formatTimeAgo Tests ===');

test('formatTimeAgo: just now (0 seconds ago)', () => {
    const now = Date.now();
    assertEqual(formatTimeAgo(now), 'just now');
});

test('formatTimeAgo: just now (30 seconds ago)', () => {
    const thirtySecondsAgo = Date.now() - 30 * 1000;
    assertEqual(formatTimeAgo(thirtySecondsAgo), 'just now');
});

test('formatTimeAgo: 1 minute ago', () => {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    assertEqual(formatTimeAgo(oneMinuteAgo), '1 minute ago');
});

test('formatTimeAgo: 5 minutes ago', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    assertEqual(formatTimeAgo(fiveMinutesAgo), '5 minutes ago');
});

test('formatTimeAgo: 59 minutes ago', () => {
    const fiftyNineMinutesAgo = Date.now() - 59 * 60 * 1000;
    assertEqual(formatTimeAgo(fiftyNineMinutesAgo), '59 minutes ago');
});

test('formatTimeAgo: 1 hour ago', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    assertEqual(formatTimeAgo(oneHourAgo), '1 hour ago');
});

test('formatTimeAgo: 2 hours ago', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    assertEqual(formatTimeAgo(twoHoursAgo), '2 hours ago');
});

test('formatTimeAgo: 24 hours ago', () => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    assertEqual(formatTimeAgo(twentyFourHoursAgo), '24 hours ago');
});

// ============================================
// Summary
// ============================================

console.log('\n=== Test Summary ===');
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
    console.log('\n❌ TESTS FAILED');
    process.exit(1);
} else {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
}
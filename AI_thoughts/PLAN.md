# Implementation Plan for TODO.md Items

## Overview
This document outlines the implementation plan for the remaining TODO items.

## TODO Items Analysis

### 1. FB Redirect Page Conflict
**Problem**: When clicking external links on Facebook, FB opens a redirect/warning page before resolving to the external link. If both the FB domain and the external domain are blocked, there could be conflicts.

**Solution**: 
- Track the "original" blocked URL in session/memory
- When a new block triggers for a different domain within a short time window (e.g., 5 seconds), check if it's a redirect from the same tab
- Use `chrome.webNavigation.onCommitted` or track tab IDs to detect redirects
- Prioritize the final destination URL for blocking, not intermediate redirect pages

### 2. Show Attempt Count and Last Attempt Time
**Problem**: Users don't know how many times they've tried to access the site today or when they last attempted.

**Solution**:
- Add a new field in storage to track access attempts per domain per day
- Structure: `accessAttempts: { [domain]: { count: number, lastAttempt: timestamp, date: string } }`
- Update blocked.html/blocked.js to display this information
- Reset count daily

### 3. Show Only Minutes for Cooldown
**Problem**: Showing seconds creates anxiety as users watch the clock tick.

**Solution**:
- Modify `formatTime()` function in blocked.js
- Round up to nearest minute
- Show "X minutes remaining" instead of "Xm Ys"

### 4. Breathing Exercise Before Justification
**Problem**: Users should pause and breathe before making a decision to access a blocked site.

**Solution**:
- Add a breathing exercise overlay to justify.html
- 4 seconds inhale, 4 seconds exhale animation
- Show for ~16-24 seconds (2-3 breath cycles) before revealing the justification form
- Add visual breathing guide (expanding/contracting circle)

### 5. Security Code Review
**Problem**: Need to review for exposed credentials and security issues.

**Solution**:
- Review all files for hardcoded secrets
- Check for XSS vulnerabilities
- Ensure proper input sanitization
- Update emergency code generation to use crypto.getRandomValues()

### 6. Create Public GitHub Repo
**Problem**: Need to push code to a public GitHub repository.

**Solution**:
- Use `gh` CLI to create public repo
- Push all code with proper .gitignore
- Ensure no secrets are committed

## Implementation Order

1. [ ] Security review and fix credentials/vulnerabilities
2. [ ] Show only minutes for cooldown (quick fix)
3. [ ] Add breathing exercise to justify page
4. [ ] Track and display attempt count and last attempt time
5. [ ] Handle FB redirect page conflicts
6. [ ] Create public GitHub repo and push code

## Progress Tracking
- Started: January 6, 2026
- Status: Planning
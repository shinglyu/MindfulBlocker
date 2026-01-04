# Flow - Productivity Browser Extension

A Chrome extension that helps you manage distractions by blocking customizable domains and requiring justification before access. Track your browsing patterns and analyze your productivity with built-in analytics.

## Features

### 🚫 Domain Blocking
- Block any domain with customizable patterns
- Support for wildcard matching (e.g., `*.facebook.com` blocks all subdomains)
- Enable/disable domains without removing them
- Pre-configured with facebook.com as default

### ⏱️ Timed Access
- Request temporary access by providing justification
- Configurable duration: 5, 15, 30, 60, 120 minutes, or custom
- Default 5-minute access period
- All justifications logged with timestamps

### 🔒 Cooldown Period
- Automatic cooldown after access expires (default: 30 minutes)
- Prevents immediate re-access to blocked sites
- Real-time countdown timer displayed
- Encourages mindful browsing habits

### 🆘 Emergency Override
- 32-character random passcode for urgent needs
- Generated on first installation
- All overrides logged separately for accountability
- Access code from extension settings

### 📊 Analytics Dashboard
- Visual bar charts showing access frequency by domain
- Recent access history table with justifications
- Statistics: total sessions, time granted, most accessed sites
- Track emergency override usage

### ⚙️ Customizable Settings
- Add/remove blocked domains via popup interface
- Configure default access duration
- Adjust cooldown period length
- View and copy emergency override code

## Installation

### From Source (Developer Mode)

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd flow
   ```

2. **Create extension icons** (optional but recommended)
   - Create three PNG files in the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - See `icons/README.md` for design guidelines

3. **Load extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `flow` directory
   - Extension should now appear in your toolbar

## Usage

### First Time Setup

1. Click the Flow extension icon in your toolbar
2. The popup shows default settings (facebook.com blocked, 5 min access, 30 min cooldown)
3. Note your emergency override code (click "Show Code" to view)
4. Add additional domains to block as needed

### Requesting Access

1. Navigate to a blocked domain (e.g., facebook.com)
2. You'll be redirected to the justification page
3. Enter your reason for accessing the site
4. Select how long you need access
5. Click "Grant Access"
6. You'll be redirected to the original URL

### During Cooldown

1. If you try to access a blocked site during cooldown, you'll see the blocked page
2. A countdown timer shows remaining cooldown time
3. You can use emergency override if absolutely necessary
4. Enter your emergency code to bypass the cooldown

### Managing Settings

1. Click the Flow extension icon
2. **Blocked Domains**: Add new domains, toggle existing ones, or remove them
3. **Time Settings**: Adjust default access duration and cooldown period
4. **Emergency Code**: View or copy your override code
5. **Dashboard**: Click the link to view your usage analytics

### Viewing Analytics

1. Click "View Usage Dashboard" from any Flow page
2. See your browsing statistics and patterns
3. Review your justifications to reflect on your habits
4. Identify most-accessed distracting sites

## File Structure

```
flow/
├── manifest.json          # Chrome extension configuration
├── background.js          # Service worker (core logic)
├── blocked.html           # Cooldown page
├── blocked.js
├── justify.html           # Access request page
├── justify.js
├── popup.html             # Extension popup (settings)
├── popup.js
├── dashboard.html         # Analytics dashboard
├── dashboard.js
├── styles.css             # Shared styles
├── icons/                 # Extension icons
│   └── README.md
├── PLAN.md                # Implementation plan and test cases
└── README.md              # This file
```

## Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Permissions**: storage, tabs, webNavigation, alarms
- **Storage**: chrome.storage.local for persistence
- **Timer Management**: chrome.alarms API for reliable timers
- **Visualization**: Vanilla JavaScript (no external libraries)

## Development

### Testing

See `PLAN.md` for the comprehensive test plan, including:
- Installation & setup tests
- Domain blocking tests
- Justification flow tests
- Timer & cooldown tests
- Emergency override tests
- Data logging tests
- Dashboard visualization tests
- Edge cases

### Key Functions

**background.js**
- `matchesDomain(url, pattern)` - Check if URL matches blocking pattern
- `shouldBlockDomain(url)` - Determine if domain should be blocked
- `handleSavePermission()` - Grant access after justification
- `handleEmergencyCode()` - Verify and process emergency override

**Domain Pattern Matching**
- Exact: `facebook.com` matches only `facebook.com`
- Wildcard: `*.facebook.com` matches `m.facebook.com`, `www.facebook.com`, etc.

## Privacy

- All data stored locally in Chrome storage
- No data sent to external servers
- Justifications and usage logs remain on your device
- Emergency code generated locally and never transmitted

## Troubleshooting

### Extension not blocking sites
- Check that the domain is in your blocked list
- Verify the domain is enabled (checkbox checked)
- Ensure the pattern matches correctly (use wildcards if needed)

### Icons not displaying
- Create icon PNG files in the `icons/` directory
- Reload the extension after adding icons

### Countdown timer not updating
- Refresh the blocked page
- Check Chrome DevTools console for errors

### Emergency code not working
- Ensure you're copying the entire 32-character code
- Code is case-sensitive
- Check settings popup to verify the code

## Future Enhancements

Potential features for future versions:
- Export usage data to CSV/JSON
- Schedule-based blocking (e.g., block only during work hours)
- Browser sync across devices
- Custom block messages
- Productivity score calculation
- Weekly/monthly reports

## Contributing

Contributions are welcome! Areas for improvement:
- Better icon design
- Additional chart types in dashboard
- Firefox compatibility
- Unit tests
- Internationalization (i18n)

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the test plan in `PLAN.md`
3. Open an issue in the repository

---

**Stay focused. Stay productive. Flow.**

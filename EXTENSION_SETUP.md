# Chrome Extension Setup Guide

## Loading the Extension in Chrome

### Step 1: Enable Developer Mode
1. Open Chrome
2. Go to `chrome://extensions/` (or Menu → Extensions → Manage Extensions)
3. Toggle **"Developer mode"** ON (top-right corner)

### Step 2: Load Extension
1. Click **"Load unpacked"** button
2. Navigate to your project folder
3. Select the `/extension` directory (the folder containing `manifest.json`)
4. Click **"Select Folder"**

### Step 3: Get Extension ID
After loading, you'll see your extension card with:
- Extension name: "Linear Assistant"
- **Extension ID**: A long string like `abcdefghijklmnopqrstuvwxyz123456`

### Step 4: Copy Extension ID
1. **Copy the Extension ID** from the extension card
2. The ID looks like: `abcdefghijklmnopqrstuvwxyz123456`

## Next Steps After Getting ID

### Update Environment Files
Replace `your-extension-id-here` with your actual ID in:

**mcp-server/.env:**
```bash
ALLOWED_ORIGINS=chrome-extension://YOUR_ACTUAL_ID_HERE,http://localhost:3000
```

**extension/popup/auth.js:**
Update the redirect URI configuration

### Configure Clerk Dashboard
1. Go to Clerk Dashboard → Configure → Domains
2. Add redirect URI: `chrome-extension://YOUR_ACTUAL_ID_HERE`

## Testing the Extension

### Step 1: Pin Extension (Optional)
- Click the puzzle piece icon in Chrome toolbar
- Pin "Linear Assistant" for easy access

### Step 2: Test Extension
1. Click the extension icon
2. Should show the login screen
3. Click "Connect to Linear" to test auth flow

### Troubleshooting

**If extension doesn't load:**
- Check for errors in `chrome://extensions/`
- Click "Errors" button if present
- Verify `manifest.json` syntax

**If popup doesn't open:**
- Right-click extension icon → "Inspect popup"
- Check Console tab for JavaScript errors
- Verify file paths in `manifest.json`

**Console Debugging:**
- Right-click extension → "Inspect popup"
- Check Console and Network tabs
- Look for authentication flow logs
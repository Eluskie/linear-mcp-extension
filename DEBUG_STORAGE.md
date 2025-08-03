# Debug Chrome Extension Storage

## How to Debug Storage Issues

### Step 1: Open Extension DevTools
1. Right-click extension icon → "Inspect popup"
2. Go to **Console** tab
3. Look for debug messages:
   - 🔍 Checking authentication status...
   - 📦 Storage result: {hasAuthToken, hasUserData, hasLinearKey}
   - ✅ User authenticated: [name]
   - 🔑 Linear API key found, validating connection...

### Step 2: Check Storage Manually
In the Console, run:
```javascript
// Check what's stored
chrome.storage.local.get(['auth_token', 'user_data', 'linear_api_key'], (result) => {
    console.log('Stored data:', result);
});

// Clear all storage (if needed)
chrome.storage.local.clear(() => {
    console.log('Storage cleared');
});

// Set test data
chrome.storage.local.set({
    'auth_token': 'test_token',
    'user_data': {name: 'Test User', isPaid: false},
    'linear_api_key': 'lin_api_test123'
}, () => {
    console.log('Test data stored');
});
```

### Step 3: Expected Behavior

#### First Time Setup:
1. User clicks extension → Auth screen
2. Login with Clerk → Linear setup screen
3. Enter Linear API key → Chat screen

#### Subsequent Opens:
1. User clicks extension → Chat screen (immediate)
2. Connection status updates in background
3. Shows workspace name when connected

#### After Extension Reload:
1. Should still show chat screen
2. API key should persist
3. Connection status should update

### Step 4: Common Issues

#### Issue: "API key not recognized"
- Check if API key starts with `lin_api_`
- Verify Linear API key in Linear Settings
- Check console for validation errors

#### Issue: "Connection lost after reload"
- Check storage persistence
- Look for JavaScript errors in console
- Verify MCP server is running

#### Issue: "Shows setup screen every time"
- Storage not persisting
- Check Chrome storage permissions
- Verify storage.local.set() success

### Step 5: Test Persistence

Run this test in Console:
```javascript
// Test persistence
async function testPersistence() {
    // Store test data
    await chrome.storage.local.set({
        'test_key': 'test_value',
        'timestamp': Date.now()
    });
    
    // Read it back
    const result = await chrome.storage.local.get(['test_key', 'timestamp']);
    console.log('Persistence test:', result);
    
    // Clean up
    await chrome.storage.local.remove(['test_key', 'timestamp']);
}

testPersistence();
```

### Expected Storage Structure:
```javascript
{
  "auth_token": "mock_jwt_token_1234567890",
  "user_data": {
    "id": "demo_user",
    "name": "Gerard Martí", 
    "email": "eluskiemt@gmail.com",
    "isPaid": false
  },
  "linear_api_key": "lin_api_1234567890abcdef"
}
```
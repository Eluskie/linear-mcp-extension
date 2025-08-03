# Linear Connection Strategy

## The Problem
Users authenticate with Clerk but aren't connected to Linear. We need to:
1. Detect Linear connection status
2. Guide users to connect their Linear account
3. Handle different Linear accounts vs. Clerk accounts

## Recommended Solution: API Key Flow

### Phase 1: Linear API Key Integration

#### 1. Connection Status Detection
```javascript
// Check if user has Linear API key stored
const hasLinearConnection = await checkLinearConnection();
```

#### 2. UI States
- **Authenticated + Connected**: Show chat interface
- **Authenticated + Not Connected**: Show Linear setup screen
- **Not Authenticated**: Show login screen

#### 3. Linear Setup Flow
1. Show "Connect to Linear" screen after Clerk auth
2. Guide user to get Linear Personal API Key
3. Test API key validity
4. Store securely and proceed to chat

#### 4. User Experience Flow
```
User clicks extension 
→ Clerk authentication (Gmail)
→ Check Linear connection status
→ If not connected: Show Linear setup
→ If connected: Show chat interface
```

### Implementation Steps

#### Step 1: Add Linear Connection Check
- Detect if Linear API key exists
- Validate API key with Linear
- Show appropriate UI state

#### Step 2: Linear Setup Screen
- Guide user to Linear Settings > API
- Input field for API key
- Validation and testing
- Success confirmation

#### Step 3: Connection Status Display
- Show connection status in UI
- Allow disconnection/reconnection
- Handle API key rotation

#### Step 4: Error Handling
- Invalid API key errors
- Network issues
- Linear API rate limits
- Expired keys

### UI Components Needed

#### Linear Setup Screen
```
┌─────────────────────────────────┐
│ Connect to Linear               │
│                                 │
│ To use Linear Assistant, you    │
│ need to connect your Linear     │
│ account.                        │
│                                 │
│ 1. Go to Linear Settings       │
│ 2. Click "Security and access" │
│ 3. Find "Personal API key"     │
│ 4. Click "New API key"         │
│ 5. Create name and copy key    │
│ 6. Paste it below:             │
│                                 │
│ [API Key Input Field]           │
│                                 │
│ [Connect] [Learn More]          │
└─────────────────────────────────┘
```

#### Connection Status Indicator
- Green dot: Connected
- Red dot: Not connected
- Warning: API key expired

### Future Enhancements (Phase 2)

#### Linear OAuth Flow
- Full OAuth 2.0 implementation
- Automatic token refresh
- Multi-workspace support

#### Account Matching
- Match Clerk email with Linear user
- Handle multiple Linear accounts
- Team/workspace selection

#### Advanced Features
- SSO integration
- Enterprise account support
- Multi-workspace chat

### Security Considerations

#### API Key Storage
- Chrome extension storage (encrypted)
- Never log or expose keys
- Secure transmission to MCP server

#### Validation
- Test API key before storing
- Regular validation checks
- Handle revoked keys gracefully

### Error Messages

#### Common Scenarios
- "Invalid Linear API key"
- "Linear API key expired"
- "No access to Linear workspace"
- "Network error connecting to Linear"
- "Linear API rate limit exceeded"

### Analytics & Monitoring

#### Track Connection Issues
- Failed connection attempts
- API key validation failures
- User drop-off points
- Most common errors
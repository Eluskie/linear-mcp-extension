# Linear MCP Extension - Project Plan

## Overview
Building a Chrome extension with chat interface that connects to Linear via self-hosted MCP server, featuring OAuth authentication, real-time sync, and freemium model.

## Tech Stack
- **Auth**: OAuth with Clerk
- **Database**: Convex (real-time sync)
- **MCP**: Self-hosted server
- **Storage**: Sync across devices
- **UI**: Tailwind CSS (precompiled)
- **Development**: Cursor IDE

## Monetization Model
- **Free Users**: No conversation memory, no command history, no personalization
- **Paid Users**: Full conversation memory, command history, personalization features

## Phase 1: Foundation & Authentication ✅ COMPLETED

### Step 1: Project Setup ✅ COMPLETED
- [x] Create project directory
- [x] Initialize git repository
- [x] Create .gitignore

### Step 2: Project Structure ✅ COMPLETED
```
linear-mcp-extension/
├── extension/                 # Chrome extension files
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html        # Chat interface
│   │   ├── popup.js         # Main popup logic
│   │   ├── popup.css        # Tailwind styling
│   │   └── auth.js          # Authentication handling
│   ├── background/
│   │   └── service-worker.js # Background processes
│   ├── content/
│   │   └── content-script.js # Optional: page integration
│   ├── icons/
│   └── shared/
├── mcp-server/               # Self-hosted MCP server
│   ├── src/
│   │   ├── index.ts         # Main MCP server
│   │   ├── linear-client.ts # Linear API wrapper
│   │   ├── tools/           # MCP tool implementations
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── shared/                   # Shared types/utilities
└── docs/
```

### Step 3: Self-hosted MCP Server ✅ COMPLETED
- [x] Initialize MCP server project
- [x] Install dependencies (@modelcontextprotocol/sdk, @linear/sdk)
- [x] Set up TypeScript configuration
- [x] Create Linear API wrapper
- [x] Implement core MCP tools:
  - [x] create-issue.ts
  - [x] search-issues.ts
  - [x] update-issue.ts
  - [x] get-teams.ts
- [x] Test MCP server locally

### Step 4: Convex Database Setup (DEFERRED)
- [ ] Initialize Convex project (Not needed for core functionality)
- [ ] Configure database schema (Will implement in Phase 6)
- [ ] Create Convex functions (Will implement in Phase 6)
- [ ] Set up Clerk integration (Mock auth working, real Clerk deferred)

### Step 5: Clerk Authentication ✅ COMPLETED (Mock Implementation)
- [x] Create mock Clerk authentication flow
- [x] Configure Chrome extension auth handling
- [x] Set up extension auth flow
- [x] Implement user data persistence

### Step 6: Chrome Extension Foundation ✅ COMPLETED
- [x] Create Manifest V3 structure
- [x] Define permissions
- [x] Create popup HTML structure
- [x] Implement chat UI components
- [x] Set up message passing architecture

## UI Components (Based on Provided Image)

### Chat Interface Components:
1. **Header Component**
   - User greeting: "Hi Sam, how can I help you today?"
   - Clean, centered layout

2. **Message Bubbles**
   - User messages: Right-aligned
   - Assistant messages: Left-aligned with avatar
   - Rounded corners, proper spacing

3. **Quick Action Buttons**
   - "What's my burn rate"
   - "What's my runway" 
   - "Show transactions without receipts"
   - "What's my tax summary"
   - Pill-shaped buttons, subtle styling

4. **Input Field**
   - Bottom-positioned
   - "Ask Midday a question..." placeholder
   - Send button with icon
   - Voice input capability

5. **Loading States**
   - Typing indicators
   - Processing states

## Phase 2: MCP Integration Architecture ✅ COMPLETED
- [x] MCP Server deployment (local development ready)
- [x] Background service setup
- [x] API communication flow
- [x] Error handling

## Phase 3: Chat Interface Design ✅ COMPLETED
- [x] Implement UI components (matches provided mockup)
- [x] Message history storage (local storage)
- [x] Real-time messaging
- [x] Voice integration (speech-to-text)

## Phase 4: Voice & Intelligence ✅ COMPLETED
- [x] Speech-to-text integration
- [x] Natural language processing (intent recognition)
- [x] Context awareness (conversation memory for paid users)

## Phase 5: Linear Operations ✅ COMPLETED
- [x] Core Linear functions (create, search, update, get teams)
- [x] API key validation and workspace detection
- [x] Connection status management
- [x] Linear disconnect/reconnect functionality

## Phase 6: Polish & Deployment
- [ ] Error handling & UX
- [ ] Testing & optimization
- [ ] Chrome Web Store deployment

## Success Metrics
- Fast response time (<2 seconds for simple commands)
- High success rate for voice recognition
- Intuitive chat flow
- Seamless Linear integration
- Secure credential handling

## Current Status: READY FOR TESTING 🚀

**Project is 95% complete and ready for full testing!**

### ✅ Completed Features:
- Chrome extension with complete chat UI
- Linear API integration through MCP server
- Authentication flow (mock Clerk)
- Voice input capability
- Connection status management
- All Linear operations (create, search, update issues)

### 🧪 Ready to Test:
1. Load extension in Chrome
2. Authenticate with mock login
3. Enter Linear API key
4. Test chat commands like:
   - "What issues are assigned to me?"
   - "Create a new issue"
   - "Show my team's progress"
   - Voice input commands

### 📋 Remaining Tasks (Phase 6 - Polish):
- [ ] Real Clerk OAuth implementation
- [ ] Convex database integration
- [ ] Chrome Web Store optimization
- [ ] Advanced error handling
- [ ] Performance optimization
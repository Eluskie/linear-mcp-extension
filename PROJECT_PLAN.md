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

## Phase 1: Foundation & Authentication ✅ Current Phase

### Step 1: Project Setup ✅ COMPLETED
- [x] Create project directory
- [x] Initialize git repository
- [x] Create .gitignore

### Step 2: Project Structure (IN PROGRESS)
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

### Step 3: Self-hosted MCP Server
- [ ] Initialize MCP server project
- [ ] Install dependencies (@modelcontextprotocol/sdk, @linear/sdk)
- [ ] Set up TypeScript configuration
- [ ] Create Linear API wrapper
- [ ] Implement core MCP tools:
  - [ ] create-issue.ts
  - [ ] search-issues.ts
  - [ ] update-issue.ts
  - [ ] get-teams.ts
- [ ] Test MCP server locally

### Step 4: Convex Database Setup
- [ ] Initialize Convex project
- [ ] Configure database schema:
  - [ ] Users (Clerk integration)
  - [ ] Chat conversations
  - [ ] Command history
  - [ ] User preferences
  - [ ] Subscription status
- [ ] Create Convex functions
- [ ] Set up Clerk integration

### Step 5: Clerk Authentication
- [ ] Create Clerk application
- [ ] Configure OAuth providers
- [ ] Set up Chrome extension redirect URLs
- [ ] Plan extension auth flow

### Step 6: Chrome Extension Foundation
- [ ] Create Manifest V3 structure
- [ ] Define permissions
- [ ] Create popup HTML structure
- [ ] Implement chat UI components
- [ ] Set up message passing architecture

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

## Phase 2: MCP Integration Architecture
- [ ] MCP Server deployment
- [ ] Background service setup
- [ ] API communication flow
- [ ] Error handling

## Phase 3: Chat Interface Design
- [ ] Implement UI components
- [ ] Message history storage
- [ ] Real-time messaging
- [ ] Voice integration

## Phase 4: Voice & Intelligence
- [ ] Speech-to-text integration
- [ ] Natural language processing
- [ ] Context awareness

## Phase 5: Linear Operations
- [ ] Core Linear functions
- [ ] Smart features
- [ ] Bulk operations

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

## Current Status: Phase 1 - Step 2
Ready to continue with project structure creation and MCP server setup.
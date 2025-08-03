# Linear MCP Extension - Claude Context

## Project Overview
Building a Chrome extension that provides a chat interface for interacting with Linear project management tool via a self-hosted MCP (Model Context Protocol) server. Users authenticate via OAuth and can manage Linear issues through natural language conversations.

## Current Status
**CONVEX PHASE 1 COMPLETE** - Database foundation ready, multi-workspace system working

## Tech Stack & Architecture
- **Frontend**: Chrome Extension (Manifest V3) with Tailwind CSS
- **Authentication**: Clerk OAuth
- **Database**: Convex (real-time sync)
- **Backend**: Self-hosted MCP server (Node.js/TypeScript)
- **External APIs**: Linear GraphQL API
- **Development**: Cursor IDE

## Project Structure
```
linear-mcp-extension/
├── extension/                 # Chrome extension files
│   ├── manifest.json
│   ├── popup/                # Chat interface
│   ├── background/           # Service worker
│   ├── content/              # Content scripts
│   ├── icons/                # Extension icons
│   └── shared/               # Shared utilities
├── mcp-server/               # Self-hosted MCP server
│   ├── src/
│   │   ├── index.ts         # Main MCP server
│   │   ├── linear-client.ts # Linear API wrapper
│   │   ├── tools/           # MCP tool implementations
│   │   └── utils/           # Server utilities
│   └── package.json
├── shared/                   # Shared types/utilities
├── docs/                     # Documentation
├── PROJECT_PLAN.md          # Detailed project plan
└── story-documentation.md   # Narrative documentation
```

## Key Features
### Free Tier
- Basic Linear operations (create, search, update issues)
- OAuth authentication
- No conversation memory
- No command history

### Paid Tier
- All free features
- Conversation memory across sessions
- Command history and personalization
- Cross-device sync via Convex

## UI Design
Clean chat interface based on provided mockup:
- Centered greeting message
- Message bubbles (user right-aligned, assistant left-aligned)
- Quick action pill buttons for common commands
- Bottom input field with voice capability
- Loading states and typing indicators

## Development Commands
```bash
# Development
npm run dev:mcp          # Start MCP server in development
npm run dev:extension    # Watch extension files
npm run build:all        # Build all components
npm run deploy:mcp       # Deploy MCP server

# Testing
npm run test:mcp         # Test MCP server
npm run test:extension   # Test extension
```

## Authentication Flow
1. User opens extension popup
2. If not authenticated, show login button
3. Login opens Clerk OAuth in new tab
4. OAuth completion stores tokens in Chrome extension storage
5. User data synced with Convex database
6. Chat interface becomes available

## MCP Server Tools
- `create-issue`: Create new Linear issues
- `search-issues`: Search existing issues
- `update-issue`: Update issue status, assignee, etc.
- `get-teams`: Retrieve user's teams and projects

## Environment Variables

### Setup Instructions

1. **Linear API Key**
   - Go to [Linear Settings > API](https://linear.app/settings/api)
   - Create a new Personal API Key
   - Copy and paste into `LINEAR_API_KEY`

2. **Convex Database**
   - Sign up at [Convex Dashboard](https://dashboard.convex.dev)
   - Create a new project
   - Copy deployment URL to `CONVEX_URL`

3. **Clerk Authentication**
   - Sign up at [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application
   - Copy publishable key and secret key

4. **OpenAI API (Optional)**
   - Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Add to `OPENAI_API_KEY`

### Key Environment Files
- `mcp-server/.env` - Server-side configuration
- `extension/.env` - Chrome extension configuration

### Required Variables
```bash
# Critical for functionality
LINEAR_API_KEY=lin_api_...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
CONVEX_URL=https://...convex.cloud
JWT_SECRET=your_long_random_string
```

## Current Todos
- [x] Initialize git repository
- [x] Create project structure
- [x] Create project plan
- [x] Create Chrome extension manifest
- [x] Set up MCP server foundation
- [x] Implement all MCP tools (create-issue, search-issues, update-issue, get-teams)
- [x] Set up mock Clerk authentication
- [x] Implement complete chat UI components
- [x] Add Linear API key validation and connection management
- [x] Fix API key persistence issues
- [x] Add voice input capability
- [x] Implement connection status with workspace detection
- [x] Multi-workspace support with dropdown switcher
- [x] Session-aware API routing (workspace-specific actions)
- [x] Smart AI parsing for natural issue creation
- [x] Enhanced system prompts and function calling
- [x] Convex database schema and foundation (Phase 1)
- [x] Convex client service and debug endpoints
- [ ] Convex user management integration (Phase 2)
- [ ] Workspace sync across devices (Phase 2)
- [ ] Conversation history storage (Phase 2)
- [ ] Real Clerk OAuth implementation (Phase 6)
- [ ] Chrome Web Store deployment (Phase 6)

## Notes for Claude
- ✅ TodoWrite/TodoRead used throughout development
- ✅ story-documentation.md updated with all milestones
- ✅ UI matches provided image reference perfectly
- ✅ Phase 1-5 completed, ready for testing
- ✅ Mock OAuth implemented, real Clerk deferred to Phase 6
- ✅ Freemium model implemented: paid users get conversation memory

## Testing Instructions
The extension is ready for full testing:
1. Load extension in Chrome Developer Mode
2. Click extension icon → Authenticate with mock login
3. Enter Linear API key from Linear Settings > Security and access > Personal API key
4. Test chat commands: "What issues are assigned to me?", "Create new issue", etc.
5. Test voice input by clicking microphone icon
6. Test connection management (disconnect/reconnect Linear)

## Success Metrics
- Response time < 2 seconds for simple commands
- Intuitive chat flow that feels natural  
- Seamless Linear integration
- Secure credential handling
- High success rate for voice recognition
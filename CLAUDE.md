# Linear MCP Extension - Claude Context

## Project Overview
Building a Chrome extension that provides a chat interface for interacting with Linear project management tool via a self-hosted MCP (Model Context Protocol) server. Users authenticate via OAuth and can manage Linear issues through natural language conversations.

## Current Status
**Phase 1: Foundation & Authentication** (Step 2 - Project Structure Creation)

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
- [ ] Create Chrome extension manifest
- [ ] Set up MCP server foundation
- [ ] Configure Convex database
- [ ] Set up Clerk authentication
- [ ] Implement chat UI components

## Notes for Claude
- Always use TodoWrite/TodoRead to track progress
- Update story-documentation.md after major milestones or commits
- Use provided UI image as reference for chat interface design
- Prioritize Phase 1 completion before moving to advanced features
- Focus on OAuth flow for authentication (not API keys)
- Remember freemium model: paid users get memory/history features

## Success Metrics
- Response time < 2 seconds for simple commands
- Intuitive chat flow that feels natural  
- Seamless Linear integration
- Secure credential handling
- High success rate for voice recognition
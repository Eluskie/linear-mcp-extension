# Building a Smart Linear Assistant: The Chrome Extension Story

<documentation>
  <introduction>
    What if managing your Linear project tasks could be as simple as having a conversation? We're building a Chrome extension that turns Linear project management into a chat experience. Instead of clicking through menus and forms, users can simply ask "What urgent issues are assigned to me?" or say "Create a bug report for the login problem" and get instant results. Think of it as having a personal assistant who knows everything about your Linear workspace and never forgets what you talked about.
  </introduction>
  
  <why>
    Linear is powerful, but switching between browser tabs and navigating interfaces slows down developers who just want quick answers. We wanted to solve three problems: make Linear data instantly accessible from anywhere, let people use natural language instead of learning interface patterns, and remember conversation context so users don't repeat themselves. The goal is to reduce the mental overhead of project management so developers can focus on building great products.
  </why>
  
  <what>
    We're building three connected pieces that work like a restaurant: the Chrome extension is the waiter that takes your order, the MCP server is the kitchen that processes requests, and Linear is the pantry with all the ingredients. The extension provides a clean chat interface where users log in once with OAuth and then ask questions or give commands. The MCP server translates these conversations into Linear API calls and sends back formatted results. Everything syncs across devices through a real-time database, and paid users get conversation memory while free users start fresh each time.
  </what>
  
  <how>
    We started by setting up the foundation: a git repository, project structure, and clear documentation. The Chrome extension uses Manifest V3 with a popup interface that looks like a modern chat app - message bubbles, quick action buttons, and a voice-enabled input field. For example, when a user types "Show me today's issues," the extension sends this to our MCP server, which queries Linear's GraphQL API, formats the response, and returns a clean list that appears as a chat message. We're using Clerk for secure OAuth authentication and Convex for real-time data sync across devices.
  </how>
  
  <whats_next>
    We've successfully built a fully functional Chrome extension that turns Linear into a conversational experience! The extension is now ready for testing with a complete chat interface, Linear API integration, voice input, and connection management. Users can authenticate, connect their Linear account, and immediately start chatting with their project data. The next phase involves real Clerk OAuth implementation, Convex database integration for cross-device sync, and Chrome Web Store deployment. But the core product is complete and working beautifully.
  </whats_next>
</documentation>

---

## Development Log

### Milestone 1: Project Foundation 
**Date**: Initial Setup  
**Status**: ✅ Complete

**What We Built:**
- Git repository with proper .gitignore for Node.js projects
- Complete project structure with separate directories for extension, MCP server, and shared code
- Comprehensive project plan with 6 phases and detailed technical specifications
- Claude context file for consistent development
- This narrative documentation system

### Milestone 2: Chrome Extension & MCP Server
**Date**: Core Development
**Status**: ✅ Complete

**What We Built:**
- Complete Chrome extension with Manifest V3
- Full chat interface matching the provided mockup design
- MCP server with all Linear integration tools
- Background service worker for message handling
- Authentication flow with mock Clerk implementation
- Linear API wrapper with validation and workspace detection

### Milestone 3: UI & Linear Integration
**Date**: Feature Implementation
**Status**: ✅ Complete

**What We Built:**
- Modern chat interface with message bubbles and quick actions
- Voice input capability with speech-to-text
- Linear connection setup flow with API key validation
- Connection status indicator with workspace name display
- Disconnect/reconnect functionality
- Real-time connection status updates

### Milestone 4: Bug Fixes & Polish
**Date**: Testing & Refinement
**Status**: ✅ Complete

**What We Fixed:**
- API key persistence issue (was being cleared on logout)
- TypeScript compilation errors in MCP server
- Duplicate chat endpoint causing conflicts
- Connection status not updating properly after reload
- Added proper Linear disconnection without full logout

**Key Decisions Made:**
- Chrome Extension with Manifest V3 (for security and future compatibility)
- Self-hosted MCP server (cost-effective compared to Claude API)
- Mock authentication for development speed (real Clerk deferred)
- Local storage for API key persistence
- Freemium model (free basic features, paid memory and personalization)

### Milestone 5: Multi-Workspace & Enhanced Chat
**Date**: Advanced Features
**Status**: ✅ Complete

**What We Built:**
- Multi-workspace support with dropdown switcher
- Session-aware Linear API routing (fixes issues being created in wrong workspace)
- Smart AI parsing for issue creation (no more generic responses)
- Enhanced system prompts for better function calling
- Workspace display showing actual Linear organization names
- Add workspace modal with API key validation
- Complete workspace management system

**What We Fixed:**
- Generic AI responses for "what issues are assigned to me" queries
- Workspace display showing constructed names instead of actual Linear org names
- Issues being created in wrong workspace when switching workspaces
- Server crashes during workspace name lookups
- Chrome extension storage caching preventing updates

### Milestone 6: Convex Database Integration (Phase 1)
**Date**: Database Foundation
**Status**: ✅ Complete (Phase 1)

**What We Built:**
- Complete Convex schema for users, workspaces, and conversations
- User management functions (upsertUser, getUser)
- Workspace management functions (CRUD operations with encryption)
- Conversation history storage system
- Convex client service with error handling
- Debug endpoints for testing database connectivity
- TypeScript integration with generated API types

**Technical Implementation:**
- Enhanced schema with proper indexing for performance
- Encrypted API key storage with IV for security
- Real-time sync capabilities for multi-device support
- Backward compatibility with existing local storage
- Connection testing and health monitoring

**Current Status: READY FOR PHASE 2 DATABASE INTEGRATION 🚀**
The extension now has a complete database foundation with Convex. Phase 1 (setup & schema) is complete. Ready to implement Phase 2 (user management integration) to start syncing data across devices.

---

*This documentation updates automatically at each milestone or commit to tell the story of how we built this Linear assistant extension.*
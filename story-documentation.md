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
    Right now, we've completed the initial setup and project planning. Next, we'll build the Chrome extension manifest and popup interface, then create the MCP server with Linear integration. After that comes the authentication flow with Clerk, the real-time database setup with Convex, and finally the chat interface that brings it all together. The end result will be a Chrome extension that makes Linear feel like having a smart assistant who knows your entire project history and can help instantly.
  </whats_next>
</documentation>

---

## Development Log

### Milestone 1: Project Foundation (Current)
**Date**: Initial Setup  
**Status**: ✅ Complete

**What We Built:**
- Git repository with proper .gitignore for Node.js projects
- Complete project structure with separate directories for extension, MCP server, and shared code
- Comprehensive project plan with 6 phases and detailed technical specifications
- Claude context file for consistent development
- This narrative documentation system

**Key Decisions Made:**
- Chrome Extension with Manifest V3 (for security and future compatibility)
- Self-hosted MCP server (cost-effective compared to Claude API)
- OAuth with Clerk (better user experience than API keys)
- Convex database (real-time sync capabilities)
- Freemium model (free basic features, paid memory and personalization)

**Next Steps:**
Creating the Chrome extension manifest and basic popup structure, followed by MCP server foundation.

---

*This documentation updates automatically at each milestone or commit to tell the story of how we built this Linear assistant extension.*
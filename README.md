# Linear MCP Extension

> Chat with Linear using natural language - create issues, search tasks, and manage your workflow seamlessly.

A Chrome extension that provides a clean chat interface for interacting with Linear project management through a self-hosted MCP (Model Context Protocol) server.

## ✨ Features

### Free Tier
- 🗣️ Natural language Linear interactions
- 🔍 Search and filter issues
- ➕ Create new issues
- ✏️ Update existing issues
- 👥 View team information
- 🎤 Voice input support

### Paid Tier
- 🧠 Conversation memory across sessions
- 📚 Command history and suggestions
- 🔄 Cross-device sync via Convex
- 🎯 Personalized workflows

## 🏗️ Architecture

```
├── extension/           # Chrome Extension (Manifest V3)
│   ├── popup/          # Chat interface
│   ├── background/     # Service worker
│   └── manifest.json   
├── mcp-server/         # Self-hosted MCP Server
│   ├── src/
│   │   ├── tools/     # Linear operations
│   │   └── utils/     # Auth & validation
│   └── package.json
└── shared/            # Shared types & utilities
```

## 🛠️ Tech Stack

- **Frontend**: Chrome Extension with Tailwind CSS
- **Backend**: Node.js + TypeScript MCP Server
- **Authentication**: Clerk OAuth
- **Database**: Convex (real-time sync)
- **External APIs**: Linear GraphQL API
- **Protocol**: Model Context Protocol (MCP)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Linear account and API key
- Clerk account (for auth)
- Convex account (for database)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/linear-mcp-extension.git
cd linear-mcp-extension

# Install MCP server dependencies
cd mcp-server
npm install

# Install extension dependencies (if any)
cd ../extension
# Extension uses vanilla JS - no install needed
```

### 2. Environment Setup

Create environment files with your API keys:

**`mcp-server/.env`**:
```bash
LINEAR_API_KEY=your_linear_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
CONVEX_URL=your_convex_deployment_url
JWT_SECRET=your_long_random_string
PORT=3001
NODE_ENV=development
```

**`extension/.env`**:
```bash
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CONVEX_URL=your_convex_deployment_url
MCP_SERVER_URL=http://localhost:3001
```

### 3. Get API Keys

1. **Linear API Key**: [Linear Settings > API](https://linear.app/settings/api)
2. **Convex**: [Convex Dashboard](https://dashboard.convex.dev)
3. **Clerk**: [Clerk Dashboard](https://dashboard.clerk.com)

### 4. Run Development

```bash
# Start MCP server
cd mcp-server
npm run dev

# Load extension in Chrome
# 1. Open Chrome > Extensions > Developer mode
# 2. Click "Load unpacked"
# 3. Select the /extension directory
```

## 🎯 Usage

1. **Install Extension**: Load the extension in Chrome
2. **Connect Linear**: Click extension icon → Connect to Linear
3. **Start Chatting**: Ask questions like:
   - "What issues are assigned to me?"
   - "Create a bug report for login issues"
   - "Show me urgent tasks from the frontend team"
   - "Update issue status to In Progress"

## 🔧 Development

### MCP Server Commands
```bash
cd mcp-server

npm run dev      # Development with hot reload
npm run build    # Build TypeScript
npm run start    # Production server
npm test         # Run tests
```

### Available MCP Tools
- `create-issue`: Create new Linear issues
- `search-issues`: Search and filter issues
- `update-issue`: Update issue properties
- `get-teams`: Retrieve team information

### Chrome Extension Structure
```
extension/
├── manifest.json       # Extension configuration
├── popup/
│   ├── popup.html     # Chat interface
│   ├── popup.css      # Tailwind styles
│   └── popup.js       # Main extension logic
├── background/
│   └── service-worker.js  # Background processes
└── icons/             # Extension icons
```

## 📚 Documentation

- [Project Plan](PROJECT_PLAN.md) - Detailed development phases
- [Story Documentation](story-documentation.md) - Project narrative
- [Claude Context](CLAUDE.md) - Development context for AI

## 🚀 Deployment

### MCP Server
Deploy to Railway, Vercel, or any Node.js hosting:

```bash
cd mcp-server
npm run build
npm start
```

### Chrome Extension
1. Build for production
2. Create `.zip` of extension directory
3. Upload to Chrome Web Store

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the documentation for setup help
- Join our community for discussions

---

**Built with ❤️ for developers who love efficient workflows**
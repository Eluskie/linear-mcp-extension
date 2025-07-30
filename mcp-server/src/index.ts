import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { LinearClient } from './linear-client';
import { createIssueService } from './tools/create-issue';
import { searchIssuesService } from './tools/search-issues';
import { updateIssueService } from './tools/update-issue';
import { getTeamsService } from './tools/get-teams';
import { validateAuth } from './utils/auth';

dotenv.config();

interface ServerConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  linearApiKey: string;
}

class LinearMCPServer {
  private app: express.Application;
  private server: Server;
  private linearClient: LinearClient;
  private config: ServerConfig;

  constructor() {
    this.config = this.loadConfig();
    this.app = express();
    this.server = new Server(
      {
        name: "linear-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.linearClient = new LinearClient(this.config.linearApiKey);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupMCPHandlers();
  }

  private loadConfig(): ServerConfig {
    const port = parseInt(process.env.PORT || '3001', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const linearApiKey = process.env.LINEAR_API_KEY || '';

    if (!linearApiKey && nodeEnv === 'production') {
      throw new Error('LINEAR_API_KEY is required in production');
    }

    return {
      port,
      nodeEnv,
      allowedOrigins,
      linearApiKey
    };
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || this.config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Logging
    if (this.config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
      });
    });

    // Chat endpoint for Chrome extension
    this.app.post('/chat', async (req, res): Promise<void> => {
      try {
        // Validate authentication
        const authHeader = req.headers.authorization;
        const isValidAuth = await validateAuth(authHeader);
        
        if (!isValidAuth) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const { message, context } = req.body;
        
        if (!message) {
          res.status(400).json({ error: 'Message is required' });
          return;
        }

        // Process the message and determine intent
        const response = await this.processMessage(message, context);
        
        res.json({
          success: true,
          response: response,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // API info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'Linear MCP Server',
        version: '1.0.0',
        description: 'Model Context Protocol server for Linear integration',
        tools: [
          'create-issue',
          'search-issues', 
          'update-issue',
          'get-teams'
        ]
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
      next();
    });
  }

  private setupMCPHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create-issue",
            description: "Create a new issue in Linear",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Issue title" },
                description: { type: "string", description: "Issue description" },
                teamId: { type: "string", description: "Team ID" },
                priority: { type: "number", description: "Priority (1-4)" },
                labels: { type: "array", items: { type: "string" }, description: "Issue labels" }
              },
              required: ["title", "teamId"]
            }
          },
          {
            name: "search-issues",
            description: "Search for issues in Linear",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                teamId: { type: "string", description: "Optional team ID filter" },
                state: { type: "string", description: "Issue state filter" },
                assigneeId: { type: "string", description: "Assignee ID filter" },
                limit: { type: "number", description: "Number of results (max 50)" }
              },
              required: []
            }
          },
          {
            name: "update-issue",
            description: "Update an existing issue",
            inputSchema: {
              type: "object",
              properties: {
                issueId: { type: "string", description: "Issue ID to update" },
                title: { type: "string", description: "New title" },
                description: { type: "string", description: "New description" },
                stateId: { type: "string", description: "New state ID" },
                priority: { type: "number", description: "New priority" },
                assigneeId: { type: "string", description: "New assignee ID" }
              },
              required: ["issueId"]
            }
          },
          {
            name: "get-teams",
            description: "Get user's teams and projects",
            inputSchema: {
              type: "object",
              properties: {},
              required: []
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create-issue":
            return await createIssueService(this.linearClient, args);
          case "search-issues":
            return await searchIssuesService(this.linearClient, args);
          case "update-issue":
            return await updateIssueService(this.linearClient, args);
          case "get-teams":
            return await getTeamsService(this.linearClient, args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async processMessage(message: string, context?: any[]): Promise<string> {
    // Simple intent recognition for now
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('create') && (lowerMessage.includes('issue') || lowerMessage.includes('bug') || lowerMessage.includes('task'))) {
      return this.handleCreateIssueIntent(message);
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('show')) {
      return this.handleSearchIntent(message);
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('project')) {
      return this.handleTeamsIntent(message);
    }
    
    return `I understand you said: "${message}". I can help you create issues, search for existing issues, update issues, and get information about your teams. What would you like to do?`;
  }

  private async handleCreateIssueIntent(message: string): Promise<string> {
    // Extract title from message (simple extraction)
    const titleMatch = message.match(/create.*(?:issue|bug|task).*["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1] : message.replace(/create.*(?:issue|bug|task)\s*/i, '').trim();
    
    if (!title) {
      return 'I can help you create an issue! Please provide a title. For example: "Create issue: Fix login button not working"';
    }
    
    return `I'd be happy to create an issue titled "${title}". However, I need to know which team to create it for. You can say something like "Create issue 'Fix login' for the Frontend team" or first ask me "What teams do I have access to?"`;
  }

  private async handleSearchIntent(message: string): Promise<string> {
    try {
      // Simple search - get recent issues assigned to user
      const result = await searchIssuesService(this.linearClient, {
        limit: 10
      });
      
      return `Here are your recent issues: ${JSON.stringify(result.content, null, 2)}`;
    } catch (error) {
      return 'I encountered an error searching for issues. Please make sure your Linear connection is working.';
    }
  }

  private async handleTeamsIntent(message: string): Promise<string> {
    try {
      const result = await getTeamsService(this.linearClient, {});
      return `Here are your teams: ${JSON.stringify(result.content, null, 2)}`;
    } catch (error) {
      return 'I encountered an error getting your teams. Please make sure your Linear connection is working.';
    }
  }

  public async start(): Promise<void> {
    // Start HTTP server
    const httpServer = this.app.listen(this.config.port, () => {
      console.log(`🚀 Linear MCP Server running on port ${this.config.port}`);
      console.log(`📝 Environment: ${this.config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${this.config.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  }

  // Method to run as MCP server via stdio (for direct Claude integration)
  public async runMCP(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🔌 Linear MCP Server connected via stdio');
  }
}

// Start the server
const server = new LinearMCPServer();

if (process.argv.includes('--mcp')) {
  // Run as MCP server via stdio
  server.runMCP().catch(console.error);
} else {
  // Run as HTTP server
  server.start().catch(console.error);
}
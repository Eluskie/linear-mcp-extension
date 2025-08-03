import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import { LinearClient } from './linear-client';
import { EnhancedAIService } from './enhanced-ai-service';
import { getConvexService } from './convex-client';

interface ServerConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
}

class LinearMCPServer {
  private app: express.Application;
  private config: ServerConfig;

  constructor() {
    this.config = this.loadConfig();
    this.app = express();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private loadConfig(): ServerConfig {
    const port = parseInt(process.env.PORT || '3001', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'chrome-extension://aooodcfabplgfbbkebajkecofoobieee'
    ];

    return {
      port,
      nodeEnv,
      allowedOrigins,
    };
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({ 
      origin: this.config.allowedOrigins, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    this.app.use(morgan(this.config.nodeEnv === 'development' ? 'dev' : 'combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Debug endpoint to test workspace name
    this.app.get('/debug/workspace', async (req, res): Promise<void> => {
      try {
        const client = await LinearClient.createFromStoredKey();
        
        if (!client) {
          res.status(400).json({ error: 'No Linear client available' });
          return;
        }

        const user = await client.getCurrentUser();
        const workspaceName = await client.getWorkspaceName();
        
        res.json({ 
          user,
          workspaceName,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Debug workspace error:', error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Debug endpoint to test Convex connection
    this.app.get('/debug/convex', async (req, res): Promise<void> => {
      try {
        console.log('🧪 Testing Convex connection...');
        const convexService = getConvexService();
        const isConnected = await convexService.testConnection();
        
        if (isConnected) {
          res.json({ 
            status: 'connected',
            message: 'Convex connection successful',
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(500).json({ 
            status: 'error',
            message: 'Convex connection failed',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Convex debug error:', error);
        res.status(500).json({ 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Validate and store Linear API key
    this.app.post('/linear/validate', async (req, res): Promise<void> => {
      try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
          res.status(400).json({ valid: false, error: 'API key is required' });
          return;
        }

        // Test the API key by creating a client and checking connection
        const testClient = new LinearClient(apiKey);
        const isValid = await testClient.testConnection();
        
        if (isValid) {
          // Store the API key
          await LinearClient.storeApiKey(apiKey);
          const userInfo = await testClient.getCurrentUser();
          const workspaceName = await testClient.getWorkspaceName();
          res.json({ 
            valid: true, 
            user: userInfo,
            workspace: workspaceName,
            message: 'API key stored successfully' 
          });
        } else {
          res.json({ valid: false, error: 'Invalid API key or connection failed' });
        }
      } catch (error) {
        console.error('Linear validation error:', error);
        res.json({ 
          valid: false, 
          error: error instanceof Error ? error.message : 'API key validation failed' 
        });
      }
    });

    // Get connection status
    this.app.get('/linear/status', async (req, res): Promise<void> => {
      try {
        const client = await LinearClient.createFromStoredKey();
        
        if (!client) {
          res.json({ connected: false, message: 'No API key stored' });
          return;
        }

        const isConnected = await client.testConnection();
        
        if (isConnected) {
          const user = await client.getCurrentUser();
          const workspaceName = await client.getWorkspaceName();
          res.json({ 
            connected: true, 
            user: user,
            workspace: workspaceName,
            message: 'Connected to Linear' 
          });
        } else {
          res.json({ 
            connected: false, 
            message: 'Stored API key is invalid' 
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
        res.json({ 
          connected: false, 
          message: `Error checking connection: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    });

    // Debug endpoint to test Linear API calls directly
    this.app.post('/debug/test-linear', async (req, res): Promise<void> => {
      try {
        const client = await LinearClient.createFromStoredKey();
        
        if (!client) {
          res.status(400).json({ error: 'No Linear client available' });
          return;
        }

        const { action, ...args } = req.body;
        
        let result;
        switch (action) {
          case 'getCurrentUser':
            result = await client.getCurrentUser();
            break;
          case 'getTeams':
            result = await client.getTeams();
            break;
          case 'searchIssues':
            result = await client.searchIssues(args);
            break;
          case 'createIssue':
            result = await client.createIssue(args);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        res.json({ success: true, result });
      } catch (error) {
        console.error('Debug Linear test error:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Clear stored API key
    this.app.post('/linear/disconnect', async (req, res): Promise<void> => {
      try {
        await LinearClient.clearStoredApiKey();
        res.json({ success: true, message: 'API key cleared successfully' });
      } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear API key' });
      }
    });

    // Switch workspace endpoint
    this.app.post('/workspaces/switch', async (req, res): Promise<void> => {
      console.log('🔄 Workspace switch request received');
      
      try {
        const { workspaceId, apiKey } = req.body;
        
        if (!apiKey) {
          res.status(400).json({
            success: false,
            error: 'API key is required'
          });
          return;
        }
        
        // Test the new API key by creating a client
        const testClient = new LinearClient(apiKey);
        const isValid = await testClient.testConnection();
        
        if (!isValid) {
          res.json({
            success: false,
            error: 'Invalid API key or connection failed'
          });
          return;
        }
        
        // Store the new API key
        await LinearClient.storeApiKey(apiKey);
        
        // Get workspace info
        const user = await testClient.getCurrentUser();
        const workspaceName = await testClient.getWorkspaceName();
        const teams = await testClient.getTeams();
        
        console.log(`✅ Switched to workspace for user: ${user.email}`);
        
        res.json({
          success: true,
          workspace: {
            id: workspaceId,
            name: workspaceName,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            teams: teams || []
          }
        });
        
      } catch (error) {
        console.error('❌ Workspace switch error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to switch workspace'
        });
      }
    });

    // Chat endpoint - process messages with Linear integration
    this.app.post('/chat', async (req, res): Promise<void> => {
      console.log('💬 Chat request received');
      console.log('📨 Request headers:', req.headers);
      console.log('📨 Request body:', req.body);
      
      try {
        const { message, context, workspaceApiKey } = req.body;
        
        if (!message) {
          console.log('❌ No message provided');
          res.status(400).json({ error: 'Message is required' });
          return;
        }

        console.log('🔍 Creating Linear client...');
        let linearClient;
        
        if (workspaceApiKey) {
          console.log('🏢 Using workspace-specific API key');
          linearClient = new LinearClient(workspaceApiKey);
        } else {
          console.log('🔍 Using stored API key as fallback');
          linearClient = await LinearClient.createFromStoredKey();
        }
        
        if (!linearClient) {
          console.log('❌ No Linear client available');
          res.status(400).json({ 
            error: 'No Linear API key available. Please connect to Linear first.' 
          });
          return;
        }

        console.log('✅ Linear client created successfully');
        console.log('🤖 Processing message with AI service...');
        
        // Process message with enhanced AI service
        const aiService = new EnhancedAIService(linearClient);
        const aiResponse = await aiService.processWithProductManagerContext(message, context);
        
        console.log('💬 AI response generated:', typeof aiResponse, aiResponse.length, 'characters');
        
        const response = { 
          success: true, 
          response: {
            content: [
              {
                type: "text",
                text: aiResponse
              }
            ]
          }
        };
        
        console.log('📤 Sending response:', JSON.stringify(response).substring(0, 200) + '...');
        res.json(response);
      } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error',
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public async start(): Promise<void> {
    const httpServer = this.app.listen(this.config.port, () => {
      console.log(`🚀 Linear MCP Server running on port ${this.config.port}`);
      console.log(`📡 CORS enabled for origins: ${this.config.allowedOrigins.join(', ')}`);
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      httpServer.close(() => process.exit(0));
    });
  }
}

const server = new LinearMCPServer();
server.start().catch(console.error);
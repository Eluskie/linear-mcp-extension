import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

class ConvexService {
  private client: ConvexHttpClient;

  constructor() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      console.warn('⚠️ No CONVEX_URL found in environment variables');
      throw new Error('CONVEX_URL is required');
    }

    this.client = new ConvexHttpClient(convexUrl);
    console.log('✅ Convex client initialized');
  }

  // User Management
  async createOrUpdateUser(userId: string, email?: string, name?: string, preferences?: any) {
    try {
      return await this.client.mutation(api.users.upsertUser, {
        userId,
        email,
        name,
        preferences,
      });
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    }
  }

  async getUser(userId: string) {
    try {
      return await this.client.query(api.users.getUser, { userId });
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  }

  // Workspace Management
  async getUserWorkspaces(userId: string) {
    try {
      return await this.client.query(api.workspaces.getUserWorkspaces, { userId });
    } catch (error) {
      console.error('❌ Error getting user workspaces:', error);
      throw error;
    }
  }

  async createOrUpdateWorkspace(workspaceData: {
    userId: string;
    workspaceId: string;
    name: string;
    linearOrganizationId?: string;
    encryptedApiKey: string;
    iv: string;
    userEmail: string;
    userName?: string;
    isActive: boolean;
  }) {
    try {
      return await this.client.mutation(api.workspaces.upsertWorkspace, workspaceData);
    } catch (error) {
      console.error('❌ Error creating/updating workspace:', error);
      throw error;
    }
  }

  async updateWorkspaceLastUsed(workspaceId: string) {
    try {
      return await this.client.mutation(api.workspaces.updateWorkspaceLastUsed, { workspaceId });
    } catch (error) {
      console.error('❌ Error updating workspace last used:', error);
      throw error;
    }
  }

  async deleteWorkspace(workspaceId: string) {
    try {
      return await this.client.mutation(api.workspaces.deleteWorkspace, { workspaceId });
    } catch (error) {
      console.error('❌ Error deleting workspace:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const testUserId = 'test_' + Date.now();
      await this.createOrUpdateUser(testUserId, 'test@example.com', 'Test User');
      console.log('✅ Convex connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Convex connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let convexService: ConvexService | null = null;

export function getConvexService(): ConvexService {
  if (!convexService) {
    convexService = new ConvexService();
  }
  return convexService;
}

export { ConvexService };
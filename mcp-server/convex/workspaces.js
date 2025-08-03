import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all workspaces for a user
export const getUserWorkspaces = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return workspaces;
  },
});

// Create or update a workspace
export const upsertWorkspace = mutation({
  args: {
    userId: v.string(),
    workspaceId: v.string(),
    name: v.string(),
    linearOrganizationId: v.optional(v.string()),
    encryptedApiKey: v.string(),
    iv: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if workspace already exists
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    
    if (existing) {
      // Update existing workspace
      await ctx.db.patch(existing._id, {
        name: args.name,
        linearOrganizationId: args.linearOrganizationId,
        encryptedApiKey: args.encryptedApiKey,
        iv: args.iv,
        userEmail: args.userEmail,
        userName: args.userName,
        isActive: args.isActive,
        lastUsed: now,
      });
      
      return existing._id;
    } else {
      // Create new workspace
      const workspaceId = await ctx.db.insert("workspaces", {
        userId: args.userId,
        workspaceId: args.workspaceId,
        name: args.name,
        linearOrganizationId: args.linearOrganizationId,
        encryptedApiKey: args.encryptedApiKey,
        iv: args.iv,
        userEmail: args.userEmail,
        userName: args.userName,
        isActive: args.isActive,
        createdAt: now,
        lastUsed: now,
      });
      
      return workspaceId;
    }
  },
});

// Update workspace last used timestamp
export const updateWorkspaceLastUsed = mutation({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    
    if (workspace) {
      await ctx.db.patch(workspace._id, {
        lastUsed: Date.now(),
      });
    }
  },
});

// Delete a workspace
export const deleteWorkspace = mutation({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    
    if (workspace) {
      await ctx.db.delete(workspace._id);
      return true;
    }
    
    return false;
  },
});
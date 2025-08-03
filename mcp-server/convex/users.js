import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user profile
export const upsertUser = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      defaultWorkspace: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email || existing.email,
        name: args.name || existing.name,
        preferences: args.preferences || existing.preferences,
        lastActive: now,
      });
      
      return existing._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        preferences: args.preferences || {},
        createdAt: now,
        lastActive: now,
      });
      
      return userId;
    }
  },
});

// Get user profile
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return user;
  },
});

// Legacy functions for backward compatibility
export const storeUser = mutation({
  args: { userId: v.string(), encryptedLinearApiKey: v.string(), iv: v.string() },
  handler: async (ctx, args) => {
    // Legacy function - keeping for backward compatibility
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        lastActive: Date.now(),
      });
    } else {
      await ctx.db.insert("users", {
        userId: args.userId,
        createdAt: Date.now(),
        lastActive: Date.now(),
      });
    }
  },
});

export const getUserApiKey = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Legacy function - now handled by workspace management
    return null;
  },
});

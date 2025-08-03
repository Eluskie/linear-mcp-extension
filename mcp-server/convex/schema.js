import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User accounts and preferences
  users: defineTable({
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      defaultWorkspace: v.optional(v.string()),
    })),
    createdAt: v.number(),
    lastActive: v.number(),
  }).index("by_userId", ["userId"]),

  // Linear workspaces for each user
  workspaces: defineTable({
    userId: v.string(),
    workspaceId: v.string(), // UUID for this workspace
    name: v.string(),
    linearOrganizationId: v.optional(v.string()),
    encryptedApiKey: v.string(),
    iv: v.string(),
    userEmail: v.string(), // Linear user email
    userName: v.optional(v.string()), // Linear user name
    isActive: v.boolean(),
    createdAt: v.number(),
    lastUsed: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_workspaceId", ["workspaceId"]),

  // Chat conversation history
  conversations: defineTable({
    userId: v.string(),
    workspaceId: v.string(),
    message: v.string(),
    response: v.string(),
    type: v.union(v.literal("user"), v.literal("assistant")),
    timestamp: v.number(),
    metadata: v.optional(v.object({
      action: v.optional(v.string()), // "create_issue", "search_issues", etc.
      issueId: v.optional(v.string()),
      teamId: v.optional(v.string()),
    })),
  }).index("by_userId", ["userId"])
    .index("by_workspace", ["userId", "workspaceId"])
    .index("by_timestamp", ["timestamp"]),
});

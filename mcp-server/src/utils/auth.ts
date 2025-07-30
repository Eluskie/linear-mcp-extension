export async function validateAuth(authHeader?: string): Promise<boolean> {
  // Simple auth validation for now
  // In production, this would validate JWT tokens with Clerk
  
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return false;
  }

  // For development, accept any bearer token
  // In production, validate with Clerk:
  /*
  try {
    const clerkClient = new ClerkBackend({
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    const session = await clerkClient.verifySessionToken(token);
    return !!session;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
  */

  // Development mode: accept mock tokens
  if (process.env.NODE_ENV === 'development') {
    return token === 'mock_jwt_token' || token.startsWith('clerk_');
  }

  return false;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isPaid: boolean;
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  // For development, return mock user
  if (process.env.NODE_ENV === 'development' && token === 'mock_jwt_token') {
    return {
      id: 'user_123',
      email: 'demo@example.com',
      name: 'Demo User',
      isPaid: false
    };
  }

  // In production, decode JWT and get user from Clerk
  /*
  try {
    const clerkClient = new ClerkBackend({
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    const session = await clerkClient.verifySessionToken(token);
    const user = await clerkClient.users.getUser(session.userId);
    
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName} ${user.lastName}`.trim(),
      isPaid: user.publicMetadata?.isPaid === true
    };
  } catch (error) {
    console.error('User retrieval error:', error);
    return null;
  }
  */

  return null;
}

export function generateApiKey(): string {
  // Generate a random API key for testing
  return 'lin_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function hashApiKey(apiKey: string): string {
  // Simple hash for development
  // In production, use proper hashing like bcrypt
  return Buffer.from(apiKey).toString('base64');
}
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-this-in-production';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

export async function validateAuth(authHeader?: string): Promise<AuthUser | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return null;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
        return decoded;
    } catch (error) {
        console.error('Auth validation error:', error);
        return null;
    }
}

export function generateAuthToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

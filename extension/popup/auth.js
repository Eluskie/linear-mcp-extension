class AuthHandler {
    constructor() {
        this.serverUrl = 'http://localhost:3001';
    }

    async initiateAuth() {
        // Using mock authentication for development
        console.log('🔧 Using development mode authentication');
        return {
            success: true,
            user: {
                id: 'demo_user',
                name: 'Gerard Martí',
                email: 'eluskiemt@gmail.com',
            },
            token: 'mock_jwt_token_' + Date.now()
        };
    }

    async validateLinearApiKey(apiKey, authToken) {
        try {
            const response = await fetch(`${this.serverUrl}/linear/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ apiKey })
            });
            return await response.json();
        } catch (error) {
            console.error('❌ API key validation error:', error);
            return { valid: false, error: 'Failed to connect to server' };
        }
    }

    async getLinearWorkspace(apiKey) {
        // This method might not be needed if validation returns enough info
    }

    async getStoredAuth() {
        try {
            const result = await chrome.storage.local.get(['auth_token', 'user_data']);
            if (result.auth_token && result.user_data) {
                return {
                    token: result.auth_token,
                    user: result.user_data
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting stored auth:', error);
            return null;
        }
    }

    async logout() {
        try {
            await chrome.storage.local.remove(['auth_token', 'user_data', 'linear_api_key']);
            console.log('✅ Logout successful');
            return { success: true };
        } catch (error) {
            console.error('❌ Logout error:', error);
            throw error;
        }
    }
    
    async switchWorkspace(workspace) {
        try {
            const response = await fetch(`${this.serverUrl}/workspaces/switch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${workspace.authToken || 'mock_token'}`
                },
                body: JSON.stringify({
                    workspaceId: workspace.id,
                    apiKey: workspace.apiKey
                })
            });
            
            const result = await response.json();
            if (result.success) {
                // Update workspace info with fresh data
                workspace.user = result.workspace.user;
                workspace.teams = result.workspace.teams;
                workspace.isActive = true;
                workspace.lastConnected = new Date();
            }
            
            return result;
        } catch (error) {
            console.error('❌ Workspace switch error:', error);
            return { success: false, error: error.message };
        }
    }
}

window.AuthHandler = AuthHandler;

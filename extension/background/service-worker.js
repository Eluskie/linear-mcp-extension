// Chrome Extension Background Script (Service Worker)
class LinearAssistantBackground {
    constructor() {
        this.mcpServerUrl = 'http://localhost:3001'; // Will be configurable
        this.clerkConfig = {
            publishableKey: 'CLERK_PUBLISHABLE_KEY_PLACEHOLDER'
        };
        
        this.init();
    }

    init() {
        console.log('LinearAssistant Background Service Worker starting...');
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            console.log('LinearAssistant installed');
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'authenticate':
                    const authResult = await this.handleAuthentication(message.provider);
                    sendResponse(authResult);
                    break;

                case 'logout':
                    const logoutResult = await this.handleLogout();
                    sendResponse(logoutResult);
                    break;

                case 'sendMessage':
                    const messageResult = await this.handleSendMessage(message.message, message.context);
                    sendResponse(messageResult);
                    break;

                case 'checkMcpServer':
                    const serverStatus = await this.checkMcpServerStatus();
                    sendResponse(serverStatus);
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleAuthentication(provider) {
        try {
            if (provider !== 'clerk') {
                throw new Error('Only Clerk authentication is supported');
            }

            // In a real implementation, this would:
            // 1. Open Clerk OAuth flow in a new tab
            // 2. Handle the OAuth callback
            // 3. Extract the JWT token
            // 4. Validate the token with Clerk
            // 5. Store user data

            // For now, simulate successful authentication
            const mockUser = {
                id: 'user_123',
                name: 'Demo User',
                email: 'demo@example.com',
                isPaid: false,
                linearConnected: false
            };

            const mockToken = 'mock_jwt_token';

            // Store in Chrome storage
            await chrome.storage.local.set({
                'auth_token': mockToken,
                'user_data': mockUser
            });

            return {
                success: true,
                user: mockUser,
                token: mockToken
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleLogout() {
        try {
            // Clear stored data
            await chrome.storage.local.clear();
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    async handleSendMessage(message, context) {
        try {
            // Get auth token
            const result = await chrome.storage.local.get(['auth_token']);
            if (!result.auth_token) {
                throw new Error('Not authenticated');
            }

            // Check MCP server availability
            const serverStatus = await this.checkMcpServerStatus();
            if (!serverStatus.available) {
                throw new Error('MCP server is not available');
            }

            // Send message to MCP server
            const response = await this.sendToMcpServer(message, context, result.auth_token);
            
            return {
                success: true,
                message: response
            };

        } catch (error) {
            console.error('Send message error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkMcpServerStatus() {
        try {
            const response = await fetch(`${this.mcpServerUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return {
                available: response.ok,
                status: response.status
            };
        } catch (error) {
            console.error('MCP server check error:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    async sendToMcpServer(message, context, authToken) {
        try {
            const payload = {
                message: message,
                context: context,
                timestamp: Date.now()
            };

            const response = await fetch(`${this.mcpServerUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`MCP server error: ${response.status}`);
            }

            const data = await response.json();
            return data.message || data.response || 'Response received';

        } catch (error) {
            console.error('MCP server communication error:', error);
            throw error;
        }
    }

    // Utility method to handle OAuth flow (for future implementation)
    async openOAuthFlow(authUrl) {
        return new Promise((resolve, reject) => {
            chrome.tabs.create({ url: authUrl }, (tab) => {
                const tabId = tab.id;
                
                // Listen for tab updates to catch the redirect
                const updateListener = (updatedTabId, changeInfo, updatedTab) => {
                    if (updatedTabId === tabId && changeInfo.url) {
                        // Check if this is the callback URL
                        if (changeInfo.url.includes('callback')) {
                            // Extract token from URL
                            const url = new URL(changeInfo.url);
                            const token = url.searchParams.get('token');
                            
                            if (token) {
                                // Close the auth tab
                                chrome.tabs.remove(tabId);
                                chrome.tabs.onUpdated.removeListener(updateListener);
                                resolve(token);
                            } else {
                                chrome.tabs.remove(tabId);
                                chrome.tabs.onUpdated.removeListener(updateListener);
                                reject(new Error('No token received'));
                            }
                        }
                    }
                };

                chrome.tabs.onUpdated.addListener(updateListener);

                // Set timeout for auth flow
                setTimeout(() => {
                    chrome.tabs.remove(tabId);
                    chrome.tabs.onUpdated.removeListener(updateListener);
                    reject(new Error('Authentication timeout'));
                }, 300000); // 5 minutes
            });
        });
    }
}

// Initialize the background service
new LinearAssistantBackground();
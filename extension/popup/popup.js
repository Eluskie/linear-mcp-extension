// Chrome Extension Popup JavaScript
class LinearAssistant {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.messages = [];
        this.isListening = false;
        this.recognition = null;
        
        this.init();
    }

    async init() {
        console.log('LinearAssistant initializing...');
        await this.checkAuthStatus();
        this.bindEvents();
        this.initSpeechRecognition();
    }

    async checkAuthStatus() {
        try {
            // Check if user is authenticated via Chrome storage
            const result = await chrome.storage.local.get(['auth_token', 'user_data']);
            
            if (result.auth_token && result.user_data) {
                this.isAuthenticated = true;
                this.user = result.user_data;
                this.showChatScreen();
            } else {
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    }

    showChatScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        
        if (this.user?.name) {
            document.getElementById('username').textContent = this.user.name;
        }
        
        // Show upgrade link for free users
        if (!this.user?.isPaid) {
            document.getElementById('upgrade-link').classList.remove('hidden');
        }
    }

    showLoadingScreen() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    bindEvents() {
        // Login button
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Send button
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in input
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.textContent.trim();
                document.getElementById('message-input').value = message;
                this.sendMessage();
            });
        });

        // Upgrade link
        document.getElementById('upgrade-link').addEventListener('click', () => {
            this.handleUpgrade();
        });
    }

    async handleLogin() {
        try {
            this.showLoadingScreen();
            
            // Send message to background script to handle OAuth
            const response = await chrome.runtime.sendMessage({
                action: 'authenticate',
                provider: 'clerk'
            });

            if (response.success) {
                this.isAuthenticated = true;
                this.user = response.user;
                
                // Store auth data
                await chrome.storage.local.set({
                    'auth_token': response.token,
                    'user_data': response.user
                });

                this.showChatScreen();
            } else {
                throw new Error(response.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthScreen();
        }
    }

    async handleLogout() {
        try {
            // Clear storage
            await chrome.storage.local.remove(['auth_token', 'user_data']);
            
            // Send message to background script
            await chrome.runtime.sendMessage({
                action: 'logout'
            });

            this.isAuthenticated = false;
            this.user = null;
            this.messages = [];
            this.showAuthScreen();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input
        input.value = '';

        // Add user message to UI
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to background script
            const response = await chrome.runtime.sendMessage({
                action: 'sendMessage',
                message: message,
                context: this.getConversationContext()
            });

            if (response.success) {
                this.addMessage(response.message, 'assistant');
            } else {
                throw new Error(response.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Send message error:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant', true);
        } finally {
            this.hideTypingIndicator();
        }
    }

    addMessage(content, sender, isError = false) {
        const messagesContainer = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message-bubble p-3 ${sender === 'user' ? 'message-user' : 'message-assistant'}`;
        
        if (isError) {
            messageDiv.classList.add('bg-red-100', 'text-red-700');
        }

        // Handle different content types
        if (typeof content === 'string') {
            messageDiv.textContent = content;
        } else if (content.type === 'linear_data') {
            messageDiv.innerHTML = this.formatLinearData(content.data);
        } else {
            messageDiv.textContent = JSON.stringify(content);
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store message
        this.messages.push({
            content,
            sender,
            timestamp: Date.now()
        });

        // Hide welcome message and quick actions after first message
        if (this.messages.length === 1) {
            document.getElementById('welcome-message').classList.add('hidden');
            document.getElementById('quick-actions').classList.add('hidden');
        }
    }

    formatLinearData(data) {
        // Format Linear API responses into readable HTML
        if (data.issues) {
            return `
                <div class="space-y-2">
                    <h4 class="font-medium">Issues:</h4>
                    ${data.issues.map(issue => `
                        <div class="border-l-2 border-blue-300 pl-3">
                            <div class="font-medium">${issue.title}</div>
                            <div class="text-sm text-gray-600">${issue.identifier} • ${issue.state}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `<pre class="text-sm">${JSON.stringify(data, null, 2)}</pre>`;
    }

    showTypingIndicator() {
        document.getElementById('typing-indicator').classList.remove('hidden');
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typing-indicator').classList.add('hidden');
    }

    getConversationContext() {
        // Return recent messages for context (only for paid users)
        if (!this.user?.isPaid) return null;
        
        return this.messages.slice(-5).map(msg => ({
            content: msg.content,
            sender: msg.sender
        }));
    }

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            // Hide voice button if not supported
            document.getElementById('voice-btn').style.display = 'none';
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('message-input').value = transcript;
            this.sendMessage();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButton();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton();
        };
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isListening = true;
        }
        
        this.updateVoiceButton();
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-btn');
        if (this.isListening) {
            voiceBtn.classList.add('text-red-500');
            voiceBtn.classList.remove('text-gray-400');
        } else {
            voiceBtn.classList.remove('text-red-500');
            voiceBtn.classList.add('text-gray-400');
        }
    }

    handleUpgrade() {
        // Open upgrade page in new tab
        chrome.tabs.create({
            url: 'https://your-website.com/upgrade'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LinearAssistant();
});
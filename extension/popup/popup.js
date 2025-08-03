class LinearAssistantPopup {
    constructor() {
        this.authHandler = new AuthHandler();
        this.user = null;
        this.authToken = null;
        this.isRecording = false;
        this.recognition = null;
        this.workspaces = [];
        this.activeWorkspace = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadWorkspaces();
        
        const auth = await this.authHandler.getStoredAuth();
        if (auth) {
            this.user = auth.user;
            this.authToken = auth.token;
            await this.checkLinearConnection();
        } else {
            this.showAuthScreen();
        }
    }

    bindEvents() {
        // Auth buttons
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('logout-from-linear-setup').addEventListener('click', () => this.handleLogout());
        
        // Linear setup
        document.getElementById('connect-linear-btn').addEventListener('click', () => this.handleLinearConnection());
        
        // Workspace management
        document.getElementById('workspace-dropdown-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWorkspaceDropdown();
        });
        document.getElementById('add-workspace-btn')?.addEventListener('click', () => this.showAddWorkspaceModal());
        
        // Modal management
        document.getElementById('close-modal-btn')?.addEventListener('click', () => this.hideAddWorkspaceModal());
        document.getElementById('cancel-add-workspace')?.addEventListener('click', () => this.hideAddWorkspaceModal());
        document.getElementById('add-workspace-form')?.addEventListener('submit', (e) => this.handleAddWorkspace(e));
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.workspace-selector')) {
                this.closeWorkspaceDropdown();
            }
            // Close modal when clicking overlay
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAddWorkspaceModal();
            }
        });
        
        // Chat functionality
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceInput());
        
        // Connection management
        document.getElementById('disconnect-linear-btn').addEventListener('click', () => this.handleDisconnect());
        document.getElementById('refresh-connection-btn').addEventListener('click', () => this.refreshConnection());
        document.getElementById('clear-storage-btn').addEventListener('click', () => this.clearStorage());
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action-btn')) {
                const message = e.target.textContent.trim();
                this.sendQuickMessage(message);
            }
        });
    }

    showScreen(screenId) {
        ['auth-screen', 'linear-setup-screen', 'chat-screen', 'loading-screen'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle('hidden', id !== screenId);
            }
        });
    }

    async handleLogin() {
        this.showScreen('loading-screen');
        try {
            const authResult = await this.authHandler.initiateAuth();
            if (authResult.success) {
                this.user = authResult.user;
                this.authToken = authResult.token;
                await chrome.storage.local.set({ 'auth_token': this.authToken, 'user_data': this.user });
                await this.checkLinearConnection();
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthScreen();
        }
    }

    async handleLogout() {
        await this.authHandler.logout();
        this.user = null;
        this.authToken = null;
        this.showAuthScreen();
    }

    async handleLinearConnection() {
        const apiKeyInput = document.getElementById('linear-api-key');
        const errorDiv = document.getElementById('linear-error');
        const successDiv = document.getElementById('linear-success');
        const connectBtn = document.getElementById('connect-linear-btn');

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            this.showError(errorDiv, 'Please enter your Linear API key');
            return;
        }

        // Show loading state
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;
        this.hideMessages(errorDiv, successDiv);

        try {
            const validation = await this.authHandler.validateLinearApiKey(apiKey, this.authToken);
            if (validation.valid) {
                await chrome.storage.local.set({ 'linear_api_key': apiKey });
                
                // Create workspace with proper data from server
                await this.initializeCurrentWorkspace(apiKey);
                
                this.showSuccess(successDiv, 'Connected successfully!');
                setTimeout(() => this.showChatScreen(), 1000);
            } else {
                this.showError(errorDiv, validation.error || 'Invalid API key');
            }
        } catch (error) {
            console.error('Linear connection error:', error);
            this.showError(errorDiv, 'Failed to connect. Please check your API key and try again.');
        } finally {
            connectBtn.textContent = 'Connect to Linear';
            connectBtn.disabled = false;
        }
    }

    async handleDisconnect() {
        try {
            const response = await fetch(`${this.authHandler.serverUrl}/linear/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                await chrome.storage.local.remove(['linear_api_key']);
                this.showLinearSetupScreen();
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    async refreshConnection() {
        const workspaceElement = document.getElementById('workspace-name');
        const connectionIndicator = document.getElementById('connection-indicator');
        
        connectionIndicator.className = 'status-indicator connecting';
        workspaceElement.textContent = 'Checking...';
        
        await this.checkConnectionStatus();
    }

    async checkLinearConnection() {
        const hasApiKey = await chrome.storage.local.get(['linear_api_key']);
        if (hasApiKey.linear_api_key) {
            // Initialize current API key as first workspace if no workspaces exist
            if (this.workspaces.length === 0) {
                await this.initializeCurrentWorkspace(hasApiKey.linear_api_key);
            } else {
                // Refresh workspace names from server for existing workspaces
                await this.refreshWorkspaceNames();
            }
            
            this.showChatScreen();
            await this.checkConnectionStatus();
        } else {
            this.showLinearSetupScreen();
        }
    }
    
    async initializeCurrentWorkspace(apiKey) {
        try {
            const validation = await this.authHandler.validateLinearApiKey(apiKey, this.authToken);
            
            if (validation.valid && validation.user) {
                const defaultWorkspace = {
                    id: 'workspace_default',
                    name: validation.workspace || validation.user.email || 'Default Workspace',
                    apiKey: apiKey,
                    isActive: true,
                    user: validation.user,
                    teams: [],
                    lastConnected: new Date()
                };
                
                this.workspaces = [defaultWorkspace];
                this.activeWorkspaceId = defaultWorkspace.id;
                this.activeWorkspace = defaultWorkspace;
                
                await this.saveWorkspaces();
                this.updateWorkspaceUI();
            }
        } catch (error) {
            console.error('Failed to initialize current workspace:', error);
        }
    }

    async checkConnectionStatus() {
        try {
            const response = await fetch(`${this.authHandler.serverUrl}/linear/status`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const status = await response.json();
            this.updateConnectionUI(status);
        } catch (error) {
            console.error('Status check error:', error);
            this.updateConnectionUI({ connected: false, message: 'Connection error' });
        }
    }

    updateConnectionUI(status) {
        const workspaceElement = document.getElementById('workspace-name');
        const connectionIndicator = document.getElementById('connection-indicator');
        const usernameElement = document.getElementById('username');
        
        if (status.connected) {
            connectionIndicator.className = 'status-indicator connected';
            workspaceElement.textContent = status.user?.email || 'Linear Workspace';
            if (status.user && usernameElement) {
                usernameElement.textContent = status.user.name || status.user.email || 'gerard@network.com';
            }
        } else {
            connectionIndicator.className = 'status-indicator';
            workspaceElement.textContent = status.message || 'Not Connected';
        }
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        console.log('🚀 Sending message:', message);
        
        input.value = '';
        input.disabled = true;
        document.getElementById('send-btn').disabled = true;
        
        this.addMessage(message, 'user');
        this.hideWelcomeMessage();
        this.showTypingIndicator();
        
        try {
            console.log('📡 Making request to:', `${this.authHandler.serverUrl}/chat`);
            console.log('🔑 Auth token:', this.authToken ? 'Present' : 'Missing');
            console.log('🏢 Active workspace:', this.activeWorkspace?.name || 'None');
            
            const requestBody = { 
                message,
                workspaceApiKey: this.activeWorkspace?.apiKey 
            };
            
            const response = await fetch(`${this.authHandler.serverUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
            
            const result = await response.json();
            console.log('📥 Response data:', result);
            
            if (result.success) {
                this.addMessage(result.response.content[0].text, 'assistant');
            } else {
                console.error('❌ Server returned error:', result);
                this.addMessage(`Sorry, I encountered an error: ${result.error || 'Unknown error'}`, 'assistant');
            }
        } catch (error) {
            console.error('❌ Chat error:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.addMessage('Sorry, I cannot connect to the server right now. Please try again later.', 'assistant');
        } finally {
            this.hideTypingIndicator();
            input.disabled = false;
            document.getElementById('send-btn').disabled = false;
            input.focus();
        }
    }

    async sendQuickMessage(message) {
        const input = document.getElementById('message-input');
        input.value = message;
        await this.sendMessage();
    }

    addMessage(text, sender) {
        const container = document.getElementById('messages-container');
        const welcomeSection = document.getElementById('welcome-section');
        
        // Hide welcome section when first message is added
        if (welcomeSection && !welcomeSection.classList.contains('hidden')) {
            welcomeSection.classList.add('hidden');
            container.classList.remove('hidden');
        }

        const messageDiv = document.createElement('div');
        const isUser = sender === 'user';
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        
        const formattedContent = this.formatMessageContent(text);
        
        messageDiv.innerHTML = `
            <div class="message-avatar ${isUser ? 'user' : 'assistant'}"></div>
            <div class="message-bubble">${formattedContent}</div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    formatMessageContent(text) {
        if (typeof text !== 'string') {
            return String(text);
        }

        let formatted = this.escapeHtml(text);
        
        // Handle bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle code blocks
        formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');
        
        // Handle inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Handle issue IDs like NET-123
        formatted = formatted.replace(/([A-Z]+-\d+)/g, '<strong style="color: #3b82f6;">$1</strong>');
        
        // Handle URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>');
        
        // Handle bullet points
        formatted = formatted.replace(/^•\s/gm, '<span style="margin-left: 8px;">• </span>');
        
        // Handle line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        document.getElementById('typing-indicator').classList.remove('hidden');
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typing-indicator').classList.add('hidden');
    }

    hideWelcomeMessage() {
        const welcomeSection = document.getElementById('welcome-section');
        const messagesContainer = document.getElementById('messages-container');
        if (welcomeSection) welcomeSection.classList.add('hidden');
        if (messagesContainer) messagesContainer.classList.remove('hidden');
    }

    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isRecording = true;
            const voiceBtn = document.getElementById('voice-btn');
            voiceBtn.innerHTML = `
                <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
            `;
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('message-input').value = transcript;
        };

        this.recognition.onend = () => {
            this.stopRecording();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopRecording();
        };

        this.recognition.start();
    }

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        const voiceBtn = document.getElementById('voice-btn');
        voiceBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"></path>
            </svg>
        `;
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }

    showSuccess(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }

    hideMessages(...elements) {
        elements.forEach(el => el.classList.add('hidden'));
    }

    showAuthScreen() { this.showScreen('auth-screen'); }
    showLinearSetupScreen() { this.showScreen('linear-setup-screen'); }
    showChatScreen() { 
        this.showScreen('chat-screen');
        document.getElementById('message-input').focus();
    }
    
    // Workspace Management Methods
    async loadWorkspaces() {
        const stored = await chrome.storage.local.get(['workspaces', 'activeWorkspaceId']);
        this.workspaces = stored.workspaces || [];
        this.activeWorkspaceId = stored.activeWorkspaceId;
        
        if (this.workspaces.length > 0) {
            this.activeWorkspace = this.workspaces.find(w => w.id === this.activeWorkspaceId) || this.workspaces[0];
            this.updateWorkspaceUI();
        }
    }
    
    async saveWorkspaces() {
        await chrome.storage.local.set({
            workspaces: this.workspaces,
            activeWorkspaceId: this.activeWorkspaceId
        });
    }
    
    toggleWorkspaceDropdown() {
        const dropdown = document.getElementById('workspace-dropdown');
        const trigger = document.getElementById('workspace-dropdown-btn');
        
        const isHidden = dropdown?.classList.contains('hidden');
        
        if (isHidden) {
            this.openWorkspaceDropdown();
        } else {
            this.closeWorkspaceDropdown();
        }
    }
    
    openWorkspaceDropdown() {
        const dropdown = document.getElementById('workspace-dropdown');
        const trigger = document.getElementById('workspace-dropdown-btn');
        
        dropdown?.classList.remove('hidden');
        trigger?.classList.add('open');
        this.renderWorkspaceList();
    }
    
    closeWorkspaceDropdown() {
        const dropdown = document.getElementById('workspace-dropdown');
        const trigger = document.getElementById('workspace-dropdown-btn');
        
        dropdown?.classList.add('hidden');
        trigger?.classList.remove('open');
    }
    
    renderWorkspaceList() {
        const container = document.getElementById('workspace-list');
        if (!container) return;
        
        if (this.workspaces.length === 0) {
            container.innerHTML = `
                <div class="workspace-item">
                    <div class="workspace-info">
                        <div class="workspace-name">No workspaces</div>
                        <div class="workspace-user">Click "Add Workspace" to get started</div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.workspaces.map(workspace => `
            <div class="workspace-item ${workspace.id === this.activeWorkspaceId ? 'active' : ''}" 
                 data-workspace-id="${workspace.id}">
                <div class="workspace-info">
                    <div class="workspace-name">${workspace.name || workspace.user?.email || 'Unnamed Workspace'}</div>
                </div>
                <div class="workspace-status ${workspace.isActive ? 'connected' : ''}"></div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.workspace-item[data-workspace-id]').forEach(item => {
            item.addEventListener('click', () => {
                const workspaceId = item.dataset.workspaceId;
                this.switchWorkspace(workspaceId);
            });
        });
    }
    
    async switchWorkspace(workspaceId) {
        const workspace = this.workspaces.find(w => w.id === workspaceId);
        if (!workspace) return;
        
        try {
            // Switch MCP server to use this workspace's API key
            const response = await this.authHandler.switchWorkspace(workspace);
            if (response.success) {
                // Update workspace with fresh server data if available
                if (response.workspace?.name) {
                    workspace.name = response.workspace.name;
                }
                
                this.activeWorkspaceId = workspaceId;
                this.activeWorkspace = workspace;
                await this.saveWorkspaces();
                this.updateWorkspaceUI();
                this.closeWorkspaceDropdown(); // Close dropdown
            }
        } catch (error) {
            console.error('Failed to switch workspace:', error);
        }
    }
    
    updateWorkspaceUI() {
        if (!this.activeWorkspace) return;
        
        const nameElement = document.getElementById('active-workspace-name');
        const userElement = document.querySelector('.workspace-user');
        const statusElement = document.getElementById('connection-indicator');
        
        if (nameElement) {
            nameElement.textContent = this.activeWorkspace.name || this.activeWorkspace.user?.email || 'Unnamed Workspace';
        }
        if (userElement) {
            userElement.textContent = this.activeWorkspace.name || this.activeWorkspace.user?.email || 'Not connected';
        }
        if (statusElement) {
            statusElement.className = `status-indicator ${this.activeWorkspace.isActive ? 'connected' : 'disconnected'}`;
        }
    }
    
    showAddWorkspaceModal() {
        console.log('Show add workspace modal');
        this.closeWorkspaceDropdown();
        
        const modal = document.getElementById('add-workspace-modal');
        modal?.classList.remove('hidden');
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('workspace-name')?.focus();
        }, 100);
    }
    
    hideAddWorkspaceModal() {
        const modal = document.getElementById('add-workspace-modal');
        modal?.classList.add('hidden');
        
        // Clear form
        document.getElementById('add-workspace-form')?.reset();
        this.hideModalMessages();
    }
    
    async handleAddWorkspace(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('workspace-name');
        const apiKeyInput = document.getElementById('workspace-api-key');
        const submitBtn = document.getElementById('save-workspace');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnSpinner = submitBtn?.querySelector('.btn-spinner');
        
        const name = nameInput?.value.trim();
        const apiKey = apiKeyInput?.value.trim();
        
        if (!name || !apiKey) {
            this.showModalError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        btnText?.classList.add('hidden');
        btnSpinner?.classList.remove('hidden');
        this.hideModalMessages();
        
        try {
            // Validate API key first
            const validation = await this.authHandler.validateLinearApiKey(apiKey, this.authToken);
            
            if (!validation.valid) {
                throw new Error(validation.error || 'Invalid API key');
            }
            
            // Create new workspace
            const newWorkspace = {
                id: 'workspace_' + Date.now(),
                name: validation.workspace || name,
                apiKey: apiKey,
                isActive: true,
                user: validation.user,
                teams: [],
                lastConnected: new Date()
            };
            
            // Add to workspaces and set as active
            this.workspaces.push(newWorkspace);
            this.activeWorkspaceId = newWorkspace.id;
            this.activeWorkspace = newWorkspace;
            
            // Save to storage
            await this.saveWorkspaces();
            
            // Update UI
            this.updateWorkspaceUI();
            
            this.showModalSuccess('Workspace connected successfully!');
            
            // Close modal after short delay
            setTimeout(() => {
                this.hideAddWorkspaceModal();
            }, 1500);
            
        } catch (error) {
            console.error('Add workspace error:', error);
            this.showModalError(error.message || 'Failed to connect workspace');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText?.classList.remove('hidden');
            btnSpinner?.classList.add('hidden');
        }
    }
    
    showModalError(message) {
        const errorDiv = document.getElementById('modal-error');
        const successDiv = document.getElementById('modal-success');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
        successDiv?.classList.add('hidden');
    }
    
    showModalSuccess(message) {
        const errorDiv = document.getElementById('modal-error');
        const successDiv = document.getElementById('modal-success');
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
        }
        errorDiv?.classList.add('hidden');
    }
    
    hideModalMessages() {
        document.getElementById('modal-error')?.classList.add('hidden');
        document.getElementById('modal-success')?.classList.add('hidden');
    }
    
    async refreshWorkspaceNames() {
        // Refresh workspace names for existing workspaces using server data
        for (let workspace of this.workspaces) {
            try {
                const validation = await this.authHandler.validateLinearApiKey(workspace.apiKey, this.authToken);
                if (validation.valid && validation.workspace) {
                    const oldName = workspace.name;
                    workspace.name = validation.workspace;
                    console.log(`🔄 Updated workspace name from "${oldName}" to "${workspace.name}"`);
                }
            } catch (error) {
                console.error('Error refreshing workspace name:', workspace.name, error);
            }
        }
        
        // Save updated workspaces
        await this.saveWorkspaces();
        this.updateWorkspaceUI();
    }
    
    async clearStorage() {
        if (confirm('Clear all stored data? You will need to reconnect to Linear.')) {
            await chrome.storage.local.clear();
            console.log('🗑️ Storage cleared');
            window.location.reload();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LinearAssistantPopup();
});
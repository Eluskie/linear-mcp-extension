import OpenAI from 'openai';
import { LinearClient } from './linear-client';
import { createIssueService } from './tools/create-issue';
import { searchIssuesService } from './tools/search-issues';
import { updateIssueService } from './tools/update-issue';
import { getTeamsService } from './tools/get-teams';

export class AIService {
    private openai: OpenAI;
    private linearClient: LinearClient;

    constructor(linearClient: LinearClient) {
        this.linearClient = linearClient;
        
        // Initialize OpenAI client
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  No OpenAI API key found. Using fallback responses.');
        }
        
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key'
        });
    }

    async processMessage(message: string, context: any[] = []): Promise<string> {
        // If no OpenAI key, fall back to basic processing
        if (!process.env.OPENAI_API_KEY) {
            return this.fallbackProcessing(message);
        }

        try {
            // Get current user info for context
            let currentUser;
            try {
                currentUser = await this.linearClient.getCurrentUser();
            } catch (error) {
                console.warn('Could not get current user:', error);
            }

            // Prepare conversation messages  
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: `You are a Linear assistant. ALWAYS call the appropriate function based on the user's request.

## FUNCTION SELECTION RULES:

### USE search_issues FOR:
- "what issues are assigned to me" → search_issues with assigneeId: "${currentUser?.id || ''}"
- "show my team's progress" → search_issues with teamId (no assignee filter)
- "find bugs" → search_issues with query: "bug"
- "show urgent issues" → search_issues (any issue search)

### USE create_issue FOR:
- "create an issue" → create_issue (ask for details if needed)
- "can you create an issue" → create_issue 
- Any problem description → create_issue
- "add a bug report" → create_issue

### TITLE GENERATION RULES:
When calling create_issue, ALWAYS transform user input:
- "the login button doesn't work" → Title: "Fix login button not working"
- "we need a dark mode feature" → Title: "Add dark mode feature"
- "users can't see their notifications" → Title: "Fix users unable to see notifications"

Start with action verbs: Fix, Add, Update, Remove, Improve, etc.

### USE get_teams FOR:
- "what teams do I have" → get_teams
- "list my teams" → get_teams
- ONLY when explicitly asking about team information

### USE update_issue FOR:
- "update issue ABC-123" → update_issue
- "mark as done" → update_issue

## CRITICAL:
- NEVER call get_teams unless specifically asking about team information
- For "team progress", use search_issues with teamId, NOT get_teams
- For "create issue", use create_issue, NOT get_teams

Current user: ${currentUser?.name || 'Unknown'} (ID: ${currentUser?.id || 'unknown'})`
                }
            ];

            // Add limited conversation context for paid users (only last 2 messages for cost)
            if (context && context.length > 0) {
                context.slice(-2).forEach(msg => {
                    messages.push({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                    });
                });
            }

            // Add current message
            messages.push({
                role: 'user',
                content: message
            });

            // Build the complete messages array
            const completeMessages = [
                ...messages,
                ...(context && context.length > 0 ? context.slice(-2).map(msg => ({
                    role: (msg.sender === 'user' ? 'user' : 'assistant') as const,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                })) : []),
                {
                    role: 'user' as const,
                    content: message
                }
            ];

            // Call OpenAI with function definitions (using cheapest, fastest model)
            const response = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',   // Use env var or fallback
                messages: completeMessages,
                max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
                temperature: 0.1,        // Low temperature for deterministic responses
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'search_issues',
                            description: 'Search for issues in Linear. Use this for ANY query about finding issues, including "what issues are assigned to me", "show my tasks", "find bugs", etc.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    query: { type: 'string', description: 'Search query for issue content' },
                                    teamId: { type: 'string', description: 'Optional team ID filter' },
                                    stateId: { type: 'string', description: 'Issue state filter (e.g., for open issues)' },
                                    assigneeId: { 
                                        type: 'string', 
                                        description: `Assignee ID filter. For "assigned to me" queries, use: "${currentUser?.id || ''}". For unassigned issues, use: null` 
                                    },
                                    limit: { type: 'number', description: 'Number of results (max 50)', default: 10 }
                                },
                                required: []
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'create_issue',
                            description: 'Create a new Linear issue. IMPORTANT: Transform user input into professional issue format with concise title and detailed description.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    title: { 
                                        type: 'string', 
                                        description: 'Create a concise, professional title (max 60 chars). Transform user input like "the login button is not working on mobile" into "Fix login button not working on mobile". Start with action verbs: Fix, Add, Update, Remove, etc.' 
                                    },
                                    description: { 
                                        type: 'string', 
                                        description: 'Expand the user input into a comprehensive description with:\n\n**Problem**: What is the issue?\n**Impact**: Who is affected?\n**Expected**: What should happen?\n**Steps**: How to reproduce (if applicable)\n**Acceptance Criteria**: Definition of done' 
                                    },
                                    teamId: { type: 'string', description: 'Team ID - use "a43d99f8-b578-4afd-ae08-748777849cb0" for Netwoerk team unless specified' },
                                    priority: { type: 'number', description: 'Assess priority: 1 (Critical - system down), 2 (High - major impact), 3 (Medium - moderate impact), 4 (Low - minor/nice to have)' },
                                    labelIds: { type: 'array', items: { type: 'string' }, description: 'Relevant issue label IDs' },
                                    assigneeId: { type: 'string', description: `Assign to requester unless specified otherwise. Use: "${currentUser?.id || ''}"` }
                                },
                                required: ['title', 'teamId', 'description', 'priority']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'update_issue',
                            description: 'Update an existing issue',
                            parameters: {
                                type: 'object',
                                properties: {
                                    issueId: { type: 'string', description: 'Issue ID to update' },
                                    title: { type: 'string', description: 'New title' },
                                    description: { type: 'string', description: 'New description' },
                                    stateId: { type: 'string', description: 'New state ID' },
                                    priority: { type: 'number', description: 'New priority' },
                                    assigneeId: { type: 'string', description: 'New assignee ID' }
                                },
                                required: ['issueId']
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'get_teams',
                            description: 'Get user\'s teams and projects',
                            parameters: {
                                type: 'object',
                                properties: {}
                            }
                        }
                    }
                ],
                tool_choice: 'auto'
            });

            const choice = response.choices[0];
            
            if (!choice) {
                throw new Error('No response from AI');
            }
            
            console.log('🤖 AI Response choice:', {
                hasToolCalls: !!(choice.message?.tool_calls && choice.message.tool_calls.length > 0),
                toolCallsCount: choice.message?.tool_calls?.length || 0,
                messageContent: choice.message?.content?.substring(0, 100) + '...',
                finishReason: choice.finish_reason
            });
            
            // If AI wants to call a function
            if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
                const toolCall = choice.message.tool_calls[0]; // Handle first tool call
                if (!toolCall) {
                    throw new Error('Tool call is undefined');
                }
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
                
                console.log(`🤖 AI calling function: ${functionName}`);
                console.log(`📋 Function arguments:`, JSON.stringify(functionArgs, null, 2));
                
                // Execute the Linear function
                const functionResult = await this.executeFunction(functionName, functionArgs);
                console.log(`✅ Function result:`, JSON.stringify(functionResult, null, 2).substring(0, 500) + '...');
                
                // Get AI response about the function result
                const followUpResponse = await this.openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',   // Same model
                    messages: [
                        ...completeMessages,
                        choice.message!,
                        {
                            role: 'tool' as const,
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(functionResult)
                        }
                    ],
                    max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '300'),
                    temperature: 0.1        // Consistent, fast responses
                });

                const followUpChoice = followUpResponse.choices[0];
                if (!followUpChoice) {
                    throw new Error('No follow-up response from AI');
                }

                return followUpChoice.message?.content || 'I completed the action but had trouble forming a response.';
            }

            // If no function call, check if we should force one for common queries
            const shouldForceFunction = this.shouldForceFunctionCall(message);
            if (shouldForceFunction) {
                console.log('🔄 Forcing function call for query:', message);
                const functionResult = await this.forceFunctionCall(message, currentUser);
                return functionResult;
            }
            
            // If no function call, return direct response
            return choice.message?.content || 'I had trouble understanding that. Could you try rephrasing?';

        } catch (error) {
            console.error('AI service error:', error);
            return this.fallbackProcessing(message);
        }
    }

    private async executeFunction(name: string, args: any): Promise<any> {
        try {
            switch (name) {
                case 'search_issues':
                    return await searchIssuesService(this.linearClient, args);
                case 'create_issue':
                    return await createIssueService(this.linearClient, args);
                case 'update_issue':
                    return await updateIssueService(this.linearClient, args);
                case 'get_teams':
                    return await getTeamsService(this.linearClient, args);
                default:
                    throw new Error(`Unknown function: ${name}`);
            }
        } catch (error) {
            console.error(`Function execution error for ${name}:`, error);
            return {
                content: [{
                    type: 'text',
                    text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }
    }

    private fallbackProcessing(message: string): string {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hi! I'm your Linear assistant. I can help you search for issues, create new ones, update existing issues, and get information about your teams. What would you like to do?";
        }
        
        if (lowerMessage.includes('create') && (lowerMessage.includes('issue') || lowerMessage.includes('bug') || lowerMessage.includes('task'))) {
            return "I'd be happy to help you create an issue! To get started, I'll need to know which team to create it for. You can ask me 'What teams do I have access to?' first, or just tell me the issue details and team name.";
        }
        
        if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('show') || lowerMessage.includes('what') || lowerMessage.includes('my')) {
            return "I can help you search for issues! Try asking me things like:\n• 'What issues are assigned to me?'\n• 'Show me urgent bugs'\n• 'Find issues about login'\n• 'What's my team working on?'";
        }
        
        if (lowerMessage.includes('team') || lowerMessage.includes('project')) {
            return "I can show you information about your teams and projects. Would you like me to list your teams or search for specific team-related information?";
        }
        
        return `I'm your Linear assistant! I can help you with:
• 🔍 **Search issues**: "What's assigned to me?" or "Find bugs in the mobile app"
• ✅ **Create issues**: "Create a bug report for login issues"
• 📝 **Update issues**: "Mark issue ABC-123 as completed"
• 👥 **Team info**: "What teams do I have access to?"

What would you like to do?`;
    }
    
    private shouldForceFunctionCall(message: string): boolean {
        const lowerMessage = message.toLowerCase();
        
        // Force function calls for common queries
        const searchTriggers = ['assigned to me', 'my issues', 'my tasks', 'what issues', 'show issues', 'find issues', 'team progress', 'team\'s progress'];
        const teamTriggers = ['my teams', 'list teams', 'what teams'];
        const createTriggers = ['create issue', 'create an issue', 'can you create', 'new issue', 'add issue', 'make an issue'];
        
        return searchTriggers.some(trigger => lowerMessage.includes(trigger)) ||
               teamTriggers.some(trigger => lowerMessage.includes(trigger)) ||
               createTriggers.some(trigger => lowerMessage.includes(trigger));
    }
    
    private async forceFunctionCall(message: string, currentUser: any): Promise<string> {
        const lowerMessage = message.toLowerCase();
        
        try {
            // Force search_issues for "assigned to me" type queries
            if (lowerMessage.includes('assigned to me') || lowerMessage.includes('my issues') || lowerMessage.includes('my tasks')) {
                console.log('🔍 Forcing search_issues with assigneeId:', currentUser?.id);
                const result = await this.executeFunction('search_issues', {
                    assigneeId: currentUser?.id || '',
                    limit: 10
                });
                
                if (result.content && result.content[0]) {
                    const issues = JSON.parse(result.content[0].text);
                    if (issues.length === 0) {
                        return '📋 **No Issues Found**\n\nYou don\'t have any issues currently assigned to you.';
                    }
                    
                    let response = `📋 **Issues Assigned to You** (${issues.length} found)\n\n`;
                    issues.slice(0, 5).forEach((issue: any, index: number) => {
                        const priority = issue.priority === 1 ? '🔴' : issue.priority === 2 ? '🟠' : issue.priority === 3 ? '🟡' : '🟢';
                        response += `${index + 1}. **${issue.identifier}**: ${issue.title}\n`;
                        response += `   ${priority} ${issue.state?.name || 'No State'} • ${issue.team?.name || 'No Team'}\n\n`;
                    });
                    
                    if (issues.length > 5) {
                        response += `... and ${issues.length - 5} more issues.`;
                    }
                    
                    return response;
                } else {
                    return 'Unable to search for issues. Please check your Linear connection.';
                }
            }
            
            // Force search_issues for team progress queries
            if (lowerMessage.includes('team progress') || lowerMessage.includes('team\'s progress')) {
                console.log('📈 Forcing search_issues for team progress');
                const result = await this.executeFunction('search_issues', {
                    limit: 20
                });
                
                if (result.content && result.content[0]) {
                    const issues = JSON.parse(result.content[0].text);
                    if (issues.length === 0) {
                        return '📈 **No Team Issues Found**\n\nNo issues found for your team.';
                    }
                    
                    let response = `📈 **Team Progress** (${issues.length} issues)\n\n`;
                    
                    // Group by status
                    const byStatus: { [key: string]: any[] } = {};
                    issues.forEach((issue: any) => {
                        const status = issue.state?.name || 'No Status';
                        if (!byStatus[status]) byStatus[status] = [];
                        byStatus[status].push(issue);
                    });
                    
                    Object.entries(byStatus).forEach(([status, statusIssues]) => {
                        response += `### ${status} (${statusIssues.length})\n`;
                        statusIssues.slice(0, 3).forEach((issue: any) => {
                            const priority = issue.priority === 1 ? '🔴' : issue.priority === 2 ? '🟠' : issue.priority === 3 ? '🟡' : '🟢';
                            response += `- **${issue.identifier}**: ${issue.title}\n`;
                            response += `  ${priority} ${issue.assignee?.name || 'Unassigned'}\n`;
                        });
                        if (statusIssues.length > 3) {
                            response += `  ... and ${statusIssues.length - 3} more\n`;
                        }
                        response += '\n';
                    });
                    
                    return response;
                }
            }
            
            // Force create_issue for creation requests
            if (lowerMessage.includes('create issue') || lowerMessage.includes('create an issue') || lowerMessage.includes('can you create')) {
                console.log('➕ Forcing create_issue');
                const result = await this.executeFunction('create_issue', {
                    title: 'New Issue - Please specify details',
                    description: 'This issue was created via chat. Please update with specific requirements.',
                    teamId: 'a43d99f8-b578-4afd-ae08-748777849cb0', // Default to first team
                    priority: 3
                });
                
                if (result.content && result.content[0]) {
                    return result.content[0].text + '\n\n👍 **Tip**: Next time, describe the issue details and I\'ll create a more specific issue for you!';
                } else {
                    return 'I can create an issue for you! Please describe what the issue is about, and I\'ll create it with proper details.';
                }
            }
            
            // Force get_teams for team information queries (not progress)
            if ((lowerMessage.includes('teams') && !lowerMessage.includes('progress')) || lowerMessage.includes('what teams') || lowerMessage.includes('list teams')) {
                console.log('👥 Forcing get_teams');
                const result = await this.executeFunction('get_teams', {});
                return result.content?.[0]?.text || 'Unable to fetch teams.';
            }
            
            // For other queries, return a helpful message
            return 'I\'m not sure how to help with that. Try asking about your assigned issues, teams, or describe a problem to create an issue.';
            
        } catch (error) {
            console.error('Force function call error:', error);
            return 'I encountered an error while processing your request. Please try again.';
        }
    }
}
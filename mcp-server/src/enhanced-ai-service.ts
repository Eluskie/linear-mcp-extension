import OpenAI from 'openai';
import { LinearClient } from './linear-client';
import { createIssueService } from './tools/create-issue';
import { searchIssuesService } from './tools/search-issues';
import { updateIssueService } from './tools/update-issue';
import { getTeamsService } from './tools/get-teams';

interface User {
    id: string;
    name: string;
    email: string;
}

interface Team {
    id: string;
    name: string;
    key: string;
}

interface AIContext {
    currentUser: User;
    teams: Team[];
    conversation: any[];
}

export class EnhancedAIService {
    private openai: OpenAI;
    private linearClient: LinearClient;

    constructor(linearClient: LinearClient) {
        this.linearClient = linearClient;
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  No OpenAI API key found. Using fallback responses.');
        }
        
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key'
        });
    }

    async processWithProductManagerContext(message: string, context: any[] = []): Promise<string> {
        if (!process.env.OPENAI_API_KEY) {
            return this.fallbackProcessing(message);
        }

        try {
            const aiContext = await this.buildContext();
            
            const enhancedPrompt = this.buildProductManagerPrompt(aiContext);
            
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: enhancedPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ];

            // Enhanced model for better reasoning
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 1000,
                temperature: 0.3,
                tools: this.getEnhancedTools(),
                tool_choice: 'auto'
            });

            const choice = response.choices[0];
            if (!choice) {
                throw new Error('No response from AI');
            }

            if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
                return await this.handleFunctionCalls(choice.message.tool_calls, messages, aiContext);
            }

            // Check if the message requires a function call but AI didn't call one
            const content = choice.message?.content || '';
            const forcedFunction = this.shouldForceFunction(message, content);
            if (forcedFunction) {
                console.log(`🔧 Forcing function call: ${forcedFunction.name}`);
                const mockToolCall = {
                    function: {
                        name: forcedFunction.name,
                        arguments: JSON.stringify(forcedFunction.args)
                    }
                };
                return await this.handleFunctionCalls([mockToolCall], messages, aiContext);
            }

            return this.formatResponse(content);

        } catch (error) {
            console.error('Enhanced AI service error:', error);
            return this.fallbackProcessing(message);
        }
    }

    private async buildContext(): Promise<AIContext> {
        let currentUser: User | null = null;
        let teams: Team[] = [];

        try {
            const user = await this.linearClient.getCurrentUser();
            currentUser = {
                id: user.id,
                name: user.name || 'Unknown',
                email: user.email || 'unknown@example.com'
            };

            const teamsResult = await getTeamsService(this.linearClient, {});
            if (teamsResult.content && teamsResult.content[0]) {
                teams = JSON.parse(teamsResult.content[0].text);
            }
        } catch (error) {
            console.warn('Could not build context:', error);
        }

        return {
            currentUser: currentUser || {
                id: 'unknown',
                name: 'User',
                email: 'user@example.com'
            },
            teams: teams || [],
            conversation: []
        };
    }

    private buildProductManagerPrompt(context: AIContext): string {
        return `You are an expert Product Manager AI assistant. Your role is to deeply understand user requests and create high-quality, actionable Linear issues that capture the full context and requirements.

## Your Expertise:
- **Product Management**: 10+ years experience in SaaS product development
- **User Research**: Understanding user needs and pain points
- **Technical Writing**: Creating clear, comprehensive specifications
- **Prioritization**: Using data-driven approaches to assess impact vs effort
- **Team Coordination**: Understanding team dynamics and assignment strategies

## Available Context:
- **Current User**: ${context.currentUser.name} (${context.currentUser.email})
- **Teams**: ${context.teams.map(t => `${t.name} (${t.key})`).join(', ')}
- **Default Team**: Use Netwoerk team (a43d99f8-b578-4afd-ae08-748777849cb0) unless user specifies otherwise

## Issue Creation Framework:

### 1. Problem Analysis
Transform vague user requests into clear problem statements:
- **What**: What's the specific issue or need?
- **Who**: Which users are affected?
- **When**: When does this occur?
- **Impact**: How severe is the impact?

### 2. Title Generation
Create clear, actionable titles:
- **Format**: [Area] Action + Object + Context
- **Examples**: 
  - "[Mobile] Fix login button misalignment on iOS 17"
  - "[API] Add rate limiting to user endpoints"
  - "[UX] Improve loading state for dashboard cards"

### 3. Description Structure
Use this comprehensive template:

**Problem Statement**
Briefly describe what issue or need is being addressed.

**User Impact**
- Primary users affected: [describe user segment]
- Business impact: [revenue, retention, satisfaction]
- Frequency: [how often this occurs]

**Current Behavior**
What happens now (the problem).

**Expected Behavior**
What should happen instead.

**Acceptance Criteria**
- [ ] Specific condition 1
- [ ] Specific condition 2
- [ ] Specific condition 3

**Technical Notes**
Any technical context, dependencies, or implementation hints.

**Priority Justification**
Explain why this priority level is appropriate.

### 4. Priority Assessment
**P1 (Critical)**: 
- System down, data loss, security vulnerabilities
- Blocking multiple users from core workflows
- Revenue-impacting bugs

**P2 (High)**:
- Major feature broken affecting significant user segment
- Performance issues affecting daily workflows
- Compliance requirements

**P3 (Medium)**:
- Nice-to-have improvements
- Minor bugs with workarounds
- Enhancements to existing features

**P4 (Low)**:
- Future enhancements
- Polish items
- Optimization opportunities

### 5. Assignment Strategy
- **Self-assignment**: If user requests something they can handle
- **Team lead**: For strategic decisions or complex features
- **Unassigned**: When unclear who should handle it
- **Consider**: Current workload, expertise, availability

## Response Formatting:
Use professional, structured responses:

### For Issue Creation:
✅ **Issue Created**: [ISSUE-ID] Title
📋 **Details**: [key summary]
🎯 **Priority**: [level with justification]
👤 **Assigned to**: [assignee or unassigned]
🔗 **Next steps**: [what happens next]

### For Search Results:
📊 **Found**: [X issues matching criteria]
📋 **Summary**: [brief overview]
🔍 **Details**: [formatted list]

### For Updates:
✅ **Updated**: [ISSUE-ID]
⚡ **Changes**: [what was changed]
📊 **Status**: [current state]

## Function Usage Rules:
1. **MANDATORY**: Use search_issues for ANY query about finding, listing, or viewing issues
2. **CONDITIONAL**: For create_issue requests, ask for details first unless user provides sufficient information
3. **MANDATORY**: Use update_issue for ANY request to change, modify, or update issues
4. **MANDATORY**: Use get_teams if team context is needed
5. **ALWAYS**: Include comprehensive descriptions for create_issue
6. **ALWAYS**: Set appropriate priority based on impact analysis
7. **ALWAYS**: Format responses professionally

## Critical Function Triggers:
- "what issues", "show issues", "list issues", "find issues" → MUST use search_issues
- "assigned to me", "my issues", "my tasks" → MUST use search_issues with assigneeId
- "create", "add", "make" + "issue/task/bug" → Ask for details first: title, description, priority
- "update", "change", "modify" + issue → MUST use update_issue
- "teams", "team list" → MUST use get_teams

## Issue Creation Protocol:
**SMART PARSING**: Extract information from user requests intelligently:

1. **If user provides specific details** → Create issue immediately
   - Examples: "add issue fix login bug", "create task for user feedback", "fix amon feedback and its low"
   - Parse: title, description, priority from user message
   - Call create_issue function directly

2. **If user is vague** → Ask for details  
   - Examples: "create an issue", "add something", "make a task"
   - Ask for: title, description, priority

**Smart Extraction Rules**:
- **Title**: Extract main action/problem from user message
- **Description**: Expand on what user said with context
- **Priority**: Look for keywords (urgent/critical=1, high=2, medium=3, low=4) or default to medium
- **Keywords**: "fix"=bug, "add"=feature, "update"=enhancement, "feedback"=improvement

## Example Interactions:

**User**: "The login is broken on mobile"
**AI**: Creates issue with title "[Mobile] Fix login functionality on mobile devices", P1 priority, detailed description including impact analysis, assigns to appropriate team member.

**User**: "We should add dark mode"
**AI**: Creates issue with title "[Feature] Implement dark mode theme", P3 priority, comprehensive description with acceptance criteria, leaves unassigned for team discussion.`;
    }

    private getEnhancedTools() {
        return [
            {
                type: 'function' as const,
                function: {
                    name: 'search_issues',
                    description: 'Search for issues with intelligent filtering and analysis',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Smart search query - can include natural language' },
                            teamId: { type: 'string', description: 'Team ID filter' },
                            stateId: { type: 'string', description: 'Issue state filter' },
                            assigneeId: { type: 'string', description: 'Assignee ID filter' },
                            priority: { type: 'number', description: 'Priority level filter (1-4)' },
                            limit: { type: 'number', description: 'Number of results to return', default: 10 }
                        }
                    }
                }
            },
            {
                type: 'function' as const,
                function: {
                    name: 'create_issue',
                    description: 'Create a new issue with Product Manager-level quality and structure',
                    parameters: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', description: 'Clear, action-oriented title following format: [Area] Action + Object + Context' },
                            description: { type: 'string', description: 'Comprehensive description with Problem, Impact, Expected Behavior, Acceptance Criteria, and Technical Notes' },
                            teamId: { type: 'string', description: 'Team ID - analyze context to choose appropriate team' },
                            priority: { type: 'number', description: 'Priority: 1 (Critical), 2 (High), 3 (Medium), 4 (Low) - based on impact analysis' },
                            labelIds: { type: 'array', items: { type: 'string' }, description: 'Relevant label IDs based on issue type and area' },
                            assigneeId: { type: 'string', description: 'User ID to assign - use current user for user-initiated requests, team lead for strategic items, or leave unassigned' }
                        },
                        required: ['title', 'description', 'teamId', 'priority']
                    }
                }
            },
            {
                type: 'function' as const,
                function: {
                    name: 'update_issue',
                    description: 'Update existing issues with context-aware changes',
                    parameters: {
                        type: 'object',
                        properties: {
                            issueId: { type: 'string', description: 'Issue ID to update' },
                            title: { type: 'string', description: 'Updated title if needed' },
                            description: { type: 'string', description: 'Updated description with context' },
                            stateId: { type: 'string', description: 'New state ID' },
                            priority: { type: 'number', description: 'Updated priority level' },
                            assigneeId: { type: 'string', description: 'Updated assignee ID based on context' }
                        },
                        required: ['issueId']
                    }
                }
            },
            {
                type: 'function' as const,
                function: {
                    name: 'get_teams',
                    description: 'Get available teams for intelligent team selection',
                    parameters: {
                        type: 'object',
                        properties: {}
                    }
                }
            }
        ];
    }

    private async handleFunctionCalls(toolCalls: any[], messages: any[], context: AIContext): Promise<string> {
        let results = [];

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
            
            console.log(`🤖 Enhanced AI calling function: ${functionName}`);
            console.log(`📋 Function arguments:`, JSON.stringify(functionArgs, null, 2));
            
            const functionResult = await this.executeFunction(functionName, functionArgs, context);
            
            results.push({
                function: functionName,
                args: functionArgs,
                result: functionResult
            });
        }

        return this.formatEnhancedResponse(results, context);
    }

    private async executeFunction(name: string, args: any, context: AIContext): Promise<any> {
        try {
            switch (name) {
                case 'search_issues':
                    // Handle assigneeFilter for "my issues" queries
                    if (args.assigneeFilter === 'current_user' && context.currentUser.id !== 'unknown') {
                        args.assigneeId = context.currentUser.id;
                        delete args.assigneeFilter;
                    }
                    return await searchIssuesService(this.linearClient, args);
                case 'create_issue':
                    // Get teamId if not provided
                    if (!args.teamId) {
                        const teamsResult = await getTeamsService(this.linearClient, {});
                        if (teamsResult.content && teamsResult.content[0]) {
                            const teams = JSON.parse(teamsResult.content[0].text);
                            if (teams.length > 0) {
                                args.teamId = teams[0].id; // Use first available team
                                console.log(`🏢 Using team: ${teams[0].name} (${teams[0].id})`);
                            }
                        }
                    }
                    
                    // Ensure assigneeId defaults to current user for user-initiated requests
                    if (!args.assigneeId && context.currentUser.id !== 'unknown') {
                        args.assigneeId = context.currentUser.id;
                    }
                    return await createIssueService(this.linearClient, args);
                case 'update_issue':
                    return await updateIssueService(this.linearClient, args);
                case 'get_teams':
                    return await getTeamsService(this.linearClient, args);
                default:
                    throw new Error(`Unknown function: ${name}`);
            }
        } catch (error) {
            console.error(`Enhanced function execution error for ${name}:`, error);
            return {
                error: true,
                message: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    private formatEnhancedResponse(results: any[], context: AIContext): string {
        if (results.length === 0) {
            return 'I processed your request but no actions were taken.';
        }

        const result = results[0]; // Handle first result for now
        
        if (result.function === 'create_issue' && result.result.success) {
            const issue = result.result.issue;
            return this.formatCreateIssueResponse(issue, result.args.priority);
        }
        
        if (result.function === 'search_issues') {
            return this.formatSearchResponse(result.result);
        }
        
        if (result.function === 'update_issue') {
            return this.formatUpdateResponse(result.result);
        }

        return JSON.stringify(result.result, null, 2);
    }

    private formatCreateIssueResponse(issue: any, priority: number): string {
        const priorityMap: { [key: number]: string } = {
            1: '🔴 Critical',
            2: '🟠 High',
            3: '🟡 Medium',
            4: '🟢 Low'
        };

        return `✅ **Issue Created**

**${issue.identifier}**: ${issue.title}

📋 **Details**:
- **Priority**: ${priorityMap[priority] || 'Medium'}
- **Status**: ${issue.state?.name || 'Backlog'}
- **Team**: ${issue.team?.name || 'Not specified'}
- **Assignee**: ${issue.assignee?.name || 'Unassigned'}

🎯 **Next Steps**:
- Issue is now in your backlog
- Review and adjust priority/assignment as needed
- Add any additional context or attachments

🔗 **Quick Actions**:
- View issue: ${issue.url}
- Update priority: Ask me to "set ${issue.identifier} to high priority"
- Assign to someone: Ask me to "assign ${issue.identifier} to [person]`;
    }

    private formatSearchResponse(result: any): string {
        if (!result.content || result.content.length === 0) {
            return '❌ No issues found matching your criteria.';
        }

        const issues = JSON.parse(result.content[0].text);
        const count = issues.length;

        if (count === 0) {
            return '❌ No issues found matching your criteria.';
        }

        const summary = issues.slice(0, 5).map((issue: any) => 
            `• **${issue.identifier}**: ${issue.title} (${issue.state?.name || 'Unknown'})`
        ).join('\n');

        const moreText = count > 5 ? `\n... and ${count - 5} more issues` : '';

        return `📊 **Found ${count} issues**

${summary}${moreText}

🔍 **Next steps**:
- View specific issue: Ask me to "show details for [issue-id]"
- Filter results: Ask me to "find [specific type] issues"
- Update issues: Ask me to "update [issue-id]"`;
    }

    private formatUpdateResponse(result: any): string {
        if (!result.success) {
            return `❌ **Update Failed**: ${result.content?.[0]?.text || 'Unknown error'}`;
        }

        const issue = result.issue;
        return `✅ **Issue Updated**

**${issue.identifier}**: ${issue.title}

⚡ **Changes Applied**:
- **Status**: ${issue.state?.name || 'Not specified'}
- **Priority**: ${issue.priority || 'Not changed'}
- **Assignee**: ${issue.assignee?.name || 'Not changed'}

📊 **Current Status**: Ready for next steps`;
    }

    private shouldForceFunction(userMessage: string, aiResponse: string): { name: string; args: any } | null {
        const lower = userMessage.toLowerCase();
        
        // Force search_issues for common query patterns
        if (lower.includes('what issues') || 
            lower.includes('show issues') || 
            lower.includes('list issues') || 
            lower.includes('find issues') ||
            lower.includes('assigned to me') ||
            lower.includes('my issues') ||
            lower.includes('my tasks')) {
            
            const args: any = { limit: 10 };
            
            // If asking for "my" issues, filter by current user
            if (lower.includes('assigned to me') || lower.includes('my issues') || lower.includes('my tasks')) {
                args.assigneeFilter = 'current_user';
            }
            
            return { name: 'search_issues', args };
        }
        
        // Smart issue creation - force create_issue if user provides specific details
        if ((lower.includes('create') || lower.includes('add') || lower.includes('make') || lower.includes('fix')) &&
            this.hasSpecificIssueDetails(userMessage)) {
            
            const issueDetails = this.parseIssueFromMessage(userMessage);
            return { name: 'create_issue', args: issueDetails };
        }
        
        return null;
    }

    private hasSpecificIssueDetails(message: string): boolean {
        const lower = message.toLowerCase();
        
        // Check if message has specific actionable content
        const hasAction = lower.includes('fix') || lower.includes('add') || lower.includes('update') || lower.includes('create');
        const hasSubject = message.split(' ').length > 3; // More than just "create an issue"
        const hasPriority = lower.includes('low') || lower.includes('high') || lower.includes('medium') || lower.includes('urgent') || lower.includes('critical');
        
        return hasAction && (hasSubject || hasPriority);
    }

    private parseIssueFromMessage(message: string): any {
        const lower = message.toLowerCase();
        
        // Extract priority
        let priority = 3; // default medium
        if (lower.includes('critical') || lower.includes('urgent')) priority = 1;
        else if (lower.includes('high')) priority = 2;
        else if (lower.includes('low')) priority = 4;
        
        // Extract title and description
        const words = message.split(' ').filter(w => w.length > 0);
        let title = '';
        let description = '';
        
        // Remove common start words
        const cleanedMessage = message.replace(/^(create|add|make|fix)\s+(an?\s+)?(issue|task|bug)\s*/i, '').trim();
        
        if (cleanedMessage) {
            // Use the cleaned message as title, capitalize first letter
            title = cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1);
            description = `User requested: ${message}`;
        } else {
            title = 'New Issue';
            description = message;
        }
        
        return {
            title,
            description,
            priority
            // Don't hardcode teamId - let AI get teams first
        };
    }

    private formatResponse(content: string): string {
        return content;
    }

    private fallbackProcessing(message: string): string {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return `👋 **Welcome to Linear Assistant**

I'm your AI Product Manager assistant. I can help you:

🎯 **Create Issues** with Product Manager quality
- Transform vague ideas into actionable tasks
- Generate comprehensive descriptions
- Set appropriate priorities and assignments

🔍 **Search & Analyze** 
- Find issues by criteria
- Get intelligent summaries
- Understand team workload

📋 **Examples**:
- "The mobile app crashes when users try to login"
- "We need a dark mode feature"
- "Find all urgent bugs assigned to me"
- "Create a task for improving signup flow"

What would you like to work on?`;
        }
        
        if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('make')) {
            return `🎯 **Creating Issues with Product Manager Quality**

To create a high-quality issue, tell me:

**What**: What's the problem or need?
**Impact**: Who is affected and how?
**Urgency**: How critical is this?

**Examples**:
- "Users can't checkout on mobile - this is blocking sales"
- "Add dark mode to reduce eye strain for power users"
- "The signup flow has confusing copy causing drop-offs"

I'll transform your request into a comprehensive issue with:
- Clear, actionable title
- Detailed problem description  
- Appropriate priority level
- Smart assignment suggestions

What's the issue you'd like to create?`;
        }
        
        return this.formatResponse(`🤖 **I'm Here to Help**

I didn't quite understand that, but I can help you with:

🎯 **Creating Issues** (my specialty):
- Transform any problem description into a structured issue
- Generate comprehensive specifications
- Set intelligent priorities and assignments

🔍 **Searching Issues**:
- "Find urgent bugs"
- "What issues are assigned to me?"
- "Show me open tasks in [team]"

📊 **Team Management**:
- "List my teams"
- "Update issue status"

Try describing a problem or need, and I'll create a proper Linear issue for it!`);
    }
}
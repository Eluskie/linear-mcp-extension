# 🤖 AI Integration Setup

## What Changed

We've upgraded the Linear assistant from basic keyword matching to **real AI conversations** using OpenAI! Now the assistant can understand natural language and have intelligent conversations about your Linear workspace.

## Before vs After

**❌ Before (Basic):**
- "I understand you said: 'show my issues'. I can help you create issues..."
- Simple keyword matching
- Robotic responses

**✅ After (AI-Powered):**
- "I found 3 issues assigned to you. Here's your 'Login Bug' issue that needs attention, and two others..."
- Natural language understanding
- Conversational responses
- Smart function calling

## Quick Setup

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account if needed
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Add to Environment
```bash
cd mcp-server
cp .env.example .env
# Edit .env and add:
OPENAI_API_KEY=sk-your_actual_key_here
```

### 3. Test It
```bash
npm run dev
# The server will now use AI for conversations!
```

## How It Works

The AI assistant now:
- **Understands intent**: "What's urgent?" → searches for high-priority issues
- **Calls Linear functions**: Automatically uses create-issue, search-issues, etc.
- **Gives natural responses**: Formats data into conversational responses
- **Handles context**: Remembers conversation for paid users

## Example Conversations

**User**: "What issues are assigned to me?"
**AI**: "I found 3 issues assigned to you: 'Fix login bug' (high priority), 'Update README' (low priority), and 'Review PR #123' (medium priority). Would you like me to show details for any of these?"

**User**: "Create a bug report for the mobile app crashing"
**AI**: "I'll create that bug report for you. Which team should I assign it to? I can see you have access to Mobile, Frontend, and Backend teams."

## Fallback Mode

If no OpenAI key is provided, the assistant falls back to improved (but basic) responses. This ensures the extension always works, even without AI.

## Cost Considerations

- OpenAI API usage is pay-per-token
- Typical conversation costs ~$0.001-0.01
- Very affordable for personal use
- Consider usage limits for production

## Testing

1. Load the Chrome extension
2. Connect your Linear API key
3. Try natural language commands:
   - "Show me what I'm working on"
   - "Create an issue for the navigation bug"
   - "What's my team's progress this week?"
   - "Mark issue ABC-123 as done"

The responses should now be conversational and intelligent! 🚀
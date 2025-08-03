import { LinearClient } from '../linear-client';

export async function setApiKeyService(args: any) {
  try {
    if (!args.apiKey) {
      return {
        content: [
          {
            type: "text",
            text: `❌ API key is required.

Please provide your Linear API key. You can get it from:
1. Go to Linear Settings → Security and access → Personal API keys
2. Create a new API key with full access
3. Copy the key and provide it here`
          }
        ],
        isError: true
      };
    }

    // Store the API key (this will also validate it)
    await LinearClient.storeApiKey(args.apiKey);

    // Test the connection to confirm it works
    const client = new LinearClient(args.apiKey);
    const user = await client.getCurrentUser();

    return {
      content: [
        {
          type: "text",
          text: `✅ Linear API key stored successfully!

🔑 Connected as: ${user.name} (${user.email})

Your API key is now securely stored and encrypted. You won't need to enter it again for future sessions.

You can now use commands like:
• "What issues are assigned to me?"
• "Create a new issue"
• "Show my teams"
• "Update issue status"`
        }
      ]
    };

  } catch (error) {
    console.error('Set API key error:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle specific authentication errors
    if (errorMessage.includes('Authentication required')) {
      errorMessage = 'Invalid API key. Please check your Linear API key and make sure it has the correct permissions.';
    }

    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to store API key: ${errorMessage}

Please check:
1. Your API key is correct
2. Your API key has full access permissions
3. You're connected to the internet

Get your API key from: https://linear.app/settings/api`
        }
      ],
      isError: true
    };
  }
}
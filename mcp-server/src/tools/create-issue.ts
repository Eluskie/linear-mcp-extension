import { LinearClient, CreateIssueInput } from '../linear-client';

export async function createIssueService(linearClient: LinearClient, args: any) {
  try {
    // Validate required arguments
    if (!args.title) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Issue title is required"
          }
        ],
        isError: true
      };
    }

    if (!args.teamId) {
      return {
        content: [
          {
            type: "text", 
            text: "Error: Team ID is required. Use the get-teams tool to see available teams."
          }
        ],
        isError: true
      };
    }

    // Validate priority if provided
    if (args.priority && (args.priority < 1 || args.priority > 4)) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Priority must be between 1 (urgent) and 4 (no priority)"
          }
        ],
        isError: true
      };
    }

    // Create the issue input
    const createInput: CreateIssueInput = {
      title: args.title,
      description: args.description,
      teamId: args.teamId,
      priority: args.priority,
      assigneeId: args.assigneeId,
      labelIds: args.labels,
      stateId: args.stateId
    };

    // Create the issue
    const issue = await linearClient.createIssue(createInput);

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully created issue: ${issue.identifier} - ${issue.title}

📋 Details:
- ID: ${issue.id}
- Team: ${issue.team.name}
- State: ${issue.state.name}
- Priority: ${issue.priority || 'No priority'}
- URL: ${issue.url}
${issue.assignee ? `- Assignee: ${issue.assignee.name}` : '- Unassigned'}
${issue.description ? `\n📝 Description: ${issue.description}` : ''}
${issue.labels.length > 0 ? `\n🏷️ Labels: ${issue.labels.map(l => l.name).join(', ')}` : ''}`
        }
      ]
    };

  } catch (error) {
    console.error('Create issue error:', error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}
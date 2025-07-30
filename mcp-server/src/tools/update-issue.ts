import { LinearClient, UpdateIssueInput } from '../linear-client';

export async function updateIssueService(linearClient: LinearClient, args: any) {
  try {
    // Validate required arguments
    if (!args.issueId) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Issue ID is required to update an issue"
          }
        ],
        isError: true
      };
    }

    // Check if at least one field is being updated
    const hasUpdates = args.title || args.description || args.stateId || 
                      args.priority !== undefined || args.assigneeId !== undefined || 
                      args.labelIds;

    if (!hasUpdates) {
      return {
        content: [
          {
            type: "text",
            text: "Error: At least one field must be provided to update (title, description, stateId, priority, assigneeId, or labelIds)"
          }
        ],
        isError: true
      };
    }

    // Validate priority if provided
    if (args.priority !== undefined && (args.priority < 0 || args.priority > 4)) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Priority must be between 0 (no priority) and 4 (urgent)"
          }
        ],
        isError: true
      };
    }

    // Get the current issue first to show before/after
    let currentIssue;
    try {
      currentIssue = await linearClient.getIssueById(args.issueId);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Issue not found: ${args.issueId}. Please check the issue ID and try again.`
          }
        ],
        isError: true
      };
    }

    // Create the update input
    const updateInput: UpdateIssueInput = {
      issueId: args.issueId,
      title: args.title,
      description: args.description,
      stateId: args.stateId,
      priority: args.priority,
      assigneeId: args.assigneeId,
      labelIds: args.labelIds
    };

    // Update the issue
    const updatedIssue = await linearClient.updateIssue(updateInput);

    // Build change summary
    const changes: string[] = [];
    
    if (args.title && args.title !== currentIssue.title) {
      changes.push(`📝 Title: "${currentIssue.title}" → "${args.title}"`);
    }
    
    if (args.description !== undefined && args.description !== currentIssue.description) {
      changes.push(`📄 Description: Updated`);
    }
    
    if (args.stateId && args.stateId !== currentIssue.state.id) {
      changes.push(`📊 State: "${currentIssue.state.name}" → "${updatedIssue.state.name}"`);
    }
    
    if (args.priority !== undefined && args.priority !== currentIssue.priority) {
      const oldPriority = currentIssue.priority || 0;
      const newPriority = args.priority;
      const priorityNames = ['No priority', 'Low', 'Medium', 'High', 'Urgent'];
      changes.push(`⚡ Priority: ${priorityNames[oldPriority]} → ${priorityNames[newPriority]}`);
    }
    
    if (args.assigneeId !== undefined) {
      const oldAssignee = currentIssue.assignee?.name || 'Unassigned';
      const newAssignee = updatedIssue.assignee?.name || 'Unassigned';
      if (oldAssignee !== newAssignee) {
        changes.push(`👤 Assignee: ${oldAssignee} → ${newAssignee}`);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully updated issue: ${updatedIssue.identifier} - ${updatedIssue.title}

🔄 Changes made:
${changes.length > 0 ? changes.join('\n') : 'No visible changes detected'}

📋 Current details:
- ID: ${updatedIssue.id}
- Team: ${updatedIssue.team.name}
- State: ${updatedIssue.state.name}
- Priority: ${['No priority', 'Low', 'Medium', 'High', 'Urgent'][updatedIssue.priority] || 'No priority'}
- URL: ${updatedIssue.url}
${updatedIssue.assignee ? `- Assignee: ${updatedIssue.assignee.name}` : '- Unassigned'}
${updatedIssue.labels.length > 0 ? `\n🏷️ Labels: ${updatedIssue.labels.map(l => l.name).join(', ')}` : ''}`
        }
      ]
    };

  } catch (error) {
    console.error('Update issue error:', error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}
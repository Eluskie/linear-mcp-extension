import { LinearClient, SearchIssuesInput } from '../linear-client';

export async function searchIssuesService(linearClient: LinearClient, args: any) {
  try {
    // Validate limit
    const limit = args.limit ? Math.min(Math.max(1, parseInt(args.limit)), 50) : 25;

    // Create search input
    const searchInput: SearchIssuesInput = {
      query: args.query,
      teamId: args.teamId,
      assigneeId: args.assigneeId,
      stateId: args.stateId,
      limit
    };

    if (args.priority) {
      searchInput.priority = parseInt(args.priority);
    }

    // Search for issues
    const issues = await linearClient.searchIssues(searchInput);

    if (issues.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `🔍 No issues found matching your criteria.

${args.query ? `Query: "${args.query}"` : ''}
${args.teamId ? `Team ID: ${args.teamId}` : ''}
${args.assigneeId ? `Assignee ID: ${args.assigneeId}` : ''}
${args.stateId ? `State ID: ${args.stateId}` : ''}
${args.priority ? `Priority: ${args.priority}` : ''}

Try broadening your search criteria or use the get-teams tool to see available teams.`
          }
        ]
      };
    }

    // Format the results
    const resultsText = issues.map((issue: any, index: number) => {
      const assigneeText = issue.assignee ? ` • Assigned to ${issue.assignee.name}` : ' • Unassigned';
      const priorityText = issue.priority > 0 ? ` • Priority ${issue.priority}` : '';
      const labelsText = issue.labels.length > 0 ? ` • Labels: ${issue.labels.map((l: any) => l.name).join(', ')}` : '';
      
      return `${index + 1}. ${issue.identifier}: ${issue.title}
   📊 ${issue.state.name} in ${issue.team.name}${assigneeText}${priorityText}${labelsText}
   🔗 ${issue.url}`;
    }).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `🔍 Found ${issues.length} issue${issues.length === 1 ? '' : 's'}:

${resultsText}

${issues.length === limit ? `\n⚠️ Results limited to ${limit} items. Use a more specific search to see different results.` : ''}`
        }
      ]
    };

  } catch (error) {
    console.error('Search issues error:', error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to search issues: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}
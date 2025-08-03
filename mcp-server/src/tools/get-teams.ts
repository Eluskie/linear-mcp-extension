import { LinearClient } from '../linear-client';

export async function getTeamsService(linearClient: LinearClient, args: any) {
  try {
    // Get teams from Linear
    const teams = await linearClient.getTeams();

    if (teams.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `👥 No teams found. This could mean:
- You don't have access to any teams
- Your Linear API key doesn't have the required permissions
- There's an issue with the Linear connection

Please check your Linear account and API key permissions.`
          }
        ]
      };
    }

    // Format teams information
    const teamsText = teams.map((team: any, index: number) => {
      const statesText = team.states.length > 0 
        ? team.states.map((state: any) => `${state.name} (${state.type})`).join(', ')
        : 'No states available';
      
      return `${index + 1}. ${team.name} (${team.key})
   🆔 ID: ${team.id}
   📊 States: ${statesText}${team.description ? `\n   📝 ${team.description}` : ''}`;
    }).join('\n\n');

    // Get current user info
    let userInfo = '';
    try {
      const user = await linearClient.getCurrentUser();
      userInfo = `👤 Connected as: ${user.name} (${user.email})\n\n`;
    } catch (error) {
      console.error('Error getting user info:', error);
      // Continue without user info
    }

    return {
      content: [
        {
          type: "text",
          text: `${userInfo}👥 Found ${teams.length} team${teams.length === 1 ? '' : 's'}:

${teamsText}

💡 Use team IDs when creating or filtering issues. For example:
- Create issue: Use teamId "${teams[0]?.id}" for ${teams[0]?.name}
- Search issues: Filter by teamId to see issues from specific teams`
        }
      ]
    };

  } catch (error) {
    console.error('Get teams error:', error);
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to get teams: ${error instanceof Error ? error.message : 'Unknown error'}

This could be due to:
- Invalid Linear API key
- Network connectivity issues
- Insufficient permissions on your Linear account

Please check your configuration and try again.`
        }
      ],
      isError: true
    };
  }
}
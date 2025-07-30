import { LinearClient as LinearSDK, LinearDocument } from '@linear/sdk';

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  team: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  priority: number;
  labels: Array<{
    id: string;
    name: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
  states: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId: string;
  priority?: number;
  assigneeId?: string;
  labelIds?: string[];
  stateId?: string;
}

export interface UpdateIssueInput {
  issueId: string;
  title?: string;
  description?: string;
  stateId?: string;
  priority?: number;
  assigneeId?: string;
  labelIds?: string[];
}

export interface SearchIssuesInput {
  query?: string;
  teamId?: string;
  assigneeId?: string;
  stateId?: string;
  priority?: number;
  limit?: number;
}

export class LinearClient {
  private client: LinearSDK;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Linear API key is required');
    }
    
    this.client = new LinearSDK({ apiKey });
  }

  async createIssue(input: CreateIssueInput): Promise<LinearIssue> {
    try {
      const createInput: any = {
        title: input.title,
        teamId: input.teamId,
      };
      
      if (input.description) createInput.description = input.description;
      if (input.priority) createInput.priority = input.priority;
      if (input.assigneeId) createInput.assigneeId = input.assigneeId;
      if (input.labelIds) createInput.labelIds = input.labelIds;
      if (input.stateId) createInput.stateId = input.stateId;

      const issuePayload = await this.client.createIssue(createInput);

      if (!issuePayload.success) {
        throw new Error('Failed to create issue');
      }

      const issue = await issuePayload.issue;
      if (!issue) {
        throw new Error('Issue creation returned no data');
      }

      return await this.formatIssue(issue);
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateIssue(input: UpdateIssueInput): Promise<LinearIssue> {
    try {
      const updateInput: any = {};
      
      if (input.title) updateInput.title = input.title;
      if (input.description) updateInput.description = input.description;
      if (input.stateId) updateInput.stateId = input.stateId;
      if (input.priority !== undefined) updateInput.priority = input.priority;
      if (input.assigneeId) updateInput.assigneeId = input.assigneeId;
      if (input.labelIds) updateInput.labelIds = input.labelIds;

      const updatePayload = await this.client.updateIssue(input.issueId, updateInput);

      if (!updatePayload.success) {
        throw new Error('Failed to update issue');
      }

      const issue = await updatePayload.issue;
      if (!issue) {
        throw new Error('Issue update returned no data');
      }

      return await this.formatIssue(issue);
    } catch (error) {
      console.error('Error updating issue:', error);
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchIssues(input: SearchIssuesInput = {}): Promise<LinearIssue[]> {
    try {
      const filters: any = {};
      
      if (input.teamId) filters.team = { id: { eq: input.teamId } };
      if (input.assigneeId) filters.assignee = { id: { eq: input.assigneeId } };
      if (input.stateId) filters.state = { id: { eq: input.stateId } };
      if (input.priority) filters.priority = { eq: input.priority };

      const issues = await this.client.issues({
        filter: Object.keys(filters).length > 0 ? filters : undefined,
        first: Math.min(input.limit || 25, 50), // Cap at 50 for performance
        orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
      });

      const formattedIssues: LinearIssue[] = [];
      
      for (const issue of issues.nodes) {
        try {
          const formattedIssue = await this.formatIssue(issue);
          
          // Apply text search filter if provided
          if (input.query) {
            const searchQuery = input.query.toLowerCase();
            const matchesTitle = formattedIssue.title.toLowerCase().includes(searchQuery);
            const matchesDescription = formattedIssue.description?.toLowerCase().includes(searchQuery) || false;
            const matchesIdentifier = formattedIssue.identifier.toLowerCase().includes(searchQuery);
            
            if (matchesTitle || matchesDescription || matchesIdentifier) {
              formattedIssues.push(formattedIssue);
            }
          } else {
            formattedIssues.push(formattedIssue);
          }
        } catch (formatError) {
          console.error('Error formatting issue:', formatError);
          // Continue with other issues
        }
      }

      return formattedIssues;
    } catch (error) {
      console.error('Error searching issues:', error);
      throw new Error(`Failed to search issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTeams(): Promise<LinearTeam[]> {
    try {
      const teams = await this.client.teams({
        first: 50,
      });

      const formattedTeams: LinearTeam[] = [];

      for (const team of teams.nodes) {
        try {
          const states = await team.states();
          
          formattedTeams.push({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
            states: states.nodes.map(state => ({
              id: state.id,
              name: state.name,
              type: state.type,
            })),
          });
        } catch (stateError) {
          console.error('Error fetching team states:', stateError);
          // Add team without states
          formattedTeams.push({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
            states: [],
          });
        }
      }

      return formattedTeams;
    } catch (error) {
      console.error('Error getting teams:', error);
      throw new Error(`Failed to get teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIssueById(issueId: string): Promise<LinearIssue> {
    try {
      const issue = await this.client.issue(issueId);
      
      if (!issue) {
        throw new Error('Issue not found');
      }

      return await this.formatIssue(issue);
    } catch (error) {
      console.error('Error getting issue by ID:', error);
      throw new Error(`Failed to get issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentUser() {
    try {
      const viewer = await this.client.viewer;
      return {
        id: viewer.id,
        name: viewer.name,
        email: viewer.email,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw new Error(`Failed to get current user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async formatIssue(issue: any): Promise<LinearIssue> {
    try {
      // Fetch related data with error handling
      const [state, team, assignee, labels] = await Promise.allSettled([
        issue.state,
        issue.team,
        issue.assignee,
        issue.labels(),
      ]);

      const stateData = state.status === 'fulfilled' ? state.value : null;
      const teamData = team.status === 'fulfilled' ? team.value : null;
      const assigneeData = assignee.status === 'fulfilled' ? assignee.value : null;
      const labelsData = labels.status === 'fulfilled' ? labels.value : { nodes: [] };

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description || undefined,
        state: {
          id: stateData?.id || 'unknown',
          name: stateData?.name || 'Unknown',
          type: stateData?.type || 'unknown',
        },
        team: {
          id: teamData?.id || 'unknown',
          name: teamData?.name || 'Unknown',
        },
        assignee: assigneeData ? {
          id: assigneeData.id,
          name: assigneeData.name,
          email: assigneeData.email,
        } as { id: string; name: string; email: string } : undefined,
        priority: issue.priority || 0,
        labels: labelsData.nodes.map((label: any) => ({
          id: label.id,
          name: label.name,
        })),
        createdAt: new Date(issue.createdAt),
        updatedAt: new Date(issue.updatedAt),
        url: issue.url,
      };
    } catch (error) {
      console.error('Error formatting issue:', error);
      throw new Error(`Failed to format issue data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.viewer;
      return true;
    } catch (error) {
      console.error('Linear connection test failed:', error);
      return false;
    }
  }
}
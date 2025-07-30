export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCreateIssueInput(input: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!input.teamId || typeof input.teamId !== 'string') {
    errors.push('Team ID is required and must be a string');
  }

  // Optional field validation
  if (input.description && typeof input.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (input.priority !== undefined) {
    const priority = parseInt(input.priority);
    if (isNaN(priority) || priority < 1 || priority > 4) {
      errors.push('Priority must be a number between 1 (urgent) and 4 (no priority)');
    }
  }

  if (input.assigneeId && typeof input.assigneeId !== 'string') {
    errors.push('Assignee ID must be a string');
  }

  if (input.stateId && typeof input.stateId !== 'string') {
    errors.push('State ID must be a string');
  }

  if (input.labelIds && !Array.isArray(input.labelIds)) {
    errors.push('Label IDs must be an array of strings');
  }

  // String length limits
  if (input.title && input.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  if (input.description && input.description.length > 10000) {
    errors.push('Description must be 10,000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUpdateIssueInput(input: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.issueId || typeof input.issueId !== 'string') {
    errors.push('Issue ID is required and must be a string');
  }

  // At least one field to update
  const hasUpdates = input.title || input.description || input.stateId || 
                    input.priority !== undefined || input.assigneeId !== undefined || 
                    input.labelIds;

  if (!hasUpdates) {
    errors.push('At least one field must be provided to update');
  }

  // Optional field validation
  if (input.title && (typeof input.title !== 'string' || input.title.trim().length === 0)) {
    errors.push('Title must be a non-empty string');
  }

  if (input.description && typeof input.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (input.priority !== undefined) {
    const priority = parseInt(input.priority);
    if (isNaN(priority) || priority < 0 || priority > 4) {
      errors.push('Priority must be a number between 0 (no priority) and 4 (urgent)');
    }
  }

  if (input.assigneeId && typeof input.assigneeId !== 'string') {
    errors.push('Assignee ID must be a string');
  }

  if (input.stateId && typeof input.stateId !== 'string') {
    errors.push('State ID must be a string');
  }

  if (input.labelIds && !Array.isArray(input.labelIds)) {
    errors.push('Label IDs must be an array of strings');
  }

  // String length limits
  if (input.title && input.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  if (input.description && input.description.length > 10000) {
    errors.push('Description must be 10,000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateSearchIssuesInput(input: any): ValidationResult {
  const errors: string[] = [];

  // All fields are optional for search
  if (input.query && typeof input.query !== 'string') {
    errors.push('Query must be a string');
  }

  if (input.teamId && typeof input.teamId !== 'string') {
    errors.push('Team ID must be a string');
  }

  if (input.assigneeId && typeof input.assigneeId !== 'string') {
    errors.push('Assignee ID must be a string');
  }

  if (input.stateId && typeof input.stateId !== 'string') {
    errors.push('State ID must be a string');
  }

  if (input.priority !== undefined) {
    const priority = parseInt(input.priority);
    if (isNaN(priority) || priority < 1 || priority > 4) {
      errors.push('Priority must be a number between 1 and 4');
    }
  }

  if (input.limit !== undefined) {
    const limit = parseInt(input.limit);
    if (isNaN(limit) || limit < 1 || limit > 50) {
      errors.push('Limit must be a number between 1 and 50');
    }
  }

  // String length limits
  if (input.query && input.query.length > 500) {
    errors.push('Query must be 500 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

export function isValidLinearId(id: string): boolean {
  // Linear IDs typically follow a pattern like "abc123def456"
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) ||
         /^[a-zA-Z0-9]{20,30}$/.test(id);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];

  if (!process.env.LINEAR_API_KEY && process.env.NODE_ENV === 'production') {
    errors.push('LINEAR_API_KEY environment variable is required in production');
  }

  if (!process.env.PORT) {
    // This is okay, we have a default
  }

  if (process.env.RATE_LIMIT_MAX_REQUESTS) {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS);
    if (isNaN(maxRequests) || maxRequests < 1) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be a positive number');
    }
  }

  if (process.env.RATE_LIMIT_WINDOW_MS) {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS);
    if (isNaN(windowMs) || windowMs < 1000) {
      errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000 (1 second)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
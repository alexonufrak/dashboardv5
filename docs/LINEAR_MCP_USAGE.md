# Linear MCP Integration Guide

## Overview
This project uses Linear for project and issue management, integrated via the Model Context Protocol (MCP). This allows Claude Code to interact directly with Linear to help manage issues, tasks, and projects.

## Installation
The Linear MCP server has been installed using:

```bash
claude mcp add linear npx @tacticlaunch/mcp-linear -- --token YOUR_LINEAR_API_TOKEN
```

This installation method passes the Linear API token directly as a command argument, which is more reliable than setting it as an environment variable.

## Features and Capabilities

### Issue Management
- **Create Issues**: Create new issues with titles, descriptions, and assignments
- **View Issues**: View open issues, filtered by assignee, team, status
- **Update Issues**: Change status, priority, due dates
- **Comment on Issues**: Add comments to existing issues

### Team Management
- **View Teams**: List all teams in your Linear workspace
- **Create Teams**: Create new teams in Linear

### Project Management
- **View Projects**: List active projects
- **Create Projects**: Set up new projects with descriptions and target dates

## Example Commands

### Issues
- "Show me all my Linear issues"
- "Show all open bugs in the Frontend team"
- "Create a new issue titled 'Fix login bug' in the Frontend team"
- "Change the status of issue FE-123 to 'In Progress'"
- "Assign issue BE-456 to John Smith"
- "Add a comment to issue UI-789: 'This needs to be fixed by Friday'"
- "What's the priority of issue CORE-42?"

### Teams
- "List all teams in Linear"
- "Who are the members of the Frontend team?"
- "Create a new team called 'Security'"

### Projects
- "Show all active projects"
- "Create a new project called 'Q2 Platform Upgrade' with the description 'Upgrade all services to latest versions'"
- "When is the 'Mobile App Launch' project due?"

## API Token Configuration
The Linear MCP server requires a Linear API token to function properly. The token should be set in the environment variable `LINEAR_API_TOKEN`.

If you need to update or configure your token:
1. Log in to your Linear account at [linear.app](https://linear.app/)
2. Click on organization avatar (top-left corner)
3. Select **Settings**
4. Navigate to **Security & access** in the left sidebar
5. Under **Personal API Keys** click **New API Key**
6. Give your key a name (e.g., `MCP Linear Integration`)
7. Copy the generated API token

## Troubleshooting
- If Linear MCP tools aren't appearing, check if the server is properly installed
- If you encounter authentication errors, verify your Linear API token
- For connection issues, ensure your network allows connections to Linear's API
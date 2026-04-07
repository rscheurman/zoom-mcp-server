# Zoom API MCP Server

A comprehensive Model Context Protocol (MCP) server for interacting with the Zoom API. Designed for use with Claude Desktop so individual users can connect their Zoom accounts.

## Features

- **Team Chat read/query tools** -- read message history, search messages, browse threads, and list channel members
- Channel and message management (create, send, update, delete)
- Coverage of Meetings, Users, Webinars, Recordings, Reports, and more
- OAuth 2.0 Server-to-Server authentication
- Structured tools with Zod validation
- API documentation resources

## Team Chat Tools

These tools let an AI agent look things up in Zoom Team Chat. All tools operate as the authenticated user and only access channels the user belongs to.

### Read & Query

| Tool | Description |
|------|-------------|
| `list_channels` | List channels the user is a member of |
| `get_channel` | Get a channel's information (name, type, settings) |
| `list_channel_messages` | List messages in a channel for a given date with pagination |
| `list_dm_messages` | List direct messages with a specific contact |
| `list_channel_members` | List members of a channel (id, email, name, role) |
| `search_channel_messages` | Search messages by keyword in a channel (client-side filtering) |
| `get_message_replies` | Get all replies in a message thread by parent message ID |
| `get_chat_message` | Look up a specific message by its ID |

### Write

| Tool | Description |
|------|-------------|
| `send_channel_message` | Send a message to a channel |
| `create_channel` | Create a new channel |
| `update_channel` | Update a channel's name |
| `delete_channel` | Delete a channel |

## Getting Started

### Prerequisites

- Node.js 16+
- A Zoom Server-to-Server OAuth app ([create one here](https://marketplace.zoom.us/))

### Zoom App Setup

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/) and create a **Server-to-Server OAuth** app
2. Note your **Client ID**, **Client Secret**, and **Account ID**
3. Add these scopes to your app:
   - `chat_message:read` -- read messages in channels and DMs
   - `chat_channel:read` -- list channels and channel members
   - `chat_message:write` -- send messages (if using write tools)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Zoom API credentials:
   ```
   ZOOM_CLIENT_ID=your_client_id
   ZOOM_CLIENT_SECRET=your_client_secret
   ZOOM_ACCOUNT_ID=your_account_id
   ```

### Running the Server

```
npm run dev
```

### Testing with MCP Inspector

```
npm run inspect
```

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zoom": {
      "command": "node",
      "args": ["/absolute/path/to/zoom-mcp-server/src/index.js"],
      "env": {
        "ZOOM_CLIENT_ID": "your_client_id",
        "ZOOM_CLIENT_SECRET": "your_client_secret",
        "ZOOM_ACCOUNT_ID": "your_account_id"
      }
    }
  }
}
```

## Other API Categories

- **Meetings**: Create, read, update, and delete meetings
- **Users**: Manage users in your Zoom account
- **Webinars**: Create and manage webinars
- **Account**: Manage account settings and profile
- **Phone**: Manage Zoom Phone users and numbers
- **Contacts**: Manage contacts
- **Recordings**: Access and manage cloud recordings
- **Reports**: Generate various reports
- **Webhooks**: Set up event notifications
- **Zoom Rooms**: Manage Zoom Rooms

## Resources

Access API documentation through resources:

```
zoom-api://overview
zoom-api://chat
zoom-api://team-chat
zoom-api://meetings
```

## Authentication

The server handles OAuth 2.0 authentication automatically using Server-to-Server OAuth app credentials. Each user configures their own credentials via environment variables or the Claude Desktop config.

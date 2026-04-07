import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

    // API documentation resources
    export const apiDocs = [
      {
        name: "api_docs",
        template: new ResourceTemplate("zoom-api://{category}", { list: undefined }),
        handler: async (uri, { category }) => {
          const docs = getApiDocs(category);
          
          return {
            contents: [{
              uri: uri.href,
              text: docs
            }]
          };
        }
      }
    ];

    // Helper function to get API documentation
    function getApiDocs(category) {
      const categories = {
        "overview": `# Zoom API Overview

The Zoom API is a REST API that allows developers to access information from Zoom and to update information in Zoom. The API is available to all Zoom accounts.

## Authentication

Zoom API uses OAuth 2.0 for authentication. You need to create a Server-to-Server OAuth app in the Zoom App Marketplace to get your credentials.

## Rate Limits

Zoom implements rate limits to protect against overuse and abuse of the API. The rate limits are based on the number of requests per second.

## Base URL

All API requests should be made to: \`https://api.zoom.us/v2/\``,

        "meetings": `# Zoom Meetings API

The Meetings API allows you to create, read, update, and delete Zoom meetings.

## Endpoints

- GET /users/{userId}/meetings - List a user's meetings
- POST /users/{userId}/meetings - Create a meeting for a user
- GET /meetings/{meetingId} - Get a meeting
- PATCH /meetings/{meetingId} - Update a meeting
- DELETE /meetings/{meetingId} - Delete a meeting
- GET /report/meetings/{meetingId}/participants - Get meeting participants report`,

        "users": `# Zoom Users API

The Users API allows you to manage users in your Zoom account.

## Endpoints

- GET /users - List users
- POST /users - Create a user
- GET /users/{userId} - Get a user
- PATCH /users/{userId} - Update a user
- DELETE /users/{userId} - Delete a user`,

        "webinars": `# Zoom Webinars API

The Webinars API allows you to create, read, update, and delete Zoom webinars.

## Endpoints

- GET /users/{userId}/webinars - List a user's webinars
- POST /users/{userId}/webinars - Create a webinar for a user
- GET /webinars/{webinarId} - Get a webinar
- PATCH /webinars/{webinarId} - Update a webinar
- DELETE /webinars/{webinarId} - Delete a webinar
- GET /report/webinars/{webinarId}/participants - Get webinar participants report`,

        "account": `# Zoom Account API

The Account API allows you to manage your Zoom account settings and profile.

## Endpoints

- GET /accounts/me/settings - Get account settings
- PATCH /accounts/me/settings - Update account settings
- GET /accounts/me - Get account profile
- GET /accounts - List sub accounts
- POST /accounts - Create a sub account`,

        "chat": `# Zoom Chat API

The Chat API allows you to manage Zoom Chat channels and messages, read message history, search conversations, and browse channel membership.

## Channel Management

- GET /chat/users/me/channels - List channels the user belongs to
- POST /chat/users/me/channels - Create a channel
- GET /chat/channels/{channelId} - Get a channel's information
- PATCH /chat/channels/{channelId} - Update a channel
- DELETE /chat/channels/{channelId} - Delete a channel

## Messages

- POST /chat/users/me/channels/{channelId}/messages - Send a message to a channel
- GET /chat/users/me/messages?to_channel={channelId} - List messages in a channel (paginated, date-scoped)
- GET /chat/users/me/messages?to_contact={email} - List direct messages with a contact (paginated, date-scoped)

## Channel Members

- GET /chat/users/me/channels/{channelId}/members - List members of a channel

## Search & Threads (Client-Side)

- search_channel_messages - Search messages by keyword within a channel (client-side filtering)
- get_message_replies - Get all replies in a message thread by parent message ID
- get_chat_message - Look up a specific message by its ID

## Required Scopes

- chat_message:read - Read messages in channels and DMs
- chat_channel:read - List channel members
- chat_message:write - Send messages`,

        "team-chat": `# Zoom Team Chat - Read & Query Tools

Tools for reading and searching Zoom Team Chat history. All tools operate as the authenticated user and only access channels the user belongs to.

## Reading Messages

### list_channel_messages
Read message history from a channel. Messages are scoped to a single date (defaults to today).
- Required: channel_id
- Optional: date (YYYY-MM-DD), page_size (1-50), next_page_token, include_deleted_and_edited_message
- Use next_page_token to paginate through a full day's history

### list_dm_messages
Read direct message history with a specific contact.
- Required: to_contact (email address)
- Optional: date, page_size, next_page_token, include_deleted_and_edited_message

## Searching

### search_channel_messages
Search for messages containing a keyword in a channel. Fetches multiple pages and filters client-side.
- Required: channel_id, query (search term)
- Optional: date, max_pages (1-10, default 5)
- Each page fetches up to 50 messages

## Threads

### get_message_replies
Read all replies in a message thread given the parent message ID.
- Required: channel_id, parent_message_id
- Optional: date, max_pages (1-10, default 5)

### get_chat_message
Look up a specific message by its ID.
- Required: channel_id, message_id, date

## Channel Members

### list_channel_members
List all members of a channel with their name, email, and role.
- Required: channel_id
- Optional: page_size (1-100), next_page_token

## Usage Patterns

1. Start with list_channels to discover available channels
2. Use list_channel_messages to read recent history
3. Use search_channel_messages to find specific topics
4. Use get_message_replies to read threaded conversations
5. Use list_channel_members to see who is in a channel`,

        "phone": `# Zoom Phone API

The Phone API allows you to manage Zoom Phone users and numbers.

## Endpoints

- GET /phone/users - List phone users
- GET /phone/users/{userId} - Get a phone user
- PATCH /phone/users/{userId} - Update a phone user
- GET /phone/numbers - List phone numbers`,

        "recordings": `# Zoom Recordings API

The Recordings API allows you to manage cloud recordings.

## Endpoints

- GET /users/{userId}/recordings - List all recordings for a user
- GET /meetings/{meetingId}/recordings - Get recordings for a specific meeting
- DELETE /meetings/{meetingId}/recordings - Delete recordings for a specific meeting
- DELETE /meetings/{meetingId}/recordings/{recordingId} - Delete a specific recording file`,

        "webhooks": `# Zoom Webhooks API

The Webhooks API allows you to manage webhooks for event notifications.

## Endpoints

- GET /webhooks - List webhooks
- POST /webhooks - Create a webhook
- GET /webhooks/{webhookId} - Get a webhook
- PATCH /webhooks/{webhookId} - Update a webhook
- DELETE /webhooks/{webhookId} - Delete a webhook`
      };
      
      return categories[category.toLowerCase()] || 
        `# Zoom API Documentation

Available categories:
- overview
- meetings
- users
- webinars
- account
- chat
- team-chat
- phone
- recordings
- webhooks

Access documentation by using: zoom-api://{category}`;
    }

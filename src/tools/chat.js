import { z } from 'zod';
import { zoomApi, handleApiResponse, handleApiError } from '../utils/api.js';

export const chatTools = [
  {
    name: "list_channels",
    description: "List the Zoom chat channels the authenticated user is a member of",
    schema: {
      page_size: z.number().min(1).max(300).optional().describe("Number of records returned"),
      next_page_token: z.string().optional().describe("Next page token for pagination")
    },
    handler: async ({ page_size, next_page_token }) => {
      try {
        const params = {};
        if (page_size) params.page_size = page_size;
        if (next_page_token) params.next_page_token = next_page_token;

        const response = await zoomApi.get('/chat/users/me/channels', { params });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "create_channel",
    description: "Create a channel",
    schema: {
      name: z.string().describe("Channel name"),
      type: z.number().min(1).max(2).describe("Channel type (1: Private, 2: Public)"),
      members: z.array(z.object({
        email: z.string().email().describe("Member email address")
      })).optional().describe("Channel members")
    },
    handler: async (channelData) => {
      try {
        const response = await zoomApi.post('/chat/users/me/channels', channelData);
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "get_channel",
    description: "Get a channel's information including name, type, and settings",
    schema: {
      channel_id: z.string().describe("The channel ID")
    },
    handler: async ({ channel_id }) => {
      try {
        const response = await zoomApi.get(`/chat/channels/${channel_id}`);
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "update_channel",
    description: "Update a channel's information",
    schema: {
      channel_id: z.string().describe("The channel ID"),
      name: z.string().optional().describe("Channel name")
    },
    handler: async ({ channel_id, ...channelData }) => {
      try {
        const response = await zoomApi.patch(`/chat/channels/${channel_id}`, channelData);
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "delete_channel",
    description: "Delete a channel",
    schema: {
      channel_id: z.string().describe("The channel ID")
    },
    handler: async ({ channel_id }) => {
      try {
        const response = await zoomApi.delete(`/chat/channels/${channel_id}`);
        return {
          content: [{
            type: "text",
            text: "Channel deleted successfully"
          }]
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "send_channel_message",
    description: "Send a message to a channel the user belongs to",
    schema: {
      channel_id: z.string().describe("The channel ID"),
      message: z.string().describe("Message content")
    },
    handler: async ({ channel_id, message }) => {
      try {
        const response = await zoomApi.post('/chat/users/me/messages', {
          message,
          to_channel: channel_id
        });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "send_direct_message",
    description: "Send a direct message to a Zoom contact by email",
    schema: {
      to_contact: z.string().describe("Email address of the contact to message"),
      message: z.string().describe("Message content")
    },
    handler: async ({ to_contact, message }) => {
      try {
        const response = await zoomApi.post('/chat/users/me/messages', {
          message,
          to_contact
        });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },

  // ── Read / Query Tools ──────────────────────────────────────────────

  {
    name: "list_channel_messages",
    description: "List chat messages in a channel. Returns messages for a given date (defaults to today). Use next_page_token to paginate through results. Each message includes id, sender, message content, and timestamp. Reply messages include reply_main_message_id.",
    schema: {
      channel_id: z.string().describe("The channel ID to read messages from"),
      date: z.string().optional().describe("Date to query messages for in YYYY-MM-DD format (defaults to today)"),
      page_size: z.number().min(1).max(50).optional().describe("Number of messages per page (default 10, max 50)"),
      next_page_token: z.string().optional().describe("Token for paginating through results"),
      include_deleted_and_edited_message: z.boolean().optional().describe("Set to true to include edited and deleted messages")
    },
    handler: async ({ channel_id, date, page_size, next_page_token, include_deleted_and_edited_message }) => {
      try {
        const params = { to_channel: channel_id };
        if (date) params.date = date;
        if (page_size) params.page_size = page_size;
        if (next_page_token) params.next_page_token = next_page_token;
        if (include_deleted_and_edited_message) params.include_deleted_and_edited_message = 'true';

        const response = await zoomApi.get('/chat/users/me/messages', { params });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "list_dm_messages",
    description: "List direct messages between the authenticated user and a contact. Returns messages for a given date (defaults to today). Use next_page_token to paginate through results.",
    schema: {
      to_contact: z.string().describe("Email address of the contact to retrieve DM history with"),
      date: z.string().optional().describe("Date to query messages for in YYYY-MM-DD format (defaults to today)"),
      page_size: z.number().min(1).max(50).optional().describe("Number of messages per page (default 10, max 50)"),
      next_page_token: z.string().optional().describe("Token for paginating through results"),
      include_deleted_and_edited_message: z.boolean().optional().describe("Set to true to include edited and deleted messages")
    },
    handler: async ({ to_contact, date, page_size, next_page_token, include_deleted_and_edited_message }) => {
      try {
        const params = { to_contact };
        if (date) params.date = date;
        if (page_size) params.page_size = page_size;
        if (next_page_token) params.next_page_token = next_page_token;
        if (include_deleted_and_edited_message) params.include_deleted_and_edited_message = 'true';

        const response = await zoomApi.get('/chat/users/me/messages', { params });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "list_channel_members",
    description: "List members of a channel the authenticated user belongs to. Returns each member's id, email, first name, last name, and role (owner, admin, or member).",
    schema: {
      channel_id: z.string().describe("The channel ID"),
      page_size: z.number().min(1).max(100).optional().describe("Number of members per page (default 30, max 100)"),
      next_page_token: z.string().optional().describe("Token for paginating through results")
    },
    handler: async ({ channel_id, page_size, next_page_token }) => {
      try {
        const params = {};
        if (page_size) params.page_size = page_size;
        if (next_page_token) params.next_page_token = next_page_token;

        const response = await zoomApi.get(`/chat/users/me/channels/${channel_id}/members`, { params });
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "search_channel_messages",
    description: "Search for messages containing a keyword in a channel. Fetches messages page by page and filters client-side since Zoom has no server-side search API. Returns matching messages with sender, content, and timestamps. Use the date param to search a specific day.",
    schema: {
      channel_id: z.string().describe("The channel ID to search in"),
      query: z.string().describe("Search keyword or phrase (case-insensitive substring match)"),
      date: z.string().optional().describe("Date to search in YYYY-MM-DD format (defaults to today)"),
      max_pages: z.number().min(1).max(10).optional().describe("Maximum pages to fetch and search through (default 5, max 10). Each page has up to 50 messages.")
    },
    handler: async ({ channel_id, query, date, max_pages }) => {
      try {
        const limit = Math.min(max_pages || 5, 10);
        const lowerQuery = query.toLowerCase();
        const matches = [];
        let nextToken = undefined;

        for (let page = 0; page < limit; page++) {
          const params = { to_channel: channel_id, page_size: 50 };
          if (date) params.date = date;
          if (nextToken) params.next_page_token = nextToken;

          const response = await zoomApi.get('/chat/users/me/messages', { params });
          const data = response.data;

          if (data.messages) {
            for (const msg of data.messages) {
              if (msg.message && msg.message.toLowerCase().includes(lowerQuery)) {
                matches.push(msg);
              }
            }
          }

          nextToken = data.next_page_token;
          if (!nextToken) break;
        }

        const result = {
          query,
          date: date || new Date().toISOString().split('T')[0],
          total_matches: matches.length,
          messages: matches
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "get_message_replies",
    description: "Get all replies in a message thread. Given a parent message ID, fetches messages from the channel and returns those that are replies to that parent. Useful for reading threaded conversations.",
    schema: {
      channel_id: z.string().describe("The channel ID containing the thread"),
      parent_message_id: z.string().describe("The message ID of the parent/root message in the thread"),
      date: z.string().optional().describe("Date the thread occurred in YYYY-MM-DD format (defaults to today)"),
      max_pages: z.number().min(1).max(10).optional().describe("Maximum pages to fetch (default 5, max 10). Each page has up to 50 messages.")
    },
    handler: async ({ channel_id, parent_message_id, date, max_pages }) => {
      try {
        const limit = Math.min(max_pages || 5, 10);
        const replies = [];
        let nextToken = undefined;

        for (let page = 0; page < limit; page++) {
          const params = { to_channel: channel_id, page_size: 50 };
          if (date) params.date = date;
          if (nextToken) params.next_page_token = nextToken;

          const response = await zoomApi.get('/chat/users/me/messages', { params });
          const data = response.data;

          if (data.messages) {
            for (const msg of data.messages) {
              if (msg.reply_main_message_id === parent_message_id) {
                replies.push(msg);
              }
            }
          }

          nextToken = data.next_page_token;
          if (!nextToken) break;
        }

        const result = {
          parent_message_id,
          date: date || new Date().toISOString().split('T')[0],
          total_replies: replies.length,
          replies
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "get_chat_message",
    description: "Get a specific chat message by its ID from a channel. Searches through messages on the given date to find the matching message.",
    schema: {
      channel_id: z.string().describe("The channel ID containing the message"),
      message_id: z.string().describe("The unique message ID to look up"),
      date: z.string().describe("Date the message was sent in YYYY-MM-DD format")
    },
    handler: async ({ channel_id, message_id, date }) => {
      try {
        let nextToken = undefined;
        const MAX_PAGES = 10;

        for (let page = 0; page < MAX_PAGES; page++) {
          const params = { to_channel: channel_id, page_size: 50 };
          if (date) params.date = date;
          if (nextToken) params.next_page_token = nextToken;

          const response = await zoomApi.get('/chat/users/me/messages', { params });
          const data = response.data;

          if (data.messages) {
            const found = data.messages.find(msg => msg.id === message_id);
            if (found) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(found, null, 2)
                }]
              };
            }
          }

          nextToken = data.next_page_token;
          if (!nextToken) break;
        }

        return {
          content: [{
            type: "text",
            text: `Message with ID "${message_id}" not found in channel on ${date}`
          }],
          isError: true
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  {
    name: "find_user",
    description: "Find a Zoom user by name. Searches across the authenticated user's channels to find a person's email, name, and role. Use this when you know someone's name but need their email for other tools like send_direct_message or list_dm_messages.",
    schema: {
      name: z.string().describe("The person's name to search for (first name, last name, or full name - case insensitive)")
    },
    handler: async ({ name }) => {
      try {
        const lowerName = name.toLowerCase();
        const seen = new Set();
        const matches = [];
        let nextToken = undefined;

        const channelsResponse = await zoomApi.get('/chat/users/me/channels', { params: { page_size: 50 } });
        const channels = channelsResponse.data.channels || [];

        for (const channel of channels.slice(0, 10)) {
          try {
            const membersResponse = await zoomApi.get(`/chat/users/me/channels/${channel.id}/members`, {
              params: { page_size: 100 }
            });
            const members = membersResponse.data.members || [];
            for (const m of members) {
              if (seen.has(m.email)) continue;
              seen.add(m.email);
              const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
              if (fullName.includes(lowerName) ||
                  (m.first_name || '').toLowerCase().includes(lowerName) ||
                  (m.last_name || '').toLowerCase().includes(lowerName)) {
                matches.push({
                  first_name: m.first_name,
                  last_name: m.last_name,
                  email: m.email,
                  id: m.id,
                  role: m.role
                });
              }
            }
          } catch {
            continue;
          }
          if (matches.length >= 10) break;
        }

        const result = {
          query: name,
          total_matches: matches.length,
          users: matches
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  }
];

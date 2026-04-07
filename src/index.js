#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import { ensureTokens } from './utils/auth.js';
import dotenv from 'dotenv';

dotenv.config();

console.error('Starting Zoom MCP server...');

await ensureTokens();

const transport = new StdioServerTransport();
await server.connect(transport);

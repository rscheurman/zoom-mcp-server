#!/usr/bin/env node
import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';
import { exchangeCodeForTokens } from './utils/auth.js';

dotenv.config();

const PORT = 4200;
const REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;

const clientId = process.env.ZOOM_CLIENT_ID;
if (!clientId) {
  console.error('Error: ZOOM_CLIENT_ID is not set. Create a .env file with your credentials.');
  process.exit(1);
}

const scopes = [
  'team_chat:read:list_user_messages',
  'team_chat:read:user_message',
  'team_chat:read:thread_message',
  'team_chat:read:list_user_channels',
  'team_chat:read:list_members',
  'team_chat:read:channel',
  'team_chat:write:user_message',
  'message:write:content'
].join(' ');

const authorizeUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/oauth/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Authorization failed</h1><p>${error}</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Missing authorization code</h1>');
      return;
    }

    try {
      await exchangeCodeForTokens(code, REDIRECT_URI);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Zoom authorization successful!</h1><p>You can close this tab. The MCP server is ready to use.</p>');
      console.log('\nAuthorization successful! Tokens saved to data/tokens.json');
      console.log('You can now start the MCP server with: npm start');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Token exchange failed</h1><pre>${err.message}</pre>`);
      console.error('Token exchange failed:', err.response?.data || err.message);
    }

    setTimeout(() => { server.close(); process.exit(0); }, 1000);
    return;
  }

  res.writeHead(302, { 'Location': authorizeUrl });
  res.end();
});

server.listen(PORT, () => {
  console.log(`\nZoom OAuth Setup`);
  console.log(`================`);
  console.log(`\nOpen this URL in your browser to authorize:\n`);
  console.log(`  ${authorizeUrl}\n`);
  console.log(`Or visit http://localhost:${PORT} to be redirected.\n`);
  console.log('Waiting for authorization...');
});

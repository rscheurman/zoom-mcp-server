import axios from 'axios';
import http from 'http';
import { URL } from 'url';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { exec } from 'child_process';

let accessToken = null;
let tokenExpiry = 0;

const TOKEN_PATH = process.env.ZOOM_TOKEN_PATH || join(process.cwd(), 'data', 'tokens.json');

function loadTokens() {
  try {
    const raw = readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTokens(tokens) {
  const dir = dirname(TOKEN_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

function getBasicAuth() {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing ZOOM_CLIENT_ID or ZOOM_CLIENT_SECRET.');
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

export async function exchangeCodeForTokens(code, redirectUri) {
  const response = await axios.post('https://zoom.us/oauth/token', null, {
    params: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    },
    headers: { 'Authorization': `Basic ${getBasicAuth()}` }
  });
  const tokens = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: Date.now() + (response.data.expires_in * 1000) - 60000
  };
  saveTokens(tokens);
  return tokens;
}

async function refreshAccessToken(refreshToken) {
  const response = await axios.post('https://zoom.us/oauth/token', null, {
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    },
    headers: { 'Authorization': `Basic ${getBasicAuth()}` }
  });
  const tokens = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: Date.now() + (response.data.expires_in * 1000) - 60000
  };
  saveTokens(tokens);
  return tokens;
}

export const getAccessToken = async () => {
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken;
  }

  // Support legacy S2S OAuth if ZOOM_ACCOUNT_ID is set
  if (process.env.ZOOM_ACCOUNT_ID) {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID
      },
      headers: { 'Authorization': `Basic ${getBasicAuth()}` }
    });
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
    return accessToken;
  }

  // General App: use stored refresh token
  const stored = loadTokens();
  if (!stored?.refresh_token) {
    throw new Error(
      'No OAuth tokens found. Run "npm run setup" to authorize with Zoom first.'
    );
  }

  if (stored.access_token && stored.expires_at > Date.now()) {
    accessToken = stored.access_token;
    tokenExpiry = stored.expires_at;
    return accessToken;
  }

  try {
    const tokens = await refreshAccessToken(stored.refresh_token);
    accessToken = tokens.access_token;
    tokenExpiry = tokens.expires_at;
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw new Error(
      'Token refresh failed. Run "npm run setup" to re-authorize with Zoom.'
    );
  }
};

const OAUTH_SCOPES = [
  'team_chat:read:list_user_messages',
  'team_chat:read:user_message',
  'team_chat:read:thread_message',
  'team_chat:read:list_user_channels',
  'team_chat:read:list_members',
  'team_chat:read:channel',
  'team_chat:write:user_message',
  'message:write:content'
].join(' ');

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

export async function ensureTokens() {
  if (process.env.ZOOM_ACCOUNT_ID) return;

  const stored = loadTokens();
  if (stored?.refresh_token) return;

  const clientId = process.env.ZOOM_CLIENT_ID;
  if (!clientId) return;

  const PORT = 4200;
  const redirectUri = `http://localhost:${PORT}/oauth/callback`;
  const authorizeUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(OAUTH_SCOPES)}`;

  console.error('\n=== Zoom Authorization Required ===');
  console.error('Opening your browser to authorize with Zoom...');
  console.error(`If it doesn't open, visit: ${authorizeUrl}\n`);

  openBrowser(authorizeUrl);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      srv.close();
      reject(new Error('OAuth authorization timed out after 5 minutes.'));
    }, 300000);

    const srv = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (url.pathname !== '/oauth/callback') {
        res.writeHead(302, { 'Location': authorizeUrl });
        res.end();
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization failed</h1><p>No code received.</p>');
        return;
      }

      try {
        await exchangeCodeForTokens(code, redirectUri);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Zoom authorized!</h1><p>You can close this tab. The Zoom MCP tools are now ready in Claude.</p>');
        console.error('Zoom authorization successful!');
        clearTimeout(timeout);
        srv.close();
        resolve();
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authorization failed</h1><pre>${err.message}</pre>`);
        clearTimeout(timeout);
        srv.close();
        reject(err);
      }
    });

    srv.listen(PORT, () => {
      console.error(`Waiting for authorization on port ${PORT}...`);
    });
  });
}

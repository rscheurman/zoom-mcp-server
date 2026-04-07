import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

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

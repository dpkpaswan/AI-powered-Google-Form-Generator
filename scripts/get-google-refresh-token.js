import 'dotenv/config';
import http from 'node:http';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/drive'];

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return v;
}

const clientId = required('GOOGLE_OAUTH_CLIENT_ID');
const clientSecret = required('GOOGLE_OAUTH_CLIENT_SECRET');
const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://127.0.0.1:53682/oauth2callback';

const oauth2 = new google.auth.OAuth2({ clientId, clientSecret, redirectUri });

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES
});

console.log('1) Open this URL in your browser and approve access:');
console.log(authUrl);
console.log('\n2) Waiting for Google to redirect back to:');
console.log(redirectUri);

const { port, pathname } = new URL(redirectUri);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, redirectUri);
    if (url.pathname !== pathname) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(`OAuth error: ${error}`);
      console.error('OAuth error:', error);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing code');
      return;
    }

    const { tokens } = await oauth2.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Success. You can close this tab and return to the terminal.');

    if (!tokens.refresh_token) {
      console.error('No refresh_token returned. Try again with prompt=consent and ensure you are not reusing an already-granted consent.');
      console.error('Tokens:', tokens);
      server.close();
      process.exit(1);
    }

    console.log('\nRefresh token obtained:');
    console.log(tokens.refresh_token);
    console.log('\nAdd this to your backend .env:');
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);

    server.close();
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal error');
    console.error('Token exchange failed:', e?.message);
    console.error('status:', e?.response?.status);
    console.error('data:', e?.response?.data);
    server.close();
    process.exit(1);
  }
});

server.listen(Number(port), '127.0.0.1', () => {
  console.log(`\nLocal callback server listening on 127.0.0.1:${port}`);
});

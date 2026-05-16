/**
 * One-time authorization script.
 *
 * Before running:
 *   1. Download your OAuth 2.0 Desktop app credentials from GCP and save
 *      them as oauth_credentials.json in this folder.
 *   2. Make sure the server is NOT already running on port 3001.
 *
 * Run once with:
 *   node authorize.js
 *
 * A browser window opens, you click Allow, and token.json is written.
 * After that, the server handles all uploads automatically — no further
 * action needed unless you revoke access.
 */

const { google } = require('googleapis');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CALLBACK_PORT = 3001;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/oauth2callback`;
const CREDS_PATH = path.join(__dirname, 'oauth_credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function main() {
  if (!fs.existsSync(CREDS_PATH)) {
    console.error(
      '\n✗ oauth_credentials.json not found.\n' +
      '  Download it from GCP Console → APIs & Services → Credentials\n' +
      '  → your OAuth 2.0 Client ID → Download JSON.\n' +
      '  Save it as oauth_credentials.json in this folder.\n'
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = raw.installed || raw.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',        // always re-consent so we get a refresh_token
    scope: SCOPES,
  });

  console.log('\nOpening your browser for Google authorization…\n');

  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${opener} "${authUrl}"`);

  // Spin up a tiny local server to catch the redirect from Google.
  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const { searchParams } = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = searchParams.get('code');

      if (!code) {
        res.writeHead(400);
        res.end('Authorization code missing.');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family:-apple-system,sans-serif;text-align:center;padding:80px 24px;color:#1a2c4e">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 16px;display:block"><polyline points="20 6 9 17 4 12"/></svg>
          <h2 style="margin:0 0 8px;font-size:24px">Authorization successful</h2>
          <p style="color:#666;margin:0">You can close this tab and return to the terminal.</p>
        </body></html>
      `);

      server.close();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('✓ token.json saved.\n');
        console.log('Restart your server — uploads are ready to go.\n');
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    server.listen(CALLBACK_PORT, () => {
      console.log(`Waiting for Google callback on port ${CALLBACK_PORT}…`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n✗ Port ${CALLBACK_PORT} is already in use. Stop whatever is running there and try again.\n`);
      }
      reject(err);
    });
  });
}

main().catch((err) => {
  console.error('\n✗ Authorization failed:', err.message, '\n');
  process.exit(1);
});

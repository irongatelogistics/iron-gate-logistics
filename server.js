const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Google Drive auth ─────────────────────────────────────────────────────────
const DRIVE_FOLDER_ID = '10-qLaJ_vgk0_yQUfhYrWmvjF81rk30S_';
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

let _auth = null;

function getAuth() {
  if (_auth) return _auth;

  // Railway / production: set these three env vars from your token.json values.
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    _auth = client;
    return _auth;
  }

  // Local dev: oauth_credentials.json + token.json (created by authorize.js).
  const credsPath = path.join(__dirname, 'oauth_credentials.json');
  const tokenPath = path.join(__dirname, 'token.json');

  if (!fs.existsSync(credsPath)) {
    throw new Error(
      'oauth_credentials.json not found.\n' +
      'Download it from GCP Console → APIs & Services → Credentials → your OAuth 2.0 Client ID.'
    );
  }
  if (!fs.existsSync(tokenPath)) {
    throw new Error('Not authorized yet. Run: node authorize.js');
  }

  const raw = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  const { client_id, client_secret } = raw.installed || raw.web;
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
  client.setCredentials(tokens);

  // Persist refreshed access tokens automatically.
  client.on('tokens', (refreshed) => {
    const current = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    fs.writeFileSync(tokenPath, JSON.stringify({ ...current, ...refreshed }, null, 2));
  });

  _auth = client;
  return _auth;
}

// ── Upload endpoint ───────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const DOC_LABELS = {
  rig_photo: 'Rig Photo',
  insurance: 'Proof of Insurance',
  cdl: 'CDL',
};

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { docType, driverName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ ok: false, error: 'No file received.' });

    const drive = google.drive({ version: 'v3', auth: getAuth() });
    const label = DOC_LABELS[docType] || docType;
    const ext = path.extname(file.originalname) || '';
    const name = `${(driverName || 'Applicant').trim()} — ${label}${ext}`;

    const response = await drive.files.create({
      requestBody: { name, parents: [DRIVE_FOLDER_ID] },
      media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
    });

    res.json({ ok: true, fileId: response.data.id, fileName: name });
  } catch (err) {
    console.error('[upload error]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Iron Gate Logistics running on port ${PORT}`);
});

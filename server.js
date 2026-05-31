const path = require('path');

// dotenv only applies locally — Railway injects env vars directly.
// Silent if .env doesn't exist (production / Railway).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUDINARY_VARS = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Validate at startup — fail loudly rather than silently at first upload.
const missingVars = Object.entries(CLOUDINARY_VARS)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingVars.length) {
  console.error('[cloudinary] ✗ Missing environment variables:', missingVars.join(', '));
  console.error('[cloudinary]   Set them in Railway → Variables, or in .env for local dev.');
} else {
  console.log('[cloudinary] ✓ Credentials loaded —',
    `cloud=${CLOUDINARY_VARS.cloud_name}`,
    `key=${CLOUDINARY_VARS.api_key.slice(0, 6)}…`
  );
}

cloudinary.config(CLOUDINARY_VARS);

// ── Constants ─────────────────────────────────────────────────────────────────
const FOLDER = 'iron-gate-customers';

const DOC_LABELS = {
  rig_photo: 'Rig Photo',
  insurance: 'Proof of Insurance',
  cdl:       'CDL',
};

const MAX_SIZES = {
  rig_photo: 10 * 1024 * 1024,
  insurance: 10 * 1024 * 1024,
  cdl:        5 * 1024 * 1024,
};

// ── Cloudinary helper ─────────────────────────────────────────────────────────
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ── Health check — confirms env vars are loaded without exposing values ───────
app.get('/api/health', (req, res) => {
  const status = Object.fromEntries(
    Object.entries(CLOUDINARY_VARS).map(([k, v]) => [k, v ? '✓ set' : '✗ missing'])
  );
  const ok = missingVars.length === 0;
  res.status(ok ? 200 : 500).json({ ok, cloudinary: status });
});

// ── Upload endpoint ───────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const { docType, driverName } = req.body || {};
  const file = req.file;

  console.log(`[upload] docType=${docType} driver="${driverName}" ` +
    (file ? `size=${file.size} mime=${file.mimetype}` : 'NO FILE'));

  // ── Input validation ────────────────────────────────────────────────────────
  if (!file) {
    return res.status(400).json({ ok: false, error: 'No file received.' });
  }

  const maxBytes = MAX_SIZES[docType] ?? MAX_SIZES.rig_photo;
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024);
    return res.status(400).json({ ok: false, error: `File too large — max ${mb} MB for this document.` });
  }

  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.mimetype)) {
    return res.status(400).json({ ok: false, error: 'Only JPG, PNG, or PDF files are accepted.' });
  }

  // ── Credential guard ────────────────────────────────────────────────────────
  if (missingVars.length) {
    console.error('[upload] Aborting — missing Cloudinary env vars:', missingVars.join(', '));
    return res.status(500).json({
      ok: false,
      error: `Server configuration error: missing Cloudinary credentials (${missingVars.join(', ')}). ` +
             `Add them in Railway → Variables.`,
    });
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  try {
    const label    = DOC_LABELS[docType] || docType;
    const safeName = (driverName || 'Applicant').replace(/[^a-z0-9_\-\s]/gi, '').trim();
    const publicId = `${FOLDER}/${safeName}/${docType}_${Date.now()}`;

    console.log(`[upload] Sending to Cloudinary — public_id: ${publicId}`);

    const result = await uploadToCloudinary(file.buffer, {
      public_id:     publicId,
      resource_type: 'auto',
      type:          'private',
      tags:          [docType, safeName],
    });

    console.log(`[upload] ✓ Success — public_id: ${result.public_id} bytes: ${result.bytes}`);

    res.json({
      ok:       true,
      publicId: result.public_id,
      fileName: `${safeName} — ${label}`,
    });

  } catch (err) {
    // Log everything Cloudinary sends back so Railway logs tell the full story.
    console.error('[upload] ✗ Cloudinary error:');
    console.error('  message  :', err.message);
    console.error('  http_code:', err.http_code);
    console.error('  name     :', err.name);
    if (err.error) console.error('  detail   :', JSON.stringify(err.error));

    // Surface the real error to the client (this is a private internal form,
    // not a public API, so exposing Cloudinary's message is appropriate).
    res.status(500).json({
      ok:    false,
      error: err.message || 'Upload failed — check Railway logs for details.',
    });
  }
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nIron Gate Logistics running on port ${PORT}`);
});

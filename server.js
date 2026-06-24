const path = require('path');

// dotenv only applies locally — Railway injects env vars directly.
// Silent if .env doesn't exist (production / Railway).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
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
      folder:        FOLDER,
      resource_type: 'auto',
      type:          'authenticated',
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

// ── Gmail / Nodemailer config ─────────────────────────────────────────────────
const NOTIFY_TO   = 'freightstorage@irongatelogi.com';
const GMAIL_USER  = process.env.GMAIL_USER;
const GMAIL_PASS  = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn('[email] ⚠  GMAIL_USER or GMAIL_APP_PASSWORD not set — /api/notify will be disabled.');
} else {
  console.log('[email] ✓ Gmail credentials loaded —', GMAIL_USER);
}

const mailer = (GMAIL_USER && GMAIL_PASS)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    })
  : null;

// ── Reservation notification endpoint ────────────────────────────────────────
app.use(express.json());

app.post('/api/notify', async (req, res) => {
  if (!mailer) {
    return res.status(503).json({
      ok: false,
      error: 'Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD in Railway → Variables.',
    });
  }

  const {
    driverName, usdot, phone, email,
    vehicleType, vehicleInfo, rigLength,
    startDate, schedule, hazmat,
    docRig, docInsurance, docCdl,
    referredBy,
  } = req.body || {};

  if (!driverName || !phone || !email || !startDate) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  const subject = `New Reservation Request — ${driverName}`;

  // ── Plain-text version ───────────────────────────────────────────────────
  const textBody = [
    '=== IRON GATE LOGISTICS — PARKING RESERVATION REQUEST ===',
    '',
    `DRIVER / COMPANY NAME : ${driverName}`,
    `USDOT & MC NUMBER     : ${usdot    || '—'}`,
    `PHONE                 : ${phone}`,
    `EMAIL                 : ${email}`,
    '',
    `VEHICLE TYPE          : ${vehicleType  || '—'}`,
    `YEAR / MAKE / MODEL   : ${vehicleInfo  || '—'}`,
    `LENGTH OF RIG         : ${rigLength    || '—'}`,
    '',
    `REQUESTED START DATE  : ${startDate}`,
    `TYPICAL SCHEDULE      : ${schedule     || '—'}`,
    `HAULS HAZMAT          : ${hazmat       || '—'}`,
    `REFERRED BY           : ${referredBy  || 'None'}`,
    '',
    'DOCUMENTS:',
    `  Rig Photo           : ${docRig       || '—'}`,
    `  Proof of Insurance  : ${docInsurance || '—'}`,
    `  CDL / Driver Lic.   : ${docCdl       || '—'}`,
    '',
    '—',
    'Sent automatically from the Iron Gate Logistics website.',
  ].join('\n');

  // ── HTML version ─────────────────────────────────────────────────────────
  const row = (label, value) =>
    `<tr>
       <td style="padding:10px 16px;font-family:monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;white-space:nowrap;border-bottom:1px solid #f3f4f6;">${label}</td>
       <td style="padding:10px 16px;font-size:15px;color:#111827;border-bottom:1px solid #f3f4f6;">${value || '—'}</td>
     </tr>`;

  const docBadge = (val) => {
    const uploaded = val && val.toLowerCase().includes('uploaded');
    return uploaded
      ? `<span style="display:inline-block;padding:2px 10px;background:#dcfce7;color:#166534;font-size:12px;border-radius:999px;font-family:monospace;">${val}</span>`
      : `<span style="display:inline-block;padding:2px 10px;background:#f3f4f6;color:#6b7280;font-size:12px;border-radius:999px;font-family:monospace;">${val || 'Not uploaded'}</span>`;
  };

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#1a2c4e;padding:28px 32px;">
            <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3a82d4;">Iron Gate Logistics</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#f4f1ec;letter-spacing:.01em;">New Reservation Request</h1>
          </td>
        </tr>

        <!-- Driver info -->
        <tr><td style="padding:24px 32px 4px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3a82d4;">Driver / Company</p>
          <p style="margin:6px 0 0;font-size:26px;font-weight:700;color:#1a2c4e;">${driverName}</p>
        </td></tr>

        <!-- Details table -->
        <tr><td style="padding:16px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            ${row('USDOT &amp; MC', usdot)}
            ${row('Phone', phone)}
            ${row('Email', `<a href="mailto:${email}" style="color:#2d6cb3;">${email}</a>`)}
            ${row('Vehicle Type', vehicleType)}
            ${row('Year / Make / Model / Plate', vehicleInfo)}
            ${row('Length of Rig', rigLength)}
            ${row('Start Date', `<strong>${startDate}</strong>`)}
            ${row('Typical Schedule', schedule)}
            ${row('Hauls HazMat', hazmat === 'Yes'
              ? '<strong style="color:#b91c1c;">Yes</strong>'
              : hazmat)}
            ${row('Referred By', referredBy && referredBy !== 'None'
              ? `<strong style="color:#166534;">${referredBy}</strong>`
              : '<span style="color:#9ca3af;">None</span>')}
          </table>
        </td></tr>

        <!-- Documents -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 10px;font-family:monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280;">Documents</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="padding:10px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Rig Photo</td>
              <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f3f4f6;">${docBadge(docRig)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Proof of Insurance</td>
              <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f3f4f6;">${docBadge(docInsurance)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:14px;color:#374151;">CDL / Driver's License</td>
              <td style="padding:10px 16px;text-align:right;">${docBadge(docCdl)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;font-family:monospace;letter-spacing:.06em;">
            Sent automatically from the Iron Gate Logistics website · ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PT
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await mailer.sendMail({
      from:    `"Iron Gate Logistics" <${GMAIL_USER}>`,
      to:      NOTIFY_TO,
      replyTo: email,
      subject,
      text:    textBody,
      html:    htmlBody,
    });

    console.log(`[email] ✓ Reservation notification sent for "${driverName}"`);
    res.json({ ok: true });

  } catch (err) {
    console.error('[email] ✗ Failed to send notification:');
    console.error('  message  :', err.message);
    console.error('  code     :', err.code);
    res.status(500).json({ ok: false, error: err.message || 'Failed to send email notification.' });
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

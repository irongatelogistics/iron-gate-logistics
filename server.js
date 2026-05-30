const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = 'iron-gate-customers';

const DOC_LABELS = {
  rig_photo: 'Rig Photo',
  insurance: 'Proof of Insurance',
  cdl:       'CDL',
};

// Max sizes per doc type (bytes)
const MAX_SIZES = {
  rig_photo: 10 * 1024 * 1024,
  insurance: 10 * 1024 * 1024,
  cdl:        5 * 1024 * 1024,
};

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ── Upload endpoint ───────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // hard ceiling at 10 MB
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { docType, driverName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file received.' });
    }

    // Per-type size check (CDL capped at 5 MB)
    const maxBytes = MAX_SIZES[docType] ?? MAX_SIZES.rig_photo;
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / 1024 / 1024);
      return res.status(400).json({ ok: false, error: `File too large — max ${mb} MB for this document.` });
    }

    // Validate MIME type
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ ok: false, error: 'Only JPG, PNG, or PDF files are accepted.' });
    }

    const label = DOC_LABELS[docType] || docType;
    const safeName = (driverName || 'Applicant').replace(/[^a-z0-9_\-\s]/gi, '').trim();
    const publicId = `${FOLDER}/${safeName}/${docType}_${Date.now()}`;

    const result = await uploadToCloudinary(file.buffer, {
      public_id:     publicId,
      resource_type: 'auto',         // handles both images and PDFs
      type:          'private',      // not publicly accessible via URL
      tags:          [docType, safeName],
    });

    res.json({
      ok:       true,
      publicId: result.public_id,
      fileName: `${safeName} — ${label}`,
    });
  } catch (err) {
    console.error('[upload error]', err.message);
    res.status(500).json({ ok: false, error: 'Upload failed. Please try again.' });
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

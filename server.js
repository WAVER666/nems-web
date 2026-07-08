// server.js
// Simple Node/Express server to handle CV uploads and send via SMTP (nodemailer)

const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve the static site (so you can run node server.js in project root)
app.use(express.static(path.join(__dirname)));

// Multer in-memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const ALLOWED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = (String(process.env.SMTP_SECURE || '').toLowerCase() === 'true') || (port === 465);

  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP configuration missing. Set SMTP_HOST, SMTP_PORT (optional), SMTP_USER and SMTP_PASS.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.post('/api/careers/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    // Validate MIME type (allow fallback by extension for some older browsers)
    const mimetype = req.file.mimetype || '';
    const originalName = req.file.originalname || 'cv';
    if (ALLOWED.indexOf(mimetype) === -1) {
      const lower = originalName.toLowerCase();
      if (!(lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx'))) {
        return res.status(400).send('Invalid file type');
      }
    }

    const transporter = getTransporter();
    if (!transporter) return res.status(500).send('SMTP not configured on server');

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const to = process.env.RECIPIENT_EMAIL || 'info@nemukula.co.za';

    const mailOptions = {
      from,
      to,
      subject: `New CV upload${req.body.name ? ' from ' + req.body.name : ''}`,
      text: `A candidate has uploaded a CV.\n\nName: ${req.body.name || 'N/A'}\nEmail: ${req.body.email || 'N/A'}\n\nThis message contains the CV as an attachment.`,
      attachments: [
        {
          filename: originalName,
          content: req.file.buffer,
        }
      ],
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log('CV email sent:', info && info.messageId);

    // Respond quickly to the client
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error in /api/careers/upload:', err);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

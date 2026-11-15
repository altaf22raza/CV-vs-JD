import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/apiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Security headers for API responses
app.use('/api', (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Unified API handler (auth/session + protected AI endpoints)
app.all('/api/*', async (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
    (Array.isArray(realIp) ? realIp[0] : realIp) ||
    req.ip ||
    req.socket?.remoteAddress ||
    '';

  const result = await handleApiRequest({
    method: req.method,
    url: req.originalUrl || req.url,
    body: req.body,
    authorization: req.headers.authorization,
    clientIp,
  });

  if (result.headers) {
    for (const [headerName, headerVal] of Object.entries(result.headers)) {
      res.setHeader(headerName, headerVal);
    }
  }
  res.status(result.status).json(result.body);
});

// Serve static build assets if available
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ResumeIQ Server listening on port ${PORT}`);
});

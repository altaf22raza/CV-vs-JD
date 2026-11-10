import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { analyzeJdAndResume, optimizeResumeWithJd, rewriteSingleSection } from './src/server/geminiBackend.ts';
import { generateEmailOtp, verifyEmailOtp } from './src/server/otpService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Auth OTP Routes (Email-only)
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    const { code, expiresAt } = generateEmailOtp(email);
    return res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      expiresAt,
      debugOtp: code, // Provided for instant testing
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }
    const result = verifyEmailOtp(email, otp);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Deterministic UID derived from email
    const uid = 'usr_' + Buffer.from(cleanEmail).toString('base64url').slice(0, 24);
    const displayName = cleanEmail.split('@')[0];

    return res.json({
      success: true,
      user: {
        uid,
        email: cleanEmail,
        displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        emailVerified: true,
      }
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
  }
});

// API Routes
app.post('/api/analyze-jd', async (req, res) => {
  try {
    const { jdText, resumeData, companyName, targetRole } = req.body;
    const result = await analyzeJdAndResume(jdText, resumeData, companyName, targetRole);
    res.json(result);
  } catch (err: any) {
    console.error('Analyze JD error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze JD' });
  }
});

app.post('/api/optimize-resume', async (req, res) => {
  try {
    const { resumeData, jdText, options } = req.body;
    const result = await optimizeResumeWithJd(resumeData, jdText, options);
    res.json(result);
  } catch (err: any) {
    console.error('Optimize resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to optimize resume' });
  }
});

app.post('/api/rewrite-section', async (req, res) => {
  try {
    const { sectionName, currentText, instruction, jdText } = req.body;
    const result = await rewriteSingleSection(sectionName, currentText, instruction, jdText);
    res.json(result);
  } catch (err: any) {
    console.error('Rewrite section error:', err);
    res.status(500).json({ error: err.message || 'Failed to rewrite section' });
  }
});

// Serve static build assets if available
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ResumeIQ Server listening on port ${PORT}`);
});

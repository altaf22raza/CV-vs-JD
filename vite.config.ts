import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { analyzeJdAndResume, optimizeResumeWithJd, rewriteSingleSection } from './src/server/geminiBackend.ts';
import { generateEmailOtp, verifyEmailOtp } from './src/server/otpService.ts';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'resumeiq-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Parse JSON body helper
        const getBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        const sendJson = (statusCode: number, data: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          const url = req.url.split('?')[0];

          if (req.method === 'POST' && url === '/api/auth/send-otp') {
            const body = await getBody();
            if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
              return sendJson(400, { error: 'Please enter a valid email address' });
            }
            const { code, expiresAt } = generateEmailOtp(body.email);
            return sendJson(200, {
              success: true,
              message: `Verification code sent to ${body.email}`,
              expiresAt,
              debugOtp: code,
            });
          }

          if (req.method === 'POST' && url === '/api/auth/verify-otp') {
            const body = await getBody();
            if (!body.email || !body.otp) {
              return sendJson(400, { error: 'Email and verification code are required' });
            }
            const result = verifyEmailOtp(body.email, body.otp);
            if (!result.valid) {
              return sendJson(400, { error: result.error });
            }
            const cleanEmail = body.email.toLowerCase().trim();
            const uid = 'usr_' + Buffer.from(cleanEmail).toString('base64url').slice(0, 24);
            const displayName = cleanEmail.split('@')[0];
            return sendJson(200, {
              success: true,
              user: {
                uid,
                email: cleanEmail,
                displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                emailVerified: true,
              }
            });
          }

          if (req.method === 'POST' && url === '/api/analyze-jd') {
            const body = await getBody();
            const result = await analyzeJdAndResume(
              body.jdText,
              body.resumeData,
              body.companyName,
              body.targetRole
            );
            return sendJson(200, result);
          }

          if (req.method === 'POST' && url === '/api/optimize-resume') {
            const body = await getBody();
            const result = await optimizeResumeWithJd(
              body.resumeData,
              body.jdText,
              body.options || {}
            );
            return sendJson(200, result);
          }

          if (req.method === 'POST' && url === '/api/rewrite-section') {
            const body = await getBody();
            const result = await rewriteSingleSection(
              body.sectionName,
              body.currentText,
              body.instruction,
              body.jdText
            );
            return sendJson(200, result);
          }

          // Unhandled api route
          return sendJson(404, { error: `Endpoint not found: ${url}` });
        } catch (error: any) {
          console.error('API Middleware error:', error);
          return sendJson(500, {
            error: error?.message || 'Internal server error processing AI request',
          });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

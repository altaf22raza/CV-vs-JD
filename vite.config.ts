import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/apiRouter.ts';

dotenv.config();

const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024; // 2 MB limit

function apiPlugin(): Plugin {
  return {
    name: 'resumeiq-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const sendJson = (
          statusCode: number,
          data: unknown,
          extraHeaders?: Record<string, string>
        ) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'no-store');
          if (extraHeaders) {
            for (const [headerName, headerVal] of Object.entries(extraHeaders)) {
              res.setHeader(headerName, headerVal);
            }
          }
          res.end(JSON.stringify(data));
        };

        const getBody = (): Promise<unknown> => {
          return new Promise((resolve, reject) => {
            let totalBytes = 0;
            const chunks: Buffer[] = [];
            let aborted = false;

            req.on('data', (chunk: Buffer | string) => {
              if (aborted) return;
              const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
              totalBytes += buf.length;
              if (totalBytes > MAX_JSON_BODY_BYTES) {
                aborted = true;
                reject(Object.assign(new Error('Request payload exceeds 2 MB limit'), { statusCode: 413 }));
                return;
              }
              chunks.push(buf);
            });

            req.on('end', () => {
              if (aborted) return;
              try {
                const raw = Buffer.concat(chunks).toString('utf8');
                resolve(raw ? JSON.parse(raw) : {});
              } catch {
                reject(Object.assign(new Error('Invalid JSON request body'), { statusCode: 400 }));
              }
            });

            req.on('error', reject);
          });
        };

        try {
          const method = (req.method || 'GET').toUpperCase();
          const body = method === 'GET' || method === 'HEAD' ? {} : await getBody();
          const forwarded = req.headers['x-forwarded-for'];
          const realIp = req.headers['x-real-ip'];
          const clientIp =
            (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
            (Array.isArray(realIp) ? realIp[0] : realIp) ||
            req.socket?.remoteAddress ||
            '';

          const result = await handleApiRequest({
            method,
            url: req.url,
            body,
            authorization: req.headers.authorization,
            clientIp,
          });
          return sendJson(result.status, result.body, result.headers);
        } catch (error: any) {
          const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
          return sendJson(status, {
            error: error?.message || 'Internal server error processing API request',
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

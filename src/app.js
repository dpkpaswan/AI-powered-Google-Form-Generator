import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from './utils/logger.js';
import generateFormRoute from './routes/generateFormRoute.js';
import authRoute from './routes/authRoute.js';
import formsRoute from './routes/formsRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  // Dev only: Vite runs on a different origin, so allow cross-origin cookies.
  // Production on Render is single-origin (backend serves the built frontend), so CORS is unnecessary.
  if (env.NODE_ENV !== 'production') {
    app.use(
      cors({
        origin: env.FRONTEND_APP_URL,
        credentials: true
      })
    );
  }

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get('/health', (req, res) => res.json({ ok: true }));

  // Support both direct routes (/) and proxied routes (/api).
  // Local dev historically used a Vite proxy at /api; keeping this avoids 404s in hosted envs.
  app.use(authRoute);
  app.use(generateFormRoute);
  app.use(formsRoute);
  app.use('/api', authRoute);
  app.use('/api', generateFormRoute);
  app.use('/api', formsRoute);

  // Serve the built React app from the same server when present.
  // This is the expected production setup on Render (single service).
  const buildDir = path.resolve(process.cwd(), 'FRONTEND', 'build');
  const indexHtml = path.join(buildDir, 'index.html');

  if (fs.existsSync(indexHtml)) {
    app.use(express.static(buildDir));
    app.get('*', (req, res) => res.sendFile(indexHtml));
  } else {
    logger.warn({ buildDir }, 'Frontend build not found; serving API only');
  }

  app.use(errorHandler);

  return app;
}

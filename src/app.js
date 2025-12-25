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

  app.use(
    cors({
      origin: env.FRONTEND_APP_URL,
      credentials: true
    })
  );

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use(authRoute);
  app.use(generateFormRoute);
  app.use(formsRoute);

  // Production: serve the built React app from the same server.
  if (env.NODE_ENV === 'production') {
    const buildDir = path.resolve(process.cwd(), 'FRONTEND', 'build');
    const indexHtml = path.join(buildDir, 'index.html');

    if (fs.existsSync(indexHtml)) {
      app.use(express.static(buildDir));
      app.get('*', (req, res) => res.sendFile(indexHtml));
    }
  }

  app.use(errorHandler);

  return app;
}

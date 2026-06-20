import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initDb } from './db';
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';
import { aboutRoutes } from './routes/about';
import { logRoutes } from './routes/logs';
import { reportRoutes } from './routes/report';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start(): Promise<void> {
  // Initialize database (create tables, enable WAL)
  initDb();

  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  // Register CORS — allow all origins in development
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register rate limiting — 100 requests per minute globally
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(syncRoutes);
  await app.register(aboutRoutes);
  await app.register(logRoutes);
  await app.register(reportRoutes);

  // Global error handler — unified response format
  app.setErrorHandler((error: unknown, _request, reply) => {
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode || 500;
    let code: number;
    if (statusCode === 401) {
      code = 1; // 认证失败
    } else if (statusCode === 400) {
      code = 2; // 参数校验失败
    } else {
      code = 3; // 服务器内部错误
    }
    app.log.error({ err: error, statusCode }, 'Request failed');
    reply.status(statusCode).send({
      code,
      data: null,
      message: err.message || '服务器内部错误',
    });
  });

  // Health check
  app.get('/api/health', async () => {
    return { code: 0, data: { status: 'ok' }, message: 'ok' };
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

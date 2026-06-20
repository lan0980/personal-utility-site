import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getUserByUsername, createUser, createLoginLog } from '../db';
import { signToken } from '../middleware/auth';

/* ===== Schema definitions ===== */

const authBodySchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 30 },
      password: { type: 'string', minLength: 6, maxLength: 100 },
    },
  },
};

/* ===== Helper: extract client IP from request ===== */

/** Extract the real client IP, respecting reverse proxy headers. */
function getClientIp(request: FastifyRequest): string | null {
  const forwarded = request.headers['x-forwarded-for'] as string | undefined;
  const realIp = request.headers['x-real-ip'] as string | undefined;
  return (
    forwarded?.split(',')[0]?.trim() ||
    realIp ||
    request.ip ||
    null
  );
}

/* ===== Routes ===== */

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/auth/register
   * Register a new user with username and password.
   */
  app.post('/api/auth/register', { schema: authBodySchema }, async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    // Check if username already exists
    const existing = getUserByUsername(username);
    if (existing) {
      return reply.status(409).send({ code: 2, data: null, message: '用户名已存在' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    // Create user
    const userId = randomUUID();
    const createdAt = new Date().toISOString();
    createUser({
      id: userId,
      username,
      password: hashedPassword,
      created_at: createdAt,
    });

    // Record register log (non-blocking)
    try {
      createLoginLog({
        id: randomUUID(),
        user_id: userId,
        username,
        ip: getClientIp(request),
        user_agent: request.headers['user-agent'] || null,
        action: 'register',
        success: 1,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Log recording failure should not block the main flow
    }

    // Generate JWT
    const token = signToken(userId);

    return { code: 0, data: { token, user: { id: userId, username } }, message: 'ok' };
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token.
   */
  app.post('/api/auth/login', { schema: authBodySchema }, async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    // Find user
    const user = getUserByUsername(username);
    if (!user) {
      // Record login failure log (non-blocking)
      try {
        createLoginLog({
          id: randomUUID(),
          user_id: null,
          username,
          ip: getClientIp(request),
          user_agent: request.headers['user-agent'] || null,
          action: 'login_failed',
          success: 0,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Log recording failure should not block the main flow
      }
      return reply.status(401).send({ code: 1, data: null, message: '用户名或密码错误' });
    }

    // Verify password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      // Record login failure log (non-blocking)
      try {
        createLoginLog({
          id: randomUUID(),
          user_id: user.id,
          username,
          ip: getClientIp(request),
          user_agent: request.headers['user-agent'] || null,
          action: 'login_failed',
          success: 0,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Log recording failure should not block the main flow
      }
      return reply.status(401).send({ code: 1, data: null, message: '用户名或密码错误' });
    }

    // Record login success log (non-blocking)
    try {
      createLoginLog({
        id: randomUUID(),
        user_id: user.id,
        username: user.username,
        ip: getClientIp(request),
        user_agent: request.headers['user-agent'] || null,
        action: 'login',
        success: 1,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Log recording failure should not block the main flow
    }

    // Generate JWT
    const token = signToken(user.id);

    return { code: 0, data: { token, user: { id: user.id, username: user.username } }, message: 'ok' };
  });
}

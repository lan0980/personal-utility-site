import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/* ===== Fastify type augmentation ===== */

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/* ===== JWT utilities ===== */

/** Sign a JWT for a given user ID. */
export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/* ===== Auth middleware ===== */

/**
 * Fastify preHandler that verifies the Bearer JWT token.
 * On success, injects `userId` into the request.
 * On failure, sends a 401 with the appropriate error code.
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ code: 1, data: null, message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    request.userId = payload.userId;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'TokenExpiredError') {
      reply.status(401).send({ code: 4, data: null, message: '令牌已过期' });
    } else {
      reply.status(401).send({ code: 1, data: null, message: '令牌无效' });
    }
    return;
  }
}

/**
 * Optional auth — same as authMiddleware but doesn't fail if no token is present.
 * If a valid token exists, injects `userId`. Otherwise continues as anonymous.
 */
export async function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return; // No token — continue as anonymous
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    request.userId = payload.userId;
  } catch {
    // Invalid token — continue as anonymous
  }
}

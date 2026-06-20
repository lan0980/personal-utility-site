import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { getAbout, setAbout, createOperationLog } from '../db';
import { authMiddleware } from '../middleware/auth';

/* ===== Routes ===== */

export async function aboutRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/about
   * Fetch the about content for the authenticated user.
   */
  app.get('/api/about', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const about = getAbout(userId);

    if (!about) {
      return { code: 0, data: null, message: 'ok' };
    }

    return {
      code: 0,
      data: { content: about.content, updated_at: about.updated_at },
      message: 'ok',
    };
  });

  /**
   * PUT /api/about
   * Upsert the about content for the authenticated user.
   * Body: { content: string, updated_at: string }
   */
  app.put('/api/about', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.userId!;
    const body = request.body as { content?: string; updated_at?: string };

    if (!body.content) {
      return reply.status(400).send({ code: 2, data: null, message: '内容不能为空' });
    }

    const updatedAt = body.updated_at || new Date().toISOString();
    setAbout(userId, body.content, updatedAt);

    // Record operation log (non-blocking)
    try {
      createOperationLog({
        id: randomUUID(),
        user_id: userId,
        action: 'about_update',
        ip: request.ip || null,
        detail: JSON.stringify({ content_length: body.content.length }),
        created_at: new Date().toISOString(),
      });
    } catch {
      // Log recording failure should not block the main flow
    }

    return {
      code: 0,
      data: { content: body.content, updated_at: updatedAt },
      message: 'ok',
    };
  });
}

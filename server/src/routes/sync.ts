import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { getSyncData, upsertTodos, upsertLinks, upsertTags, upsertAbout, createOperationLog } from '../db';
import { authMiddleware } from '../middleware/auth';

/* ===== Routes ===== */

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/sync?since=ISO8601
   * Fetch sync data — full sync if `since` is omitted, incremental if provided.
   */
  app.get('/api/sync', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const query = request.query as { since?: string };
    const since = query.since || null;

    const data = getSyncData(userId, since);

    return { code: 0, data, message: 'ok' };
  });

  /**
   * POST /api/sync
   * Batch upsert entities with Last-Write-Wins conflict resolution.
   * Body: { todos?: [], links?: [], tags?: [], about?: { content, updated_at } }
   */
  app.post('/api/sync', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const body = request.body as {
      todos?: Record<string, unknown>[];
      links?: Record<string, unknown>[];
      tags?: Record<string, unknown>[];
      about?: { content: string; updated_at: string };
    };

    let conflicts = 0;

    if (body.todos && Array.isArray(body.todos)) {
      conflicts += upsertTodos(userId, body.todos);
    }
    if (body.links && Array.isArray(body.links)) {
      conflicts += upsertLinks(userId, body.links);
    }
    if (body.tags && Array.isArray(body.tags)) {
      conflicts += upsertTags(userId, body.tags);
    }
    if (body.about && body.about.content !== undefined) {
      upsertAbout(userId, body.about.content, body.about.updated_at || new Date().toISOString());
    }

    // Record operation log (non-blocking)
    try {
      const pushedCount =
        (body.todos?.length || 0) +
        (body.links?.length || 0) +
        (body.tags?.length || 0) +
        (body.about ? 1 : 0);
      createOperationLog({
        id: randomUUID(),
        user_id: userId,
        action: 'sync_push',
        ip: request.ip || null,
        detail: JSON.stringify({ pushed: pushedCount, conflicts }),
        created_at: new Date().toISOString(),
      });
    } catch {
      // Log recording failure should not block the main flow
    }

    const serverTime = new Date().toISOString();

    return {
      code: 0,
      data: { server_time: serverTime, conflicts },
      message: 'ok',
    };
  });
}

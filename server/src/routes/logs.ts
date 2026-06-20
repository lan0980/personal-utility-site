import type { FastifyInstance } from 'fastify';
import {
  getLoginLogs,
  getLoginLogsCount,
  getOperationLogs,
  getOperationLogsCount,
} from '../db';
import { authMiddleware } from '../middleware/auth';

/* ===== Routes ===== */

export async function logRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/logs/login?page=1&limit=20
   * Fetch paginated login logs for the authenticated user.
   */
  app.get('/api/logs/login', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const query = request.query as { page?: string; limit?: string };

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const items = getLoginLogs(userId, limit, offset);
    const total = getLoginLogsCount(userId);

    // Convert snake_case DB rows to API response format
    const formattedItems = items.map((row) => {
      const ua = row.user_agent || '';
      const isMobile = /Mobile|Android|iPhone/i.test(ua);
      return {
        id: row.id,
        user_id: row.user_id,
        username: row.username,
        ip: row.ip,
        user_agent: row.user_agent,
        action: row.action,
        success: row.success === 1,
        created_at: row.created_at,
        device: ua ? (isMobile ? '📱 手机' : '💻 电脑') : null,
      };
    });

    return {
      code: 0,
      data: { items: formattedItems, total, page, limit },
      message: 'ok',
    };
  });

  /**
   * GET /api/logs/operation?page=1&limit=20
   * Fetch paginated operation logs for the authenticated user.
   */
  app.get('/api/logs/operation', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const query = request.query as { page?: string; limit?: string };

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const items = getOperationLogs(userId, limit, offset);
    const total = getOperationLogsCount(userId);

    // Convert snake_case DB rows to API response format
    const formattedItems = items.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      action: row.action,
      ip: row.ip,
      detail: row.detail,
      created_at: row.created_at,
    }));

    return {
      code: 0,
      data: { items: formattedItems, total, page, limit },
      message: 'ok',
    };
  });
}

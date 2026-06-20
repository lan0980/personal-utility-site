import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { createReport, getReportsByUserId } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

/* ===== Constants ===== */

const VALID_CATEGORIES = ['违法信息', '用户投诉', '安全漏洞', '其他'];

/* ===== Routes ===== */

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/report
   * Submit a report. Authentication is optional — anonymous reports are allowed.
   * If the user is logged in, their user_id is recorded automatically.
   * Body: { reporter_name?, contact?, category, content, url? }
   */
  app.post(
    '/api/report',
    { preHandler: [optionalAuthMiddleware] },
    async (request, reply) => {
      const body = request.body as {
        reporter_name?: string;
        contact?: string;
        category?: string;
        content?: string;
        url?: string;
      };

      // Validate required fields
      if (!body.category || !body.content) {
        return reply
          .status(400)
          .send({ code: 2, data: null, message: '举报类别和内容不能为空' });
      }

      if (!VALID_CATEGORIES.includes(body.category)) {
        return reply
          .status(400)
          .send({ code: 2, data: null, message: '无效的举报类别' });
      }

      // userId is set by optionalAuthMiddleware if a valid token was provided
      const userId = request.userId || null;

      const reportId = randomUUID();
      const createdAt = new Date().toISOString();

      createReport({
        id: reportId,
        user_id: userId,
        reporter_name: body.reporter_name || null,
        contact: body.contact || null,
        category: body.category,
        content: body.content,
        url: body.url || null,
        status: 'pending',
        created_at: createdAt,
      });

      return {
        code: 0,
        data: { id: reportId, status: 'pending', created_at: createdAt },
        message: '举报已提交，我们会尽快处理',
      };
    },
  );

  /**
   * GET /api/report
   * Fetch all reports submitted by the authenticated user.
   */
  app.get('/api/report', { preHandler: [authMiddleware] }, async (request) => {
    const userId = request.userId!;
    const reports = getReportsByUserId(userId);

    const formattedReports = reports.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      reporter_name: row.reporter_name,
      contact: row.contact,
      category: row.category,
      content: row.content,
      url: row.url,
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      resolution: row.resolution,
    }));

    return {
      code: 0,
      data: { items: formattedReports },
      message: 'ok',
    };
  });
}

import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

const ALLOWED_CATEGORIES = [
  'incorrect_legal',
  'not_accessible',
  'private_property',
  'score_too_high',
  'score_too_low',
  'other',
] as const;

type ReportCategory = (typeof ALLOWED_CATEGORIES)[number];

const MAX_COMMENT_LENGTH = 1000;

/**
 * Defense-in-depth sanitizer for free-text user input.
 * Strips HTML/script tags and escapes the remaining HTML-significant
 * characters so stored content is safe to render on any client without
 * relying on downstream escaping. Also trims and enforces a max length.
 */
const sanitizeComment = (input: string): string => {
  // Remove anything that looks like an HTML/script/style tag or block.
  const withoutTags = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '');

  // Escape residual HTML-significant characters.
  const escaped = withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return escaped.trim().slice(0, MAX_COMMENT_LENGTH);
};

interface CreateReportBody {
  spot_id: string;
  category: ReportCategory;
  comment?: string;
}

const createReportBodySchema = {
  type: 'object',
  required: ['spot_id', 'category'],
  properties: {
    spot_id: { type: 'string', format: 'uuid' },
    category: {
      type: 'string',
      enum: [...ALLOWED_CATEGORIES],
    },
    comment: { type: 'string', maxLength: MAX_COMMENT_LENGTH },
  },
  additionalProperties: false,
} as const;

const reportResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    spot_id: { type: 'string' },
    category: { type: 'string' },
    comment: { type: ['string', 'null'] },
    created_at: { type: 'string' },
  },
} as const;

export const reportsRoutes = (pool: Pool) => {
  return async (app: FastifyInstance): Promise<void> => {
    app.post<{ Body: CreateReportBody }>('/reports', {
      schema: {
        body: createReportBodySchema,
        response: {
          201: reportResponseSchema,
        },
      },
    }, async (request, reply) => {
      const { spot_id, category, comment } = request.body;

      // Defense-in-depth: strip HTML and escape control characters on the
      // server before persisting, so stored comments cannot contain script
      // or markup payloads regardless of client behavior.
      const safeComment =
        typeof comment === 'string' && comment.length > 0
          ? sanitizeComment(comment)
          : null;

      // Verify the spot exists
      const spotCheck = await pool.query(
        'SELECT id FROM spots WHERE id = $1',
        [spot_id],
      );
      if (spotCheck.rows.length === 0) {
        return reply.code(404).send({ error: 'Spot not found' });
      }

      const result = await pool.query(
        `INSERT INTO spot_reports (spot_id, category, comment)
         VALUES ($1, $2, $3)
         RETURNING id, spot_id, category, comment, created_at`,
        [spot_id, category, safeComment],
      );

      const report = result.rows[0] as {
        id: string;
        spot_id: string;
        category: string;
        comment: string | null;
        created_at: string;
      };

      return reply.code(201).send(report);
    });
  };
};

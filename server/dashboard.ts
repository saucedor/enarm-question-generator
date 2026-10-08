import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import type { DashboardData } from '../shared/dashboard.js';

export function dashboardRoutes(app: FastifyInstance, db: pg.Pool) {
  app.get('/api/dashboard', async (): Promise<DashboardData> => {
    // One statement gives totals, charts and recent work the same database snapshot.
    const { rows } = await db.query(`
      WITH sets AS (
        SELECT id, title, input->>'specialty' AS specialty, review_status,
          created_at, updated_at,
          (SELECT COALESCE(sum(jsonb_array_length(c->'questions')),0)::int
           FROM jsonb_array_elements(cases) c) AS questions
        FROM enarm.question_sets
      ), days AS (
        SELECT ((now() AT TIME ZONE 'UTC')::date - n)::date AS day
        FROM generate_series(6,0,-1) n
      )
      SELECT jsonb_build_object(
        'totals', (SELECT jsonb_build_object(
          'sets', count(*), 'questions', COALESCE(sum(questions),0),
          'reviewed', count(*) FILTER (WHERE review_status='reviewed'),
          'pending', count(*) FILTER (WHERE review_status<>'reviewed'),
          'practices', (SELECT count(*) FROM enarm.practice_attempts WHERE completed_at IS NOT NULL),
          'activeRuns', (SELECT count(*) FROM enarm.runs WHERE status IN ('queued','processing','retrying')),
          'failedRuns', (SELECT count(*) FROM enarm.runs WHERE status='failed')
        ) FROM sets),
        'activity', (SELECT jsonb_agg(jsonb_build_object('date',day::text,'sets',
          (SELECT count(*) FROM sets WHERE (created_at AT TIME ZONE 'UTC')::date=day)) ORDER BY day) FROM days),
        'specialties', COALESCE((SELECT jsonb_agg(s ORDER BY s.questions DESC,s.name) FROM
          (SELECT specialty AS name, sum(questions)::int AS questions FROM sets GROUP BY specialty) s),'[]'::jsonb),
        'recent', COALESCE((SELECT jsonb_agg(s ORDER BY s."updatedAt" DESC,s.id) FROM
          (SELECT id,title,specialty,questions,review_status='reviewed' AS reviewed,updated_at AS "updatedAt"
           FROM sets ORDER BY updated_at DESC,id LIMIT 4) s),'[]'::jsonb),
        'nextReview', (SELECT jsonb_build_object('id',id,'title',title) FROM sets
          WHERE review_status<>'reviewed' ORDER BY updated_at DESC,id LIMIT 1)
      ) AS dashboard
    `);
    return rows[0].dashboard;
  });
}

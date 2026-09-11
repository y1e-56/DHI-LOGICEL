import pool from '../config/database.js';

const CHECKLIST_COLUMNS = 'id, release_ref, template_key, label, weight, is_checked, sort_order, created_by, created_at, updated_at';

export async function listChecklistByRelease(releaseRef, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ${CHECKLIST_COLUMNS} FROM go_live_checklist
     WHERE release_ref = $1 ORDER BY sort_order ASC, template_key ASC`,
    [releaseRef]
  );
  return result.rows;
}

export async function upsertChecklistItem(releaseRef, templateKey, label, weight, isChecked, userId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO go_live_checklist (release_ref, template_key, label, weight, is_checked, sort_order, created_by)
     VALUES ($1, $2, $3, $4, $5, 0, $6)
     ON CONFLICT (release_ref, template_key)
     DO UPDATE SET label = EXCLUDED.label, weight = EXCLUDED.weight, is_checked = EXCLUDED.is_checked, updated_at = NOW()
     RETURNING ${CHECKLIST_COLUMNS}`,
    [releaseRef, templateKey, label, weight, isChecked, userId]
  );
  return result.rows[0];
}

export async function findChecklistItem(releaseRef, templateKey, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ${CHECKLIST_COLUMNS} FROM go_live_checklist WHERE release_ref = $1 AND template_key = $2 LIMIT 1`,
    [releaseRef, templateKey]
  );
  return result.rows[0] || null;
}

export async function updateChecklistChecked(id, isChecked, client = null) {
  const c = client || pool;
  const result = await c.query(
    `UPDATE go_live_checklist SET is_checked = $1, updated_at = NOW() WHERE id = $2 RETURNING ${CHECKLIST_COLUMNS}`,
    [isChecked, id]
  );
  return result.rows[0] || null;
}

export async function checklistCompletion(releaseRef, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT COALESCE(SUM(weight) FILTER (WHERE is_checked), 0)::int AS done,
            COALESCE(SUM(weight), 0)::int AS total
     FROM go_live_checklist WHERE release_ref = $1`,
    [releaseRef]
  );
  const { done, total } = result.rows[0];
  return total ? Math.round((done / total) * 100) : 0;
}

export async function listDecisions(releaseRef = null, client = null) {
  const c = client || pool;
  const select =
    `SELECT id, release_ref, verdict, decider, justification, checklist_completion,
            TO_CHAR(decided_at, 'YYYY-MM-DD') AS decided_at, created_by, created_at
       FROM go_live_decisions`;
  const result = releaseRef
    ? await c.query(`${select} WHERE release_ref = $1 ORDER BY decided_at DESC, id DESC`, [releaseRef])
    : await c.query(`${select} ORDER BY decided_at DESC, id DESC`);
  return result.rows;
}

export async function createDecision(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO go_live_decisions (release_ref, verdict, decider, justification, checklist_completion, decided_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, release_ref, verdict, decider, justification, checklist_completion,
               TO_CHAR(decided_at, 'YYYY-MM-DD') AS decided_at, created_by, created_at`,
    [
      data.release_ref,
      data.verdict,
      data.decider,
      data.justification || null,
      data.checklist_completion ?? 0,
      data.decided_at || new Date().toISOString().slice(0, 10),
      data.created_by || null,
    ]
  );
  return result.rows[0];
}
import pg from 'pg';
const { Pool } = pg;
const p = new Pool({ connectionString: 'postgresql://postgres:Admin@localhost:5432/dhi_test_tracking' });

const r = await p.query('SELECT version FROM schema_migrations ORDER BY version');
console.log('Migrations:', r.rows.map(x => x.version).join(', '));

const tables = await p.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('requirements', 'watch_points', 'test_scenarios')`);
console.log('Tables:', tables.rows.map(x => x.tablename).join(', ') || 'aucune');

const enums = await p.query(`SELECT typname FROM pg_type WHERE typname IN ('test_case_type', 'requirement_category', 'requirement_status', 'watch_point_status')`);
console.log('Enums:', enums.rows.map(x => x.typname).join(', ') || 'aucun');

const tcCols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'test_cases' AND column_name IN ('type', 'criticality', 'evaluation_method', 'tolerance', 'version', 'scenario_id')`);
console.log('test_cases cols:', tcCols.rows.map(x => x.column_name).join(', ') || 'aucune');

await p.end();

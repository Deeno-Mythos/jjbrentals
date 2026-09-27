import { json } from '@sveltejs/kit';
import { getTurso } from '$lib/server/turso';

export async function GET() {
	const checkedAt = new Date().toISOString();
	const startedAt = Date.now();
	let databaseStatus = 'unavailable';
	let databaseLatencyMs = null;

	try {
		// A read-only ping keeps this endpoint safe for frequent external polling.
		await getTurso().execute('SELECT 1');
		databaseStatus = 'ok';
		databaseLatencyMs = Date.now() - startedAt;
	} catch {
		// Intentionally omit driver errors and connection details from the public response.
	}

	const healthy = databaseStatus === 'ok';
	return json(
		{
			service: 'jjb-rentals',
			status: healthy ? 'ok' : 'degraded',
			checkedAt,
			checks: {
				api: { status: 'ok' },
				database: { status: databaseStatus, latencyMs: databaseLatencyMs }
			}
		},
		{
			status: healthy ? 200 : 503,
			headers: { 'cache-control': 'no-store' }
		}
	);
}

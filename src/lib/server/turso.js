import { createClient } from '@tursodatabase/serverless/compat';
import { env } from '$env/dynamic/private';

/** @type {import('@tursodatabase/serverless/compat').Client | undefined} */
let client;
/** @type {Promise<void> | undefined} */
let schemaReady;

/** @returns {import('@tursodatabase/serverless/compat').Client} */
export function getTurso() {
	// Accept both the project's existing TURSODB_* names and conventional Turso names.
	const url = env.TURSO_DATABASE_URL || env.TURSODB_URL;
	const authToken = env.TURSO_AUTH_TOKEN || env.TURSODB_API_TOKEN;
	if (!url || !authToken) {
		throw new Error('Turso is not configured. Set TURSODB_URL and TURSODB_API_TOKEN.');
	}

	client ??= createClient({ url, authToken });
	return client;
}

export async function ensureBookingSchema() {
	if (!schemaReady) {
		schemaReady = (async () => {
			const db = getTurso();
			await db.execute(`CREATE TABLE IF NOT EXISTS bookings (
				id TEXT PRIMARY KEY,
				room_id TEXT NOT NULL CHECK (room_id IN ('fan', 'aircon', 'aircon-bunk')),
				guest_name TEXT NOT NULL,
				guest_phone TEXT NOT NULL,
				guest_email TEXT NOT NULL DEFAULT '',
				guests INTEGER NOT NULL DEFAULT 1,
				check_in TEXT NOT NULL,
				check_out TEXT NOT NULL,
				nights INTEGER NOT NULL,
				nightly_rate INTEGER NOT NULL,
				total_amount INTEGER NOT NULL,
				notes TEXT NOT NULL DEFAULT '',
				status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CHECK (check_out > check_in)
			)`);
			await db.execute('CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings (check_in, check_out)');
			await db.execute(`CREATE TRIGGER IF NOT EXISTS bookings_no_confirmed_overlap_update
				BEFORE UPDATE OF status, room_id, check_in, check_out ON bookings
				WHEN NEW.status = 'confirmed' AND EXISTS (
					SELECT 1 FROM bookings AS existing
					WHERE existing.id != NEW.id
					AND existing.room_id = NEW.room_id
					AND existing.status = 'confirmed'
					AND existing.check_in < NEW.check_out
					AND existing.check_out > NEW.check_in
				)
				BEGIN
					SELECT RAISE(ABORT, 'Room dates overlap a confirmed booking');
				END`);
		})();
	}

	try {
		await schemaReady;
	} catch (error) {
		schemaReady = undefined;
		throw error;
	}
}

/** @param {any} row */
export function rowToObject(row) {
	return typeof row.toJSON === 'function' ? row.toJSON() : { ...row };
}

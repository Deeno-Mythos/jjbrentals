import { json } from '@sveltejs/kit';
import { isAdminSession, sameOriginRequest, ADMIN_COOKIE } from '$lib/server/admin-auth';
import { ensureBookingSchema, getTurso, rowToObject } from '$lib/server/turso';

const statuses = new Set(['pending', 'confirmed', 'cancelled']);

export async function GET({ cookies, url }) {
	if (!isAdminSession(cookies.get(ADMIN_COOKIE))) return json({ error: 'Please sign in again.' }, { status: 401 });
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to <= from) {
		return json({ error: 'Choose a valid calendar range.' }, { status: 400 });
	}

	try {
		await ensureBookingSchema();
		const result = await getTurso().execute({
			sql: `SELECT id, room_id, guest_name, guest_phone, guest_email, guests, check_in, check_out, nights, nightly_rate, total_amount, notes, status, created_at
				FROM bookings WHERE check_in < ? AND check_out > ?
				ORDER BY check_in ASC, created_at DESC LIMIT 300`,
			args: [to, from]
		});
		return json({ bookings: result.rows.map(rowToObject) });
	} catch (error) {
		console.error('Admin calendar could not load bookings. Check the server-side database configuration.');
		return json({ error: 'The booking calendar could not load. Check the database configuration.' }, { status: 503 });
	}
}

export async function PATCH({ cookies, request }) {
	if (!isAdminSession(cookies.get(ADMIN_COOKIE))) return json({ error: 'Please sign in again.' }, { status: 401 });
	if (!sameOriginRequest(request)) return json({ error: 'Request not allowed.' }, { status: 403 });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid booking update.' }, { status: 400 });
	}
	if (typeof body?.id !== 'string' || body.id.length > 48 || !statuses.has(body?.status)) {
		return json({ error: 'Invalid booking update.' }, { status: 400 });
	}

	try {
		await ensureBookingSchema();
		const result = await getTurso().execute({
			sql: `UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			args: [body.status, body.id]
		});
		if (result.rowsAffected !== 1) return json({ error: 'That booking could not be found.' }, { status: 404 });
		return json({ ok: true });
	} catch (error) {
		if (String(error).includes('Room dates overlap a confirmed booking')) {
			return json({ error: 'This room already has a confirmed booking during those dates.' }, { status: 409 });
		}
		console.error('Booking status could not be updated. Check the server-side database configuration.');
		return json({ error: 'The booking could not be updated.' }, { status: 503 });
	}
}

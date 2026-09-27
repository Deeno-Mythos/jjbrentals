import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { ensureBookingSchema, getTurso } from '$lib/server/turso';

/** @type {Record<string, {name: string, rate: number}>} */
const rooms = {
	fan: { name: 'Fan room', rate: 750 },
	aircon: { name: 'Aircon double room', rate: 850 },
	'aircon-bunk': { name: 'Aircon bunk room', rate: 850 }
};

/** @param {unknown} value */
function validDate(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST({ request }) {
	/** @type {Record<string, any>} */
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Please check the booking details and try again.' }, { status: 400 });
	}

	const room = typeof body?.roomId === 'string' && Object.hasOwn(rooms, body.roomId) ? rooms[body.roomId] : undefined;
	const checkIn = body?.checkIn;
	const checkOut = body?.checkOut;
	const guestName = typeof body?.guestName === 'string' ? body.guestName.trim() : '';
	const guestPhone = typeof body?.guestPhone === 'string' ? body.guestPhone.trim() : '';
	const guestEmail = typeof body?.guestEmail === 'string' ? body.guestEmail.trim() : '';
	const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
	const guests = Number(body?.guests);

	if (!room || !validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn || !guestName || guestName.length > 120 || !guestPhone || guestPhone.length > 40 || guestEmail.length > 254 || notes.length > 1200 || !Number.isInteger(guests) || guests < 1 || guests > 8) {
		return json({ error: 'Please check the booking details and try again.' }, { status: 400 });
	}

	const nights = (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000;
	if (Date.parse(`${checkIn}T00:00:00Z`) < Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) {
		return json({ error: 'Check-in must be today or a future date.' }, { status: 400 });
	}
	if (nights < 1 || nights > 90) return json({ error: 'Please choose a stay of 1 to 90 nights.' }, { status: 400 });

	try {
		await ensureBookingSchema();
		const db = getTurso();
		const overlap = await db.execute({
			sql: `SELECT 1 FROM bookings WHERE room_id = ? AND status = 'confirmed' AND check_in < ? AND check_out > ? LIMIT 1`,
			args: [body.roomId, checkOut, checkIn]
		});
		if (overlap.rows.length) return json({ error: 'That room is already booked for some of those dates. Please choose different dates.' }, { status: 409 });

		const id = `JJB-${randomUUID().slice(0, 8).toUpperCase()}`;
		await db.execute({
			sql: `INSERT INTO bookings
				(id, room_id, guest_name, guest_phone, guest_email, guests, check_in, check_out, nights, nightly_rate, total_amount, notes)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [id, body.roomId, guestName, guestPhone, guestEmail, guests, checkIn, checkOut, nights, room.rate, nights * room.rate, notes]
		});
		return json({ id, status: 'pending', roomName: room.name, nights, totalAmount: nights * room.rate }, { status: 201 });
	} catch (error) {
		console.error('Booking request could not be saved. Check the server-side database configuration.');
		return json({ error: 'We could not save your request right now. Please contact us by phone.' }, { status: 503 });
	}
}

import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { adminCookieOptions, adminPasswordConfigured, createAdminSession, sameOriginRequest, verifyAdminPassword, ADMIN_COOKIE } from '$lib/server/admin-auth';

export async function POST({ request, cookies }) {
	if (!sameOriginRequest(request)) return json({ error: 'Request not allowed.' }, { status: 403 });
	if (!adminPasswordConfigured()) return json({ error: 'Admin login is not configured yet.' }, { status: 503 });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Enter your admin password.' }, { status: 400 });
	}

	if (!verifyAdminPassword(body?.password)) return json({ error: 'That password did not match.' }, { status: 401 });
	cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions(dev));
	return json({ ok: true });
}

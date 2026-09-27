import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { adminCookieOptions, sameOriginRequest, ADMIN_COOKIE } from '$lib/server/admin-auth';

export async function POST({ request, cookies }) {
	if (!sameOriginRequest(request)) return json({ error: 'Request not allowed.' }, { status: 403 });
	cookies.delete(ADMIN_COOKIE, adminCookieOptions(dev));
	return json({ ok: true });
}

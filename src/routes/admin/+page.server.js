import { isAdminSession, ADMIN_COOKIE } from '$lib/server/admin-auth';

export function load({ cookies }) {
	return { authenticated: isAdminSession(cookies.get(ADMIN_COOKIE)) };
}

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export const ADMIN_COOKIE = 'jjb_admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

/** @param {string} payload */
function sessionSignature(payload) {
	return createHmac('sha256', env.ADMIN_PASSWORD ?? '').update(`jjb-admin:${payload}`).digest('base64url');
}

export function adminPasswordConfigured() {
	return Boolean(env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length >= 13);
}

/** @param {unknown} candidate */
export function verifyAdminPassword(candidate) {
	if (!adminPasswordConfigured() || typeof candidate !== 'string' || candidate.length > 512) return false;
	const expected = createHash('sha256').update(env.ADMIN_PASSWORD ?? '').digest();
	const supplied = createHash('sha256').update(candidate).digest();
	return timingSafeEqual(expected, supplied);
}

export function createAdminSession() {
	const payload = String(Math.floor(Date.now() / 1000));
	return `${payload}.${sessionSignature(payload)}`;
}

/** @param {string | undefined} value */
export function isAdminSession(value) {
	if (!value || !adminPasswordConfigured()) return false;
	const [payload, signature, extra] = value.split('.');
	if (extra !== undefined || !/^\d+$/.test(payload ?? '') || !signature) return false;
	const issuedAt = Number(payload);
	const now = Math.floor(Date.now() / 1000);
	if (issuedAt > now || now - issuedAt > SESSION_TTL_SECONDS) return false;
	const expected = Buffer.from(sessionSignature(payload));
	const supplied = Buffer.from(signature);
	return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

/** @param {boolean} dev @returns {{httpOnly: boolean, secure: boolean, sameSite: 'strict', path: string, maxAge: number}} */
export function adminCookieOptions(dev) {
	return {
		httpOnly: true,
		secure: !dev,
		sameSite: 'strict',
		path: '/',
		maxAge: SESSION_TTL_SECONDS
	};
}

/** @param {Request} request */
export function sameOriginRequest(request) {
	const origin = request.headers.get('origin');
	return Boolean(origin && origin === new URL(request.url).origin);
}

import { env } from '$env/dynamic/private';

export function load() {
	return { cloudName: env.CLOUD_NAME ?? '' };
}

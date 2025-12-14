import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DAEMON_URL = 'http://127.0.0.1:3001';

export const GET: RequestHandler = async ({ fetch }) => {
    const res = await fetch(`${DAEMON_URL}/health`);
    return json(await res.json());
};

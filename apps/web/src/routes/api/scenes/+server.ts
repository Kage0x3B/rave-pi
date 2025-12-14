import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DAEMON_URL = 'http://127.0.0.1:3001';

export const GET: RequestHandler = async ({ fetch }) => {
    const res = await fetch(`${DAEMON_URL}/scenes`);
    return json(await res.json());
};

export const POST: RequestHandler = async ({ fetch, request }) => {
    const body = await request.json();
    const res = await fetch(`${DAEMON_URL}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return json(await res.json());
};

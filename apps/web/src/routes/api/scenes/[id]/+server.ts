import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DAEMON_URL = 'http://127.0.0.1:3001';

export const DELETE: RequestHandler = async ({ fetch, params }) => {
    const res = await fetch(`${DAEMON_URL}/scenes/${params.id}`, {
        method: 'DELETE'
    });
    return json(await res.json());
};

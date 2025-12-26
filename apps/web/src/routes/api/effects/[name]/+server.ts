import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DAEMON_URL = 'http://127.0.0.1:3001';

export const PUT: RequestHandler = async ({ params, request, fetch }) => {
	const { name } = params;
	const body = await request.json();

	const res = await fetch(`${DAEMON_URL}/effects/${name}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	return json(await res.json(), { status: res.status });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCompletion, generateCompletionStream } from '$lib/server/gemini';
import generateEffectPrompt from '$lib/server/prompts/generate-effect.md?raw';
import fixProblemsPrompt from '$lib/server/prompts/fix-problems.md?raw';

interface ChatRequest {
	type: 'generate-effect' | 'fix-problems';
	sourceCode: string;
	userMessage?: string;
	errorMessage?: string;
	chatContext?: string;
	stream?: boolean;
}

interface ChatResponse {
	code: string;
	changeSummary: string;
}

function parseResponse(response: string): { code: string; changeSummary: string } {
	// Extract CHANGESUMMARY from comment at end
	const summaryMatch = response.match(/\/\/\s*CHANGESUMMARY:\s*(.+)$/m);
	const changeSummary = summaryMatch ? summaryMatch[1].trim() : 'Changes applied';

	// Remove the CHANGESUMMARY line from the code
	const code = response.replace(/\/\/\s*CHANGESUMMARY:.+$/m, '').trim();

	return { code, changeSummary };
}

function buildPrompt(body: ChatRequest): string {
	if (body.type === 'generate-effect') {
		return generateEffectPrompt
			.replace('{{SOURCE_CODE}}', body.sourceCode)
			.replace('{{USER_MESSAGE}}', body.userMessage ?? '');
	} else {
		return fixProblemsPrompt
			.replace('{{SOURCE_CODE}}', body.sourceCode)
			.replace('{{ERROR_MESSAGE}}', body.errorMessage ?? '')
			.replace('{{CHAT_CONTEXT}}', body.chatContext ?? 'No previous context.');
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ChatRequest = await request.json();
		const prompt = buildPrompt(body);

		// Streaming response
		if (body.stream) {
			const encoder = new TextEncoder();

			const stream = new ReadableStream({
				async start(controller) {
					try {
						for await (const chunk of generateCompletionStream(prompt)) {
							// Send chunk as SSE data event
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
						}
						// Send done event
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
						controller.close();
					} catch (err) {
						const errorMsg = err instanceof Error ? err.message : 'Stream error';
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
						controller.close();
					}
				}
			});

			return new Response(stream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive'
				}
			});
		}

		// Non-streaming response
		const response = await generateCompletion(prompt);
		const { code, changeSummary } = parseResponse(response);

		return json({ code, changeSummary } satisfies ChatResponse);
	} catch (err) {
		console.error('[Chat API] Error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to generate response' },
			{ status: 500 }
		);
	}
};

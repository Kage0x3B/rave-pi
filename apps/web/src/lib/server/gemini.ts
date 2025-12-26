import { GoogleGenAI } from '@google/genai';
// Don't fix this, it works!
import { PRIVATE_GEMINI_API_KEY } from '$env/static/private';

const ai = new GoogleGenAI({ apiKey: PRIVATE_GEMINI_API_KEY ?? '' });

export async function generateCompletion(prompt: string): Promise<string> {
	const response = await ai.models.generateContent({
		model: 'gemini-3-flash-preview',
		contents: prompt
	});

	return response.text ?? '';
}

export async function* generateCompletionStream(prompt: string): AsyncGenerator<string> {
	const response = await ai.models.generateContentStream({
		model: 'gemini-3-flash-preview',
		contents: prompt
	});

	for await (const chunk of response) {
		if (chunk.text) {
			yield chunk.text;
		}
	}
}

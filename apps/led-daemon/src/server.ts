import Fastify from 'fastify';
import type {
    SetPowerRequest,
    SetBrightnessRequest,
    SetEffectRequest,
    SaveSceneRequest,
    SaveEffectRequest,
    ApiResponse,
    HealthResponse,
    StateResponse,
    EffectsResponse,
    ScenesResponse,
    EffectParams,
    EffectWithSource
} from '@ravepi/shared-types';
import { SERVER_CONFIG } from './config.js';
import type { StateManager } from './state.js';
import type { EffectManager } from './effect-manager.js';
import type { RenderLoop } from './render-loop.js';
import type { LedController } from './led-controller.js';

interface ServerDeps {
    state: StateManager;
    effects: EffectManager;
    renderLoop: RenderLoop;
    controller: LedController;
}

export async function createServer(deps: ServerDeps) {
    const { state, effects, renderLoop, controller } = deps;

    const fastify = Fastify({
        disableRequestLogging: true,
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    ignore: 'pid,hostname,time',
                    messageFormat: '{req.method} {req.url} {res.statusCode}',
                    singleLine: true
                }
            }
        }
    });

    // Log only on response completion
    fastify.addHook('onResponse', (request, reply, done) => {
        fastify.log.info({ req: request, res: reply }, '');
        done();
    });

    // CORS for local development
    await fastify.register(import('@fastify/cors'), {
        origin: true
    });

    // Health check
    fastify.get<{ Reply: HealthResponse }>('/health', async () => {
        return {
            ok: true,
            uptime: process.uptime(),
            ledCount: controller.ledCount,
            fps: renderLoop.getFps()
        };
    });

    // Get current state
    fastify.get<{ Reply: StateResponse }>('/state', async () => {
        return state.state;
    });

    // Get available effects with source code
    fastify.get<{ Reply: EffectsResponse }>('/effects', async () => {
        return {
            effects: effects.getEffectsWithSource()
        };
    });

    // Reload effects (hot-reload custom effects)
    fastify.post<{ Reply: EffectsResponse }>('/effects/reload', async () => {
        await effects.reload();
        return {
            effects: effects.getEffectsWithSource()
        };
    });

    // Save effect source code
    fastify.put<{ Params: { name: string }; Body: SaveEffectRequest; Reply: ApiResponse<EffectWithSource> }>(
        '/effects/:name',
        async (request) => {
            const { name } = request.params;
            const { source } = request.body;

            try {
                const savedEffect = await effects.saveEffect(name, source);
                return { ok: true, data: savedEffect };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save effect';
                return { ok: false, error: message };
            }
        }
    );

    // Get scenes
    fastify.get<{ Reply: ScenesResponse }>('/scenes', async () => {
        return {
            scenes: state.scenes
        };
    });

    // Set power
    fastify.post<{ Body: SetPowerRequest; Reply: ApiResponse }>('/power', async (request) => {
        const { on } = request.body;
        state.setPower(on);
        renderLoop.setPower(on);
        return { ok: true };
    });

    // Set brightness
    fastify.post<{ Body: SetBrightnessRequest; Reply: ApiResponse }>('/brightness', async (request) => {
        const { value } = request.body;
        state.setBrightness(value);
        controller.brightness = value;
        return { ok: true };
    });

    // Set effect
    fastify.post<{ Body: SetEffectRequest; Reply: ApiResponse }>('/effect', async (request) => {
        const { name, params } = request.body;

        // Sanitize params to only include those defined in the effect
        const sanitizedParams = effects.sanitizeParams(name, params ?? {});

        if (!effects.setEffect(name, sanitizedParams)) {
            return { ok: false, error: `Unknown effect: ${name}` };
        }

        state.setEffect(name, sanitizedParams);
        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect, sanitizedParams);
        }

        return { ok: true };
    });

    // Update effect params
    fastify.patch<{ Body: { params: EffectParams }; Reply: ApiResponse }>('/effect/params', async (request) => {
        const { params } = request.body;

        // Sanitize params to only include those defined in the current effect
        const currentEffect = state.state.effect;
        const sanitizedParams = effects.sanitizeParams(currentEffect, params);

        effects.setParams(sanitizedParams);
        state.setEffectParams(sanitizedParams);
        return { ok: true };
    });

    // Save scene
    fastify.post<{ Body: SaveSceneRequest; Reply: ApiResponse }>('/scenes', async (request) => {
        const { name } = request.body;

        // Sanitize current params before saving scene
        const currentState = state.state;
        const sanitizedParams = effects.sanitizeParams(currentState.effect, currentState.effectParams);
        state.saveScene(name, sanitizedParams);

        return { ok: true };
    });

    // Apply scene
    fastify.post<{ Body: { id: string }; Reply: ApiResponse }>('/scenes/apply', async (request) => {
        const { id } = request.body;

        if (!state.applyScene(id)) {
            return { ok: false, error: 'Scene not found' };
        }

        // Apply state to effects and controller
        const currentState = state.state;
        controller.brightness = currentState.brightness;

        // Sanitize params in case effect schema changed since scene was saved
        const sanitizedParams = effects.sanitizeParams(currentState.effect, currentState.effectParams);
        effects.setEffect(currentState.effect, sanitizedParams);

        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect, sanitizedParams);
        }

        return { ok: true };
    });

    // Delete scene
    fastify.delete<{ Params: { id: string }; Reply: ApiResponse }>('/scenes/:id', async (request) => {
        const { id } = request.params;

        if (!state.deleteScene(id)) {
            return { ok: false, error: 'Scene not found' };
        }

        return { ok: true };
    });

    return fastify;
}

export async function startServer(deps: ServerDeps): Promise<string> {
    const fastify = await createServer(deps);

    try {
        await fastify.listen({
            port: SERVER_CONFIG.port,
            host: SERVER_CONFIG.host
        });

        const address = `http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`;
        console.log(`[Server] Listening on ${address}`);
        return address;
    } catch (err) {
        fastify.log.error(err);
        throw err;
    }
}

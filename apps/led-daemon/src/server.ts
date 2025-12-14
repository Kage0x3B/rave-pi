import Fastify from 'fastify';
import type {
    SetPowerRequest,
    SetBrightnessRequest,
    SetColorRequest,
    SetEffectRequest,
    SaveSceneRequest,
    ApiResponse,
    HealthResponse,
    StateResponse,
    EffectsResponse,
    ScenesResponse,
    EffectParams,
} from '@ravepi/shared-types';
import { SERVER_CONFIG } from './config.js';
import type { StateManager } from './state.js';
import type { EffectManager } from './effects/index.js';
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
                    singleLine: true,
                },
            },
        },
    });

    // Log only on response completion
    fastify.addHook('onResponse', (request, reply, done) => {
        fastify.log.info({ req: request, res: reply }, '');
        done();
    });

    // CORS for local development
    await fastify.register(import('@fastify/cors'), {
        origin: true,
    });

    // Health check
    fastify.get<{ Reply: HealthResponse }>('/health', async () => {
        return {
            ok: true,
            uptime: process.uptime(),
            ledCount: controller.ledCount,
            fps: renderLoop.getFps(),
        };
    });

    // Get current state
    fastify.get<{ Reply: StateResponse }>('/state', async () => {
        return state.state;
    });

    // Get available effects
    fastify.get<{ Reply: EffectsResponse }>('/effects', async () => {
        return {
            effects: effects.getEffects(),
        };
    });

    // Get scenes
    fastify.get<{ Reply: ScenesResponse }>('/scenes', async () => {
        return {
            scenes: state.scenes,
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

    // Set color
    fastify.post<{ Body: SetColorRequest; Reply: ApiResponse }>('/color', async (request) => {
        const { r, g, b } = request.body;
        state.setColor({ r, g, b });
        effects.setColor({ r, g, b });
        return { ok: true };
    });

    // Set effect
    fastify.post<{ Body: SetEffectRequest; Reply: ApiResponse }>('/effect', async (request) => {
        const { name, params } = request.body;

        if (!effects.setEffect(name, params)) {
            return { ok: false, error: `Unknown effect: ${name}` };
        }

        state.setEffect(name, params);
        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect);
        }

        return { ok: true };
    });

    // Update effect params
    fastify.patch<{ Body: { params: EffectParams }; Reply: ApiResponse }>('/effect/params', async (request) => {
        const { params } = request.body;
        effects.setParams(params);
        state.setEffectParams(params);
        return { ok: true };
    });

    // Save scene
    fastify.post<{ Body: SaveSceneRequest; Reply: ApiResponse }>('/scenes', async (request) => {
        const { name } = request.body;
        state.saveScene(name);
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
        effects.setColor(currentState.color);
        effects.setEffect(currentState.effect, currentState.effectParams);

        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect);
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
            host: SERVER_CONFIG.host,
        });

        const address = `http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`;
        console.log(`[Server] Listening on ${address}`);
        return address;
    } catch (err) {
        fastify.log.error(err);
        throw err;
    }
}

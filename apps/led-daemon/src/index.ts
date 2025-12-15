import { LedController } from './led-controller.js';
import { StateManager } from './state.js';
import { RenderLoop } from './render-loop.js';
import { EffectManager } from './effects/index.js';
import { startServer } from './server.js';

async function main() {
    console.log('='.repeat(50));
    console.log('  RavePi LED Daemon');
    console.log('='.repeat(50));

    // Initialize components
    console.log('\n[Init] Starting components...');

    const controller = await LedController.init();
    console.log(`[Init] LED Controller: ${controller.ledCount} LEDs, mock=${controller.isMock}`);

    const state = new StateManager();
    await state.load();
    console.log('[Init] State Manager: loaded');

    const effects = new EffectManager(controller.ledCount);
    console.log(`[Init] Effect Manager: ${effects.getEffects().length} effects available`);

    const renderLoop = new RenderLoop(controller);
    console.log('[Init] Render Loop: ready');

    // Apply saved state
    const savedState = state.state;
    controller.brightness = savedState.brightness;
    effects.setColor(savedState.color);

    // Set initial effect
    if (effects.setEffect(savedState.effect, savedState.effectParams)) {
        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect);
        }
    } else {
        // Fallback to solid if saved effect not found
        effects.setEffect('solid');
        const effect = effects.getCurrent();
        if (effect) {
            renderLoop.setEffect(effect);
        }
    }

    // Apply power state
    renderLoop.setPower(savedState.power);

    // Start render loop
    renderLoop.start();

    // Start HTTP server
    const address = await startServer({
        state,
        effects,
        renderLoop,
        controller,
    });

    console.log('\n[Init] Startup complete!');
    console.log(`[Init] API: ${address}`);
    console.log(`[Init] Power: ${savedState.power ? 'ON' : 'OFF'}`);
    console.log(`[Init] Effect: ${savedState.effect}`);
    console.log(`[Init] Brightness: ${savedState.brightness}`);

    // Graceful shutdown
    const shutdown = () => {
        console.log('\n[Shutdown] Stopping...');
        renderLoop.stop();
        controller.shutdown();
        console.log('[Shutdown] Complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});

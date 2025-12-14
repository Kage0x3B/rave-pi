import { ANIMATION_CONFIG } from './config.js';
import type { LedController } from './led-controller.js';
import type { Effect } from './effects/types.js';

/**
 * Render loop for LED animations.
 * Maintains stable FPS independent of effect complexity.
 */
export class RenderLoop {
    private controller: LedController;
    private effect: Effect | null = null;
    private running = false;
    private frameCount = 0;
    private lastFpsTime = 0;
    private currentFps = 0;
    private intervalId: NodeJS.Timeout | null = null;
    private isPoweredOn = true;

    constructor(controller: LedController) {
        this.controller = controller;
    }

    /** Start the render loop */
    start(): void {
        if (this.running) return;

        this.running = true;
        this.lastFpsTime = Date.now();
        this.frameCount = 0;

        // Use setInterval for consistent timing
        this.intervalId = setInterval(() => {
            this.tick();
        }, ANIMATION_CONFIG.frameInterval);

        console.log(`[RenderLoop] Started at ${ANIMATION_CONFIG.targetFps} FPS`);
    }

    /** Stop the render loop */
    stop(): void {
        if (!this.running) return;

        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.controller.clear();
        console.log('[RenderLoop] Stopped');
    }

    /** Set the current effect */
    setEffect(effect: Effect): void {
        // Dispose old effect
        if (this.effect) {
            this.effect.dispose();
        }

        this.effect = effect;
        this.effect.init(this.controller.ledCount);
        console.log(`[RenderLoop] Effect set: ${effect.info.name}`);
    }

    /** Set power state */
    setPower(on: boolean): void {
        this.isPoweredOn = on;
        if (!on) {
            this.controller.clear();
        }
    }

    /** Get current FPS */
    getFps(): number {
        return this.currentFps;
    }

    /** Single frame tick */
    private tick(): void {
        const now = Date.now();

        // Update FPS counter
        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        // Skip rendering if powered off
        if (!this.isPoweredOn) {
            return;
        }

        // Render current effect
        if (this.effect) {
            const pixels = this.effect.tick(this.frameCount, ANIMATION_CONFIG.frameInterval);
            this.controller.setAll(pixels);
            this.controller.render();
        }
    }
}

import type { Effect, EffectParams } from '@ravepi/shared-types';

/** Default LED thickness for horizontal edges (top/bottom) */
const DEFAULT_LED_THICKNESS_H = 5;
/** Default LED thickness for vertical edges (left/right) */
const DEFAULT_LED_THICKNESS_V = 4;
/** Target frame rate in FPS */
const TARGET_FPS = 15;
/** Minimum time between frames in ms */
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export interface CanvasRendererOptions {
    drawBackground?: boolean;
    ledThicknessH?: number;
    ledThicknessV?: number;
}

/**
 * Runs an effect and shares the pixel output with multiple canvas renderers.
 * Ticks the effect once per frame, ensuring consistent output across all canvases.
 */
export class EffectRunner {
    private effect: Effect | null = null;
    private animationId: number | null = null;
    private frame = 0;
    private lastTime = 0;
    private ledCount: number;
    private canvases: CanvasRenderer[] = [];
    private pixels: Uint32Array;

    constructor(ledCount: number) {
        this.ledCount = ledCount;
        this.pixels = new Uint32Array(ledCount);
    }

    /** Register a canvas renderer to receive pixel updates */
    addCanvas(renderer: CanvasRenderer): void {
        this.canvases.push(renderer);
    }

    /** Remove a canvas renderer */
    removeCanvas(renderer: CanvasRenderer): void {
        const index = this.canvases.indexOf(renderer);
        if (index !== -1) {
            this.canvases.splice(index, 1);
        }
    }

    setEffect(effect: Effect, params?: EffectParams): void {
        this.stop();
        this.effect = effect;
        this.effect.init(this.ledCount, params);
        this.frame = 0;
        this.lastTime = performance.now();
        this.start();
    }

    private start(): void {
        const render = (time: number) => {
            this.animationId = requestAnimationFrame(render);

            // Throttle to target FPS
            const deltaTime = time - this.lastTime;
            if (deltaTime < FRAME_INTERVAL) return;

            this.lastTime = time - (deltaTime % FRAME_INTERVAL);
            this.frame++;

            if (this.effect) {
                // Tick effect ONCE
                this.pixels = this.effect.tick(this.frame, deltaTime);

                // Draw to ALL registered canvases with the same pixels
                for (const canvas of this.canvases) {
                    canvas.draw(this.pixels);
                }
            }
        };
        this.animationId = requestAnimationFrame(render);
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.effect?.dispose();
        this.effect = null;
    }

    updateParams(params: EffectParams): void {
        this.effect?.setParams(params);
    }
}

/**
 * Canvas renderer for LED effect previews.
 * Draws LEDs around the border of the canvas, simulating LEDs
 * mounted around a table edge under milky glass.
 *
 * This renderer only handles drawing - the effect is ticked by EffectRunner.
 */
export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private drawBackground: boolean;
    private ledThicknessH: number;
    private ledThicknessV: number;

    constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.drawBackground = options.drawBackground ?? true;
        this.ledThicknessH = options.ledThicknessH ?? DEFAULT_LED_THICKNESS_H;
        this.ledThicknessV = options.ledThicknessV ?? DEFAULT_LED_THICKNESS_V;
    }

    /**
     * Draw LEDs around the border of the canvas.
     * LEDs are distributed evenly around the perimeter:
     * - Top edge: left to right
     * - Right edge: top to bottom
     * - Bottom edge: right to left
     * - Left edge: bottom to top
     */
    draw(pixels: Uint32Array): void {
        const { width, height } = this.canvas;
        const ledCount = pixels.length;

        // Clear canvas
        if (this.drawBackground) {
            // Draw table surface background
            this.ctx.fillStyle = '#393534';
            this.ctx.fillRect(0, 0, width, height);
        } else {
            // Transparent background
            this.ctx.clearRect(0, 0, width, height);
        }

        // Calculate perimeter and edge lengths
        const perimeter = 2 * width + 2 * height;
        const ledSpacing = perimeter / ledCount;

        // Calculate how many LEDs fit on each edge
        const topLeds = Math.round(width / ledSpacing);
        const rightLeds = Math.round(height / ledSpacing);
        const bottomLeds = Math.round(width / ledSpacing);
        const leftLeds = ledCount - topLeds - rightLeds - bottomLeds;

        let ledIndex = 0;

        // Top edge: left to right
        for (let i = 0; i < topLeds && ledIndex < ledCount; i++) {
            const x = (i / topLeds) * width;
            const ledWidth = width / topLeds;
            this.drawLed(pixels[ledIndex], x, 0, ledWidth, this.ledThicknessH);
            ledIndex++;
        }

        // Right edge: top to bottom
        for (let i = 0; i < rightLeds && ledIndex < ledCount; i++) {
            const y = (i / rightLeds) * height;
            const ledHeight = height / rightLeds;
            this.drawLed(pixels[ledIndex], width - this.ledThicknessV, y, this.ledThicknessV, ledHeight);
            ledIndex++;
        }

        // Bottom edge: right to left
        for (let i = 0; i < bottomLeds && ledIndex < ledCount; i++) {
            const x = width - ((i + 1) / bottomLeds) * width;
            const ledWidth = width / bottomLeds;
            this.drawLed(pixels[ledIndex], x, height - this.ledThicknessH, ledWidth, this.ledThicknessH);
            ledIndex++;
        }

        // Left edge: bottom to top
        for (let i = 0; i < leftLeds && ledIndex < ledCount; i++) {
            const y = height - ((i + 1) / leftLeds) * height;
            const ledHeight = height / leftLeds;
            this.drawLed(pixels[ledIndex], 0, y, this.ledThicknessV, ledHeight);
            ledIndex++;
        }
    }

    /**
     * Draw a single LED pixel with brightness-based transparency.
     * Darker colors are more transparent, simulating LEDs that emit light.
     */
    private drawLed(color: number, x: number, y: number, w: number, h: number): void {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        // Calculate brightness as alpha (0-1)
        // Use max channel for vibrant colors, or luminance for balanced
        const brightness = Math.max(r, g, b) / 255;

        // Skip nearly-off LEDs
        if (brightness < 0.01) return;

        this.ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
        this.ctx.fillRect(x, y, Math.ceil(w), Math.ceil(h));
    }
}

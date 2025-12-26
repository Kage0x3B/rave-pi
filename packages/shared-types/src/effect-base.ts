import type { EffectInfo, EffectParams, RgbTuple } from './effects.js';

/**
 * Effect interface - all effects must implement this.
 * This is the core interface for LED effects that can run on both
 * the actual LED controller and browser canvas renderers.
 */
export interface Effect {
    /** Effect metadata for UI */
    readonly info: EffectInfo;

    /** Initialize effect with LED count and parameters */
    init(ledCount: number, params?: EffectParams): void;

    /** Update parameters while running */
    setParams(params: EffectParams): void;

    /** Generate next frame - returns pixel buffer */
    tick(frame: number, deltaTime: number): Uint32Array;

    /** Cleanup when effect is switched */
    dispose(): void;
}

/**
 * Base class for effects with common functionality.
 * Extend this class to create custom effects.
 */
export abstract class BaseEffect implements Effect {
    abstract readonly info: EffectInfo;

    protected ledCount = 0;
    protected params: EffectParams = {};
    protected pixels: Uint32Array = new Uint32Array(0);

    init(ledCount: number, params?: EffectParams): void {
        this.ledCount = ledCount;
        this.pixels = new Uint32Array(ledCount);
        // Always start with defaults from schema
        this.params = {};
        for (const param of this.info.params) {
            this.params[param.name] = param.default;
        }
        // Then overlay any provided params
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    this.params[key] = value;
                }
            }
        }
    }

    setParams(params: EffectParams): void {
        this.params = { ...this.params, ...params };
    }

    abstract tick(frame: number, deltaTime: number): Uint32Array;

    dispose(): void {
        // Override if cleanup needed
    }

    /** Helper: Convert RGB to 32-bit integer */
    protected rgbToInt(r: number, g: number, b: number): number {
        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    }

    /** Helper: Get param as number */
    protected getNumber(name: string, fallback: number = 0): number {
        const val = this.params[name];
        return typeof val === 'number' ? val : fallback;
    }

    /** Helper: Get param as boolean */
    protected getBoolean(name: string, fallback: boolean = false): boolean {
        const val = this.params[name];
        return typeof val === 'boolean' ? val : fallback;
    }

    /** Helper: Get color param as array of RGB tuples */
    protected getColors(name: string): RgbTuple[] {
        const val = this.params[name];
        if (Array.isArray(val) && val.length > 0 && Array.isArray(val[0])) {
            return val as RgbTuple[];
        }
        // Fallback: default pink
        return [[255, 0, 100]];
    }

    /** Helper: Get first color from a color param */
    protected getColor(name: string): RgbTuple {
        const colors = this.getColors(name);
        return colors[0] || [255, 0, 100];
    }

    /** Helper: Convert HSL to RGB */
    protected hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        h /= 360;
        s /= 100;
        l /= 100;

        if (s === 0) {
            const gray = Math.round(l * 255);
            return { r: gray, g: gray, b: gray };
        }

        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        return {
            r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
        };
    }
}

import type { EffectInfo, EffectParams, RgbColor } from '@ravepi/shared-types';

/**
 * Effect interface - all effects must implement this.
 */
export interface Effect {
    /** Effect metadata for UI */
    readonly info: EffectInfo;

    /** Initialize effect with LED count and parameters */
    init(ledCount: number, params?: EffectParams): void;

    /** Update parameters while running */
    setParams(params: EffectParams): void;

    /** Set base color (used by color-based effects) */
    setColor(color: RgbColor): void;

    /** Generate next frame - returns pixel buffer */
    tick(frame: number, deltaTime: number): Uint32Array;

    /** Cleanup when effect is switched */
    dispose(): void;
}

/**
 * Base class for effects with common functionality.
 */
export abstract class BaseEffect implements Effect {
    abstract readonly info: EffectInfo;

    protected ledCount = 0;
    protected params: EffectParams = {};
    protected color: RgbColor = { r: 255, g: 0, b: 100 };
    protected pixels: Uint32Array = new Uint32Array(0);

    init(ledCount: number, params?: EffectParams): void {
        this.ledCount = ledCount;
        this.pixels = new Uint32Array(ledCount);
        if (params) {
            this.params = { ...params };
        } else {
            // Set defaults from schema
            this.params = {};
            for (const param of this.info.params) {
                this.params[param.name] = param.default;
            }
        }
    }

    setParams(params: EffectParams): void {
        this.params = { ...this.params, ...params };
    }

    setColor(color: RgbColor): void {
        this.color = { ...color };
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

    /** Helper: Get param as color */
    protected getColor(name: string): RgbColor {
        const val = this.params[name];
        if (val && typeof val === 'object' && 'r' in val) {
            return val as RgbColor;
        }
        return this.color;
    }

    /** Helper: Get param as boolean */
    protected getBoolean(name: string, fallback: boolean = false): boolean {
        const val = this.params[name];
        return typeof val === 'boolean' ? val : fallback;
    }
}

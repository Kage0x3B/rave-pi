import type { RgbColor } from './color.js';
import type { EffectParams } from './effects.js';

/** Current LED strip state */
export interface LedState {
    /** Whether the strip is on */
    power: boolean;
    /** Brightness level 0-255 */
    brightness: number;
    /** Base color (used by some effects) */
    color: RgbColor;
    /** Currently active effect name */
    effect: string;
    /** Parameters for the current effect */
    effectParams: EffectParams;
}

/** Daemon health/status info */
export interface DaemonStatus {
    ok: boolean;
    uptime: number;
    ledCount: number;
    fps: number;
}

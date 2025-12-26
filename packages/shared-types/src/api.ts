import type { RgbColor } from './color.js';
import type { EffectParams, EffectWithSource } from './effects.js';
import type { DaemonStatus, LedState } from './state.js';

// ============ Request Types ============

export interface SetPowerRequest {
    on: boolean;
}

export interface SetBrightnessRequest {
    /** Brightness value 0-255 */
    value: number;
}

export interface SetColorRequest {
    r: number;
    g: number;
    b: number;
}

export interface SetEffectRequest {
    name: string;
    params?: EffectParams;
}

export interface SaveSceneRequest {
    /** Name for the scene */
    name: string;
}

export interface SaveEffectRequest {
    /** JavaScript source code of the effect */
    source: string;
}

// ============ Response Types ============

export interface ApiResponse<T = void> {
    ok: boolean;
    data?: T;
    error?: string;
}

export interface HealthResponse extends DaemonStatus {}

export interface StateResponse extends LedState {}

export interface EffectsResponse {
    effects: EffectWithSource[];
}

export interface ScenesResponse {
    scenes: Scene[];
}

// ============ Scene Types ============

export interface Scene {
    id: string;
    name: string;
    color: RgbColor;
    brightness: number;
    effect: string;
    effectParams: EffectParams;
}

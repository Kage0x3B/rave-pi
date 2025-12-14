import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { LedState, RgbColor, EffectParams, Scene } from '@ravepi/shared-types';
import { STATE_CONFIG } from './config.js';

/** Default state when no saved state exists */
const DEFAULT_STATE: LedState = {
    power: false,
    brightness: 255,
    color: { r: 255, g: 0, b: 100 }, // Rave pink
    effect: 'solid',
    effectParams: {},
};

/** Persistent state with scenes */
interface PersistedData {
    state: LedState;
    scenes: Scene[];
}

/**
 * State manager with persistence.
 * Saves state to disk with debouncing to avoid excessive writes.
 */
export class StateManager {
    private _state: LedState;
    private _scenes: Scene[];
    private saveTimer: NodeJS.Timeout | null = null;
    private listeners: Set<(state: LedState) => void> = new Set();

    constructor() {
        this._state = { ...DEFAULT_STATE };
        this._scenes = [];
    }

    /** Load state from disk */
    async load(): Promise<void> {
        if (!existsSync(STATE_CONFIG.statePath)) {
            console.log('[State] No saved state, using defaults');
            return;
        }

        try {
            const data = await readFile(STATE_CONFIG.statePath, 'utf-8');
            const parsed: PersistedData = JSON.parse(data);
            this._state = { ...DEFAULT_STATE, ...parsed.state };
            this._scenes = parsed.scenes ?? [];
            console.log('[State] Loaded from disk');
        } catch (err) {
            console.error('[State] Failed to load:', err);
        }
    }

    /** Save state to disk (debounced) */
    private scheduleSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(async () => {
            try {
                const data: PersistedData = {
                    state: this._state,
                    scenes: this._scenes,
                };
                await writeFile(STATE_CONFIG.statePath, JSON.stringify(data, null, 2));
                console.log('[State] Saved to disk');
            } catch (err) {
                console.error('[State] Failed to save:', err);
            }
        }, STATE_CONFIG.saveDebounce);
    }

    /** Get current state (immutable) */
    get state(): LedState {
        return { ...this._state };
    }

    /** Get all scenes */
    get scenes(): Scene[] {
        return [...this._scenes];
    }

    /** Update power state */
    setPower(on: boolean): void {
        this._state.power = on;
        this.notifyAndSave();
    }

    /** Update brightness */
    setBrightness(value: number): void {
        this._state.brightness = Math.max(0, Math.min(255, value));
        this.notifyAndSave();
    }

    /** Update base color */
    setColor(color: RgbColor): void {
        this._state.color = { ...color };
        this.notifyAndSave();
    }

    /** Update effect and params */
    setEffect(name: string, params?: EffectParams): void {
        this._state.effect = name;
        if (params) {
            this._state.effectParams = { ...params };
        }
        this.notifyAndSave();
    }

    /** Update effect params only */
    setEffectParams(params: EffectParams): void {
        this._state.effectParams = { ...params };
        this.notifyAndSave();
    }

    /** Save a scene */
    saveScene(name: string): Scene {
        const scene: Scene = {
            id: crypto.randomUUID(),
            name,
            color: { ...this._state.color },
            brightness: this._state.brightness,
            effect: this._state.effect,
            effectParams: { ...this._state.effectParams },
        };

        // Replace if name exists, otherwise add
        const existingIndex = this._scenes.findIndex((s) => s.name === name);
        if (existingIndex >= 0) {
            scene.id = this._scenes[existingIndex].id;
            this._scenes[existingIndex] = scene;
        } else {
            this._scenes.push(scene);
        }

        this.scheduleSave();
        return scene;
    }

    /** Delete a scene */
    deleteScene(id: string): boolean {
        const index = this._scenes.findIndex((s) => s.id === id);
        if (index >= 0) {
            this._scenes.splice(index, 1);
            this.scheduleSave();
            return true;
        }
        return false;
    }

    /** Apply a scene */
    applyScene(id: string): boolean {
        const scene = this._scenes.find((s) => s.id === id);
        if (!scene) return false;

        this._state.color = { ...scene.color };
        this._state.brightness = scene.brightness;
        this._state.effect = scene.effect;
        this._state.effectParams = { ...scene.effectParams };
        this.notifyAndSave();
        return true;
    }

    /** Subscribe to state changes */
    subscribe(listener: (state: LedState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyAndSave(): void {
        this.listeners.forEach((fn) => fn(this._state));
        this.scheduleSave();
    }
}

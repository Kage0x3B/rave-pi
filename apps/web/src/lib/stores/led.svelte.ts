import type { LedState, EffectInfo, Scene, RgbColor, EffectParams, DaemonStatus } from '@ravepi/shared-types';
import { api } from '$lib/api/client';

/** LED state store using Svelte 5 runes */
class LedStore {
    // State
    state = $state<LedState>({
        power: false,
        brightness: 255,
        color: { r: 255, g: 0, b: 100 },
        effect: 'solid',
        effectParams: {},
    });

    effects = $state<EffectInfo[]>([]);
    scenes = $state<Scene[]>([]);
    status = $state<DaemonStatus | null>(null);

    // Connection state
    connected = $state(false);
    loading = $state(true);
    error = $state<string | null>(null);

    // Polling interval
    private pollInterval: ReturnType<typeof setInterval> | null = null;

    /** Initialize store and start polling */
    async init() {
        await this.refresh();
        this.startPolling();
    }

    /** Refresh all data from daemon */
    async refresh() {
        this.loading = true;
        this.error = null;

        try {
            const [stateRes, effectsRes, scenesRes, healthRes] = await Promise.all([
                api.getState(),
                api.getEffects(),
                api.getScenes(),
                api.getHealth(),
            ]);

            this.state = stateRes;
            this.effects = effectsRes.effects;
            this.scenes = scenesRes.scenes;
            this.status = healthRes;
            this.connected = true;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Connection failed';
            this.connected = false;
        } finally {
            this.loading = false;
        }
    }

    /** Start polling for state updates */
    startPolling(interval = 2000) {
        this.stopPolling();
        this.pollInterval = setInterval(() => this.pollState(), interval);
    }

    /** Stop polling */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /** Poll current state only */
    private async pollState() {
        try {
            const [stateRes, healthRes] = await Promise.all([api.getState(), api.getHealth()]);
            this.state = stateRes;
            this.status = healthRes;
            this.connected = true;
            this.error = null;
        } catch {
            this.connected = false;
        }
    }

    /** Set power on/off */
    async setPower(on: boolean) {
        try {
            await api.setPower(on);
            this.state.power = on;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to set power';
        }
    }

    /** Set brightness (0-255) */
    async setBrightness(value: number) {
        try {
            await api.setBrightness(value);
            this.state.brightness = value;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to set brightness';
        }
    }

    /** Set color */
    async setColor(color: RgbColor) {
        try {
            await api.setColor(color.r, color.g, color.b);
            this.state.color = color;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to set color';
        }
    }

    /** Set effect */
    async setEffect(name: string, params?: EffectParams) {
        try {
            await api.setEffect(name, params);
            this.state.effect = name;
            if (params) {
                this.state.effectParams = params;
            }
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to set effect';
        }
    }

    /** Update effect parameters */
    async setEffectParams(params: EffectParams) {
        try {
            await api.setEffectParams(params);
            this.state.effectParams = { ...this.state.effectParams, ...params };
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to update params';
        }
    }

    /** Save current state as scene */
    async saveScene(name: string) {
        try {
            await api.saveScene(name);
            // Refresh scenes
            const res = await api.getScenes();
            this.scenes = res.scenes;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to save scene';
        }
    }

    /** Apply a scene */
    async applyScene(id: string) {
        try {
            await api.applyScene(id);
            // Refresh state
            const res = await api.getState();
            this.state = res;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to apply scene';
        }
    }

    /** Delete a scene */
    async deleteScene(id: string) {
        try {
            await api.deleteScene(id);
            this.scenes = this.scenes.filter((s) => s.id !== id);
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to delete scene';
        }
    }

    /** Get current effect info */
    get currentEffect(): EffectInfo | undefined {
        return this.effects.find((e) => e.name === this.state.effect);
    }
}

export const ledStore = new LedStore();

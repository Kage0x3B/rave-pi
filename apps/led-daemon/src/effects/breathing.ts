import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class BreathingEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'breathing',
        label: 'Breathing',
        description: 'Gentle pulsing brightness effect',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 1,
                min: 0.2,
                max: 3,
                step: 0.1,
                description: 'Breathing speed',
            },
            {
                name: 'minBrightness',
                label: 'Min Brightness',
                type: 'number',
                default: 10,
                min: 0,
                max: 100,
                step: 5,
                description: 'Minimum brightness percentage',
            },
        ],
    };

    private phase = 0;

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 1);
        const minBrightness = this.getNumber('minBrightness', 10) / 100;

        // Smooth sine wave breathing
        this.phase += speed * 0.03;
        if (this.phase >= Math.PI * 2) this.phase -= Math.PI * 2;

        // Map sine [-1, 1] to [minBrightness, 1]
        const brightness = minBrightness + ((Math.sin(this.phase) + 1) / 2) * (1 - minBrightness);

        const r = Math.round(this.color.r * brightness);
        const g = Math.round(this.color.g * brightness);
        const b = Math.round(this.color.b * brightness);
        const color = this.rgbToInt(r, g, b);

        this.pixels.fill(color);
        return this.pixels;
    }
}

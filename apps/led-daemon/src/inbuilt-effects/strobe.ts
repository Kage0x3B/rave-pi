import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

export class StrobeEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'strobe',
        label: 'Strobe',
        description: 'Flashing strobe light effect',
        icon: '⚡',
        params: [
            {
                name: 'color',
                label: 'Color',
                type: 'color',
                default: [[255, 0, 100]]
            },
            {
                name: 'backgroundColor',
                label: 'Background',
                type: 'color',
                default: [[0, 0, 0]]
            },
            {
                name: 'frequency',
                label: 'Frequency',
                type: 'number',
                default: 5,
                min: 1,
                max: 20,
                step: 1,
                description: 'Flashes per second'
            },
            {
                name: 'dutyCycle',
                label: 'Duty Cycle',
                type: 'number',
                default: 50,
                min: 10,
                max: 90,
                step: 5,
                description: 'Percentage of time on'
            }
        ]
    };

    private phase = 0;

    tick(_frame: number, deltaTime: number): Uint32Array {
        const [r, g, b] = this.getColor('color');
        const [bgR, bgG, bgB] = this.getColor('backgroundColor');
        const bgColor = this.rgbToInt(bgR, bgG, bgB);
        const frequency = this.getNumber('frequency', 5);
        const dutyCycle = this.getNumber('dutyCycle', 50) / 100;

        // Update phase based on frequency
        this.phase += (frequency * deltaTime) / 1000;
        if (this.phase >= 1) this.phase -= 1;

        // Determine if on or off
        const isOn = this.phase < dutyCycle;
        const color = isOn ? this.rgbToInt(r, g, b) : bgColor;

        this.pixels.fill(color);
        return this.pixels;
    }
}

export default StrobeEffect;

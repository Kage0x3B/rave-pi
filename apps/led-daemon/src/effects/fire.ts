import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class FireEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'fire',
        label: 'Fire',
        description: 'Realistic fire/flame simulation',
        params: [
            {
                name: 'cooling',
                label: 'Cooling',
                type: 'number',
                default: 55,
                min: 20,
                max: 100,
                step: 5,
                description: 'How quickly flames cool down',
            },
            {
                name: 'sparking',
                label: 'Sparking',
                type: 'number',
                default: 120,
                min: 50,
                max: 200,
                step: 10,
                description: 'Chance of new sparks',
            },
        ],
    };

    private heat: number[] = [];

    init(ledCount: number): void {
        super.init(ledCount);
        this.heat = new Array(ledCount).fill(0);
    }

    tick(): Uint32Array {
        const cooling = this.getNumber('cooling', 55);
        const sparking = this.getNumber('sparking', 120);

        // Cool down every cell a little
        for (let i = 0; i < this.ledCount; i++) {
            const cooldown = Math.random() * ((cooling * 10) / this.ledCount + 2);
            this.heat[i] = Math.max(0, this.heat[i] - cooldown);
        }

        // Heat rises - drift upward and diffuse
        for (let i = this.ledCount - 1; i >= 2; i--) {
            this.heat[i] = (this.heat[i - 1] + this.heat[i - 2] + this.heat[i - 2]) / 3;
        }

        // Randomly ignite new sparks at the bottom
        if (Math.random() * 255 < sparking) {
            const y = Math.floor(Math.random() * 7);
            this.heat[y] = Math.min(255, this.heat[y] + 160 + Math.random() * 95);
        }

        // Convert heat to LED colors
        for (let i = 0; i < this.ledCount; i++) {
            const color = this.heatToColor(this.heat[i]);
            this.pixels[i] = color;
        }

        return this.pixels;
    }

    private heatToColor(temperature: number): number {
        // Scale temperature to 0-255
        const t = Math.floor(temperature);

        // Map temperature to color: black -> red -> yellow -> white
        let r: number, g: number, b: number;

        if (t < 85) {
            // Black to red
            r = Math.floor((t / 85) * 255);
            g = 0;
            b = 0;
        } else if (t < 170) {
            // Red to yellow
            r = 255;
            g = Math.floor(((t - 85) / 85) * 255);
            b = 0;
        } else {
            // Yellow to white
            r = 255;
            g = 255;
            b = Math.floor(((t - 170) / 85) * 255);
        }

        return this.rgbToInt(r, g, b);
    }
}

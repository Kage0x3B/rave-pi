import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class CometEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'comet',
        label: 'Comet',
        description: 'Moving comet with fading tail',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 2,
                min: 0.5,
                max: 10,
                step: 0.5,
                description: 'Comet speed',
            },
            {
                name: 'tailLength',
                label: 'Tail Length',
                type: 'number',
                default: 20,
                min: 5,
                max: 50,
                step: 1,
                description: 'Length of the tail',
            },
            {
                name: 'bounce',
                label: 'Bounce',
                type: 'boolean',
                default: true,
                description: 'Bounce back or wrap around',
            },
        ],
    };

    private position = 0;
    private direction = 1;

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 2);
        const tailLength = Math.floor(this.getNumber('tailLength', 20));
        const bounce = this.getBoolean('bounce', true);

        // Update position
        this.position += speed * this.direction;

        // Handle boundaries
        if (bounce) {
            if (this.position >= this.ledCount) {
                this.position = this.ledCount - 1;
                this.direction = -1;
            } else if (this.position < 0) {
                this.position = 0;
                this.direction = 1;
            }
        } else {
            if (this.position >= this.ledCount + tailLength) {
                this.position = -tailLength;
            }
        }

        // Clear pixels
        this.pixels.fill(0);

        // Draw comet head and tail
        const headPos = Math.floor(this.position);

        for (let i = 0; i < tailLength; i++) {
            const pixelPos = headPos - i * this.direction;

            if (pixelPos >= 0 && pixelPos < this.ledCount) {
                // Fade from head to tail
                const brightness = 1 - i / tailLength;
                const r = Math.round(this.color.r * brightness);
                const g = Math.round(this.color.g * brightness);
                const b = Math.round(this.color.b * brightness);
                this.pixels[pixelPos] = this.rgbToInt(r, g, b);
            }
        }

        return this.pixels;
    }
}

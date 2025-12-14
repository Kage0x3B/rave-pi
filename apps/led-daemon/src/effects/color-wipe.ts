import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class ColorWipeEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'color-wipe',
        label: 'Color Wipe',
        description: 'Sequential fill animation',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 2,
                min: 0.5,
                max: 10,
                step: 0.5,
                description: 'Wipe speed',
            },
        ],
    };

    private position = 0;
    private direction = 1; // 1 = filling, -1 = clearing
    private currentColor = 0;

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 2);
        const targetColor = this.rgbToInt(this.color.r, this.color.g, this.color.b);

        // Update position
        this.position += speed * this.direction;

        // Handle direction changes
        if (this.position >= this.ledCount) {
            this.position = this.ledCount;
            this.direction = -1;
            this.currentColor = targetColor;
        } else if (this.position <= 0) {
            this.position = 0;
            this.direction = 1;
            this.currentColor = 0;
        }

        // Render
        const fillPoint = Math.floor(this.position);
        for (let i = 0; i < this.ledCount; i++) {
            if (this.direction === 1) {
                // Filling: show current color up to position, target after
                this.pixels[i] = i < fillPoint ? targetColor : this.currentColor;
            } else {
                // Clearing: show target up to position, clearing after
                this.pixels[i] = i < fillPoint ? this.currentColor : 0;
            }
        }

        return this.pixels;
    }
}

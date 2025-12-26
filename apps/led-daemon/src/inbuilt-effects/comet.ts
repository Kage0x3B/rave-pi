import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

export class CometEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'comet',
        label: 'Comet',
        description: 'Moving comet with fading tail',
        icon: '☄️',
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
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 2,
                min: 0.5,
                max: 10,
                step: 0.5,
                description: 'Comet speed'
            },
            {
                name: 'tailLength',
                label: 'Tail Length',
                type: 'number',
                default: 20,
                min: 5,
                max: 50,
                step: 1,
                description: 'Length of the tail'
            },
            {
                name: 'bounce',
                label: 'Bounce',
                type: 'boolean',
                default: true,
                description: 'Bounce back or wrap around'
            }
        ]
    };

    private position = 0;
    private direction = 1;

    tick(): Uint32Array {
        const [cr, cg, cb] = this.getColor('color');
        const [bgR, bgG, bgB] = this.getColor('backgroundColor');
        const bgColor = this.rgbToInt(bgR, bgG, bgB);
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

        // Fill with background color
        this.pixels.fill(bgColor);

        // Draw comet head and tail
        const headPos = Math.floor(this.position);

        for (let i = 0; i < tailLength; i++) {
            const pixelPos = headPos - i * this.direction;

            if (pixelPos >= 0 && pixelPos < this.ledCount) {
                // Fade from comet color to background color
                const t = i / tailLength;
                const r = Math.round(cr + (bgR - cr) * t);
                const g = Math.round(cg + (bgG - cg) * t);
                const b = Math.round(cb + (bgB - cb) * t);
                this.pixels[pixelPos] = this.rgbToInt(r, g, b);
            }
        }

        return this.pixels;
    }
}

export default CometEffect;

import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class RainbowEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'rainbow',
        label: 'Rainbow',
        description: 'Cycling rainbow colors across the strip',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
                description: 'Animation speed multiplier',
            },
            {
                name: 'spread',
                label: 'Spread',
                type: 'number',
                default: 1,
                min: 0.5,
                max: 5,
                step: 0.1,
                description: 'How many rainbow cycles across the strip',
            },
        ],
    };

    private hueOffset = 0;

    tick(frame: number): Uint32Array {
        const speed = this.getNumber('speed', 1);
        const spread = this.getNumber('spread', 1);

        this.hueOffset += speed * 2;
        if (this.hueOffset >= 360) this.hueOffset -= 360;

        for (let i = 0; i < this.ledCount; i++) {
            const hue = (this.hueOffset + (i / this.ledCount) * 360 * spread) % 360;
            const rgb = this.hslToRgb(hue, 100, 50);
            this.pixels[i] = this.rgbToInt(rgb.r, rgb.g, rgb.b);
        }

        return this.pixels;
    }

    private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        h /= 360;
        s /= 100;
        l /= 100;

        if (s === 0) {
            const gray = Math.round(l * 255);
            return { r: gray, g: gray, b: gray };
        }

        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        return {
            r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
        };
    }
}

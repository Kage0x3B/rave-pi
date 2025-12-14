import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class TheaterChaseEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'theater-chase',
        label: 'Theater Chase',
        description: 'Classic theater marquee chasing lights',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 1,
                min: 0.2,
                max: 5,
                step: 0.2,
                description: 'Chase speed',
            },
            {
                name: 'spacing',
                label: 'Spacing',
                type: 'number',
                default: 3,
                min: 2,
                max: 10,
                step: 1,
                description: 'Pixels between lit LEDs',
            },
            {
                name: 'rainbow',
                label: 'Rainbow Mode',
                type: 'boolean',
                default: false,
                description: 'Use rainbow colors instead of solid',
            },
        ],
    };

    private offset = 0;

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 1);
        const spacing = Math.floor(this.getNumber('spacing', 3));
        const rainbow = this.getBoolean('rainbow', false);

        this.offset += speed * 0.15;
        if (this.offset >= spacing) this.offset -= spacing;

        const baseColor = this.rgbToInt(this.color.r, this.color.g, this.color.b);

        for (let i = 0; i < this.ledCount; i++) {
            const pos = (i + Math.floor(this.offset)) % spacing;

            if (pos === 0) {
                if (rainbow) {
                    const hue = (i / this.ledCount) * 360;
                    const rgb = this.hslToRgb(hue, 100, 50);
                    this.pixels[i] = this.rgbToInt(rgb.r, rgb.g, rgb.b);
                } else {
                    this.pixels[i] = baseColor;
                }
            } else {
                this.pixels[i] = 0;
            }
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

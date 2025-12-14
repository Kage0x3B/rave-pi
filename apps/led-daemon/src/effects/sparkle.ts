import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class SparkleEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'sparkle',
        label: 'Sparkle',
        description: 'Random twinkling sparkles',
        params: [
            {
                name: 'density',
                label: 'Density',
                type: 'number',
                default: 10,
                min: 1,
                max: 50,
                step: 1,
                description: 'Number of simultaneous sparkles',
            },
            {
                name: 'fadeSpeed',
                label: 'Fade Speed',
                type: 'number',
                default: 10,
                min: 1,
                max: 30,
                step: 1,
                description: 'How quickly sparkles fade',
            },
            {
                name: 'colorful',
                label: 'Colorful',
                type: 'boolean',
                default: false,
                description: 'Use random colors',
            },
        ],
    };

    private sparkles: { pos: number; brightness: number; color: number }[] = [];

    tick(): Uint32Array {
        const density = Math.floor(this.getNumber('density', 10));
        const fadeSpeed = this.getNumber('fadeSpeed', 10) / 100;
        const colorful = this.getBoolean('colorful', false);

        // Fade existing sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            this.sparkles[i].brightness -= fadeSpeed;
            if (this.sparkles[i].brightness <= 0) {
                this.sparkles.splice(i, 1);
            }
        }

        // Add new sparkles to reach density
        while (this.sparkles.length < density) {
            const pos = Math.floor(Math.random() * this.ledCount);
            let color: number;

            if (colorful) {
                const hue = Math.random() * 360;
                const rgb = this.hslToRgb(hue, 100, 50);
                color = this.rgbToInt(rgb.r, rgb.g, rgb.b);
            } else {
                color = this.rgbToInt(this.color.r, this.color.g, this.color.b);
            }

            this.sparkles.push({
                pos,
                brightness: 1,
                color,
            });
        }

        // Clear and draw sparkles
        this.pixels.fill(0);

        for (const sparkle of this.sparkles) {
            const r = ((sparkle.color >> 16) & 0xff) * sparkle.brightness;
            const g = ((sparkle.color >> 8) & 0xff) * sparkle.brightness;
            const b = (sparkle.color & 0xff) * sparkle.brightness;
            this.pixels[sparkle.pos] = this.rgbToInt(Math.round(r), Math.round(g), Math.round(b));
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

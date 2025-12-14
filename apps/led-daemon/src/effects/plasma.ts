import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class PlasmaEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'plasma',
        label: 'Plasma',
        description: 'Psychedelic plasma wave effect',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 1,
                min: 0.2,
                max: 3,
                step: 0.1,
                description: 'Animation speed',
            },
            {
                name: 'scale',
                label: 'Scale',
                type: 'number',
                default: 1,
                min: 0.5,
                max: 3,
                step: 0.1,
                description: 'Pattern scale',
            },
        ],
    };

    private time = 0;

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 1);
        const scale = this.getNumber('scale', 1);

        this.time += speed * 0.02;

        for (let i = 0; i < this.ledCount; i++) {
            const x = i / this.ledCount;

            // Multiple overlapping sine waves for plasma effect
            const v1 = Math.sin(x * 10 * scale + this.time);
            const v2 = Math.sin(x * 10 * scale * 0.5 + this.time * 1.3);
            const v3 = Math.sin((x * 10 * scale + this.time + Math.sin(this.time * 0.5)) * 0.5);

            // Combine waves
            const v = (v1 + v2 + v3) / 3;

            // Map to hue
            const hue = ((v + 1) / 2) * 360;
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

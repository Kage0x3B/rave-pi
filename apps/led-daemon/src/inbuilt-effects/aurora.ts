import type { EffectInfo, RgbTuple } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

export class AuroraEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'aurora',
        label: 'Aurora',
        description: 'Flowing waves of color like the northern lights',
        icon: '🌌',
        params: [
            {
                name: 'color',
                label: 'Colors',
                type: 'color',
                default: [
                    [0, 255, 100],
                    [0, 200, 255],
                    [100, 0, 255],
                    [0, 255, 200]
                ],
                multipleColors: true
            },
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 1,
                min: 0.1,
                max: 3,
                step: 0.1,
                description: 'Animation speed'
            },
            {
                name: 'complexity',
                label: 'Complexity',
                type: 'number',
                default: 3,
                min: 1,
                max: 5,
                step: 1,
                description: 'Number of overlapping waves'
            },
            {
                name: 'stretch',
                label: 'Stretch',
                type: 'number',
                default: 1,
                min: 0.2,
                max: 4,
                step: 0.1,
                description: 'How stretched the waves are'
            },
            {
                name: 'shimmer',
                label: 'Shimmer',
                type: 'number',
                default: 0,
                min: 0,
                max: 1,
                step: 0.1,
                description: 'Add subtle brightness variation'
            },
            {
                name: 'reverse',
                label: 'Reverse',
                type: 'boolean',
                default: false,
                description: 'Reverse wave direction'
            }
        ]
    };

    private time = 0;

    tick(): Uint32Array {
        const colors = this.getColors('color');
        const speed = this.getNumber('speed', 1);
        const complexity = Math.floor(this.getNumber('complexity', 3));
        const stretch = this.getNumber('stretch', 1);
        const shimmer = this.getNumber('shimmer', 0);
        const reverse = this.getBoolean('reverse', false);

        const direction = reverse ? -1 : 1;
        this.time += speed * 0.02 * direction;

        for (let i = 0; i < this.ledCount; i++) {
            const x = i / this.ledCount;

            // Build up waves based on complexity
            let v = 0;
            for (let w = 0; w < complexity; w++) {
                const freq = (w + 1) * 0.5;
                const phase = w * 0.7;
                v += Math.sin(x * 10 * stretch * freq + this.time * (1 + w * 0.3) + phase);
            }
            v = v / complexity;

            // Normalize to 0-1
            v = (v + 1) / 2;

            // Interpolate between colors
            const rgb = this.interpolateColors(colors, v);

            // Apply shimmer
            if (shimmer > 0) {
                const shimmerVal = 1 - shimmer * 0.3 * (0.5 + 0.5 * Math.sin(x * 50 + this.time * 5));
                rgb[0] = Math.round(rgb[0] * shimmerVal);
                rgb[1] = Math.round(rgb[1] * shimmerVal);
                rgb[2] = Math.round(rgb[2] * shimmerVal);
            }

            this.pixels[i] = this.rgbToInt(rgb[0], rgb[1], rgb[2]);
        }

        return this.pixels;
    }

    private interpolateColors(colors: RgbTuple[], t: number): RgbTuple {
        if (colors.length === 1) return [...colors[0]];

        // Map t to color index range
        const scaledT = t * (colors.length - 1);
        const index = Math.floor(scaledT);
        const frac = scaledT - index;

        // Get two colors to blend
        const c1 = colors[Math.min(index, colors.length - 1)];
        const c2 = colors[Math.min(index + 1, colors.length - 1)];

        // Linear interpolation
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * frac),
            Math.round(c1[1] + (c2[1] - c1[1]) * frac),
            Math.round(c1[2] + (c2[2] - c1[2]) * frac)
        ];
    }
}

export default AuroraEffect;

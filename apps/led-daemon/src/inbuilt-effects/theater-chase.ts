import type { EffectInfo, EffectParams } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

export class TheaterChaseEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'theater-chase',
        label: 'Theater Chase',
        description: 'Classic theater marquee chasing lights',
        icon: '🎭',
        params: [
            {
                name: 'color',
                label: 'Colors',
                type: 'color',
                default: [[255, 0, 100]],
                multipleColors: true
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
                default: 5,
                min: 1,
                max: 15,
                step: 1,
                description: 'Movement steps per second'
            },
            {
                name: 'step',
                label: 'Step Size',
                type: 'number',
                default: 1,
                min: 1,
                max: 5,
                step: 1,
                description: 'LEDs to shift per step'
            },
            {
                name: 'spacing',
                label: 'Spacing',
                type: 'number',
                default: 3,
                min: 1,
                max: 10,
                step: 1,
                description: 'Gap between lit groups'
            },
            {
                name: 'groupSize',
                label: 'Group Size',
                type: 'number',
                default: 1,
                min: 1,
                max: 10,
                step: 1,
                description: 'LEDs per lit group'
            }
        ]
    };

    private offset = 0;
    private lastStep = 0;
    private groupColors: number[] = [];

    init(ledCount: number, params?: EffectParams): void {
        super.init(ledCount, params);
        this.offset = 0;
        this.lastStep = Date.now();
        this.regenerateColors();
    }

    private regenerateColors(): void {
        const colors = this.getColors('color');
        const spacing = Math.floor(this.getNumber('spacing', 3));
        const groupSize = Math.floor(this.getNumber('groupSize', 1));
        const patternLength = spacing + groupSize;
        const numGroups = Math.ceil(this.ledCount / patternLength) + 1;

        this.groupColors = [];
        for (let i = 0; i < numGroups; i++) {
            const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];
            this.groupColors.push(this.rgbToInt(r, g, b));
        }
    }

    tick(): Uint32Array {
        const [bgR, bgG, bgB] = this.getColor('backgroundColor');
        const bgColor = this.rgbToInt(bgR, bgG, bgB);
        const speed = this.getNumber('speed', 5);
        const step = Math.floor(this.getNumber('step', 1));
        const spacing = Math.floor(this.getNumber('spacing', 3));
        const groupSize = Math.floor(this.getNumber('groupSize', 1));
        const patternLength = spacing + groupSize;

        // Check if it's time to move
        const now = Date.now();
        const intervalMs = 1000 / speed;
        if (now - this.lastStep >= intervalMs) {
            this.lastStep = now;
            // Move offset and regenerate colors each step
            this.offset = (this.offset + step) % patternLength;
            this.regenerateColors();
        }

        // Fill with background color
        this.pixels.fill(bgColor);

        // Draw groups
        for (let i = 0; i < this.ledCount; i++) {
            const pos = (i + this.offset) % patternLength;

            if (pos < groupSize) {
                // This LED is in a lit group
                const groupIndex = Math.floor((i + this.offset) / patternLength);
                const colorIndex = groupIndex % this.groupColors.length;
                this.pixels[i] = this.groupColors[colorIndex];
            }
        }

        return this.pixels;
    }
}

export default TheaterChaseEffect;

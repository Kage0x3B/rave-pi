import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

const CHRISTMAS_COLORS = [
    { r: 255, g: 255, b: 255 }, // White
    { r: 255, g: 20, b: 10 }, // Warm red
    { r: 255, g: 0, b: 0 }, // Red
    { r: 0, g: 255, b: 0 }, // Green
    { r: 10, g: 255, b: 10 }, // Light green
];

export class ChristmasEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'christmas',
        label: 'Christmas',
        description: 'Alternating groups of festive colors',
        params: [
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 2,
                min: 0.5,
                max: 10,
                step: 0.5,
                description: 'Blinks per second',
            },
            {
                name: 'groupSize',
                label: 'Group Size',
                type: 'number',
                default: 5,
                min: 1,
                max: 20,
                step: 1,
                description: 'LEDs per group',
            },
        ],
    };

    private invertPattern = false;
    private lastToggleTime = 0;
    private groupColors: number[] = [];

    init(ledCount: number, params?: Record<string, unknown>): void {
        super.init(ledCount, params);
        this.invertPattern = false;
        this.lastToggleTime = Date.now();
        this.regenerateColors();
    }

    private regenerateColors(): void {
        const groupSize = Math.floor(this.getNumber('groupSize', 5));
        const numGroups = Math.ceil(this.ledCount / groupSize);
        this.groupColors = [];

        for (let i = 0; i < numGroups; i++) {
            const color = CHRISTMAS_COLORS[Math.floor(Math.random() * CHRISTMAS_COLORS.length)];
            this.groupColors.push(this.rgbToInt(color.r, color.g, color.b));
        }
    }

    tick(): Uint32Array {
        const speed = this.getNumber('speed', 2);
        const groupSize = Math.floor(this.getNumber('groupSize', 5));
        const intervalMs = 1000 / speed;

        const now = Date.now();
        if (now - this.lastToggleTime >= intervalMs) {
            this.invertPattern = !this.invertPattern;
            this.lastToggleTime = now;
            this.regenerateColors();
        }

        for (let i = 0; i < this.ledCount; i += groupSize) {
            const groupIndex = Math.floor(i / groupSize);
            const isEvenGroup = groupIndex % 2 === 0;

            // Determine if this group should be lit
            const shouldLight = this.invertPattern ? isEvenGroup : !isEvenGroup;
            const color = shouldLight ? this.groupColors[groupIndex] : 0;

            // Fill the group
            for (let j = i; j < Math.min(i + groupSize, this.ledCount); j++) {
                this.pixels[j] = color;
            }
        }

        return this.pixels;
    }
}

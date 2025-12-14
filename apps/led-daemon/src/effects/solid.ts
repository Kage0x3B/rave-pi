import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from './types.js';

export class SolidEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'solid',
        label: 'Solid Color',
        description: 'Display a single solid color across all LEDs',
        params: [],
    };

    tick(): Uint32Array {
        const color = this.rgbToInt(this.color.r, this.color.g, this.color.b);
        this.pixels.fill(color);
        return this.pixels;
    }
}

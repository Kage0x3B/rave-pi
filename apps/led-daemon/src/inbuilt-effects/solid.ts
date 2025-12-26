import type { EffectInfo } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

export class SolidEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'solid',
        label: 'Solid Color',
        description: 'Display a single solid color across all LEDs',
        icon: '⬛',
        params: [
            {
                name: 'color',
                label: 'Color',
                type: 'color',
                default: [[255, 0, 100]]
            }
        ]
    };

    tick(): Uint32Array {
        const [r, g, b] = this.getColor('color');
        this.pixels.fill(this.rgbToInt(r, g, b));
        return this.pixels;
    }
}

export default SolidEffect;

import type { EffectInfo, EffectParams, RgbColor } from '@ravepi/shared-types';
import type { Effect } from './types.js';
import { SolidEffect } from './solid.js';
import { RainbowEffect } from './rainbow.js';
import { BreathingEffect } from './breathing.js';
import { ColorWipeEffect } from './color-wipe.js';
import { StrobeEffect } from './strobe.js';
import { FireEffect } from './fire.js';
import { PlasmaEffect } from './plasma.js';
import { TheaterChaseEffect } from './theater-chase.js';
import { CometEffect } from './comet.js';
import { SparkleEffect } from './sparkle.js';
import { ChristmasEffect } from './christmas.js';

/** Registry of all available effects */
const EFFECT_REGISTRY: Record<string, new () => Effect> = {
    solid: SolidEffect,
    rainbow: RainbowEffect,
    breathing: BreathingEffect,
    'color-wipe': ColorWipeEffect,
    strobe: StrobeEffect,
    fire: FireEffect,
    plasma: PlasmaEffect,
    'theater-chase': TheaterChaseEffect,
    comet: CometEffect,
    sparkle: SparkleEffect,
    christmas: ChristmasEffect,
};

/**
 * Effect manager - handles effect creation and switching.
 */
export class EffectManager {
    private effects: Map<string, Effect> = new Map();
    private currentEffect: Effect | null = null;
    private ledCount = 0;
    private color: RgbColor = { r: 255, g: 0, b: 100 };

    constructor(ledCount: number) {
        this.ledCount = ledCount;

        // Instantiate all effects
        for (const [name, EffectClass] of Object.entries(EFFECT_REGISTRY)) {
            this.effects.set(name, new EffectClass());
        }
    }

    /** Get list of all available effects with their info */
    getEffects(): EffectInfo[] {
        return Array.from(this.effects.values()).map((e) => e.info);
    }

    /** Get a specific effect by name */
    getEffect(name: string): Effect | undefined {
        return this.effects.get(name);
    }

    /** Set the active effect */
    setEffect(name: string, params?: EffectParams): boolean {
        const effect = this.effects.get(name);
        if (!effect) {
            console.warn(`[Effects] Unknown effect: ${name}`);
            return false;
        }

        // Dispose current effect
        if (this.currentEffect) {
            this.currentEffect.dispose();
        }

        // Initialize new effect
        this.currentEffect = effect;
        this.currentEffect.init(this.ledCount, params);
        this.currentEffect.setColor(this.color);

        console.log(`[Effects] Activated: ${name}`);
        return true;
    }

    /** Update current effect parameters */
    setParams(params: EffectParams): void {
        if (this.currentEffect) {
            this.currentEffect.setParams(params);
        }
    }

    /** Update base color for all effects */
    setColor(color: RgbColor): void {
        this.color = { ...color };
        if (this.currentEffect) {
            this.currentEffect.setColor(color);
        }
    }

    /** Get current effect */
    getCurrent(): Effect | null {
        return this.currentEffect;
    }

    /** Get current effect name */
    getCurrentName(): string {
        if (!this.currentEffect) return 'none';
        return this.currentEffect.info.name;
    }
}

export type { Effect } from './types.js';

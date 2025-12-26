import type { EffectInfo, EffectParams } from '@ravepi/shared-types';
import { BaseEffect } from '../effect-types.js';

interface Particle {
    position: number;
    velocity: number;
    lifetime: number;
    maxLifetime: number;
    color: number; // Stored as int for performance
    colorR: number;
    colorG: number;
    colorB: number;
}

export class SparkleEffect extends BaseEffect {
    readonly info: EffectInfo = {
        name: 'sparkle',
        label: 'Sparkle',
        description: 'Particle simulation with customizable spawning and physics',
        icon: '✨',
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
                name: 'spawnRate',
                label: 'Spawn Rate',
                type: 'number',
                default: 15,
                min: 1,
                max: 100,
                step: 1,
                description: 'Particles spawned per second'
            },
            {
                name: 'lifetime',
                label: 'Lifetime',
                type: 'number',
                default: 1.5,
                min: 0.2,
                max: 5,
                step: 0.1,
                description: 'Average particle lifetime in seconds'
            },
            {
                name: 'lifetimeVariation',
                label: 'Lifetime Variation',
                type: 'number',
                default: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
                description: 'Randomness in lifetime (0-1)'
            },
            {
                name: 'speed',
                label: 'Speed',
                type: 'number',
                default: 5,
                min: 0,
                max: 50,
                step: 1,
                description: 'Average initial speed (LEDs per second)'
            },
            {
                name: 'speedVariation',
                label: 'Speed Variation',
                type: 'number',
                default: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
                description: 'Randomness in speed (0-1)'
            },
            {
                name: 'gravity',
                label: 'Gravity',
                type: 'number',
                default: 0,
                min: -50,
                max: 50,
                step: 1,
                description: 'Acceleration (positive = forward)'
            },
            {
                name: 'drag',
                label: 'Drag',
                type: 'number',
                default: 0,
                min: 0,
                max: 5,
                step: 0.1,
                description: 'Velocity reduction over time'
            },
            {
                name: 'fadeIn',
                label: 'Fade In',
                type: 'number',
                default: 0.1,
                min: 0,
                max: 0.5,
                step: 0.05,
                description: 'Fade in duration (fraction of lifetime)'
            },
            {
                name: 'fadeOut',
                label: 'Fade Out',
                type: 'number',
                default: 0.5,
                min: 0,
                max: 1,
                step: 0.05,
                description: 'Fade out duration (fraction of lifetime)'
            },
            {
                name: 'size',
                label: 'Size',
                type: 'number',
                default: 1,
                min: 1,
                max: 5,
                step: 1,
                description: 'Particle size in LEDs'
            },
            {
                name: 'bounce',
                label: 'Bounce',
                type: 'boolean',
                default: false,
                description: 'Particles bounce at edges'
            },
            {
                name: 'wrap',
                label: 'Wrap Around',
                type: 'boolean',
                default: true,
                description: 'Particles wrap around edges'
            },
            {
                name: 'bidirectional',
                label: 'Bidirectional',
                type: 'boolean',
                default: true,
                description: 'Particles move in both directions'
            }
        ]
    };

    private particles: Particle[] = [];
    private spawnAccumulator = 0;
    private lastTime = 0;

    init(ledCount: number, params?: EffectParams): void {
        super.init(ledCount, params);
        this.particles = [];
        this.spawnAccumulator = 0;
        this.lastTime = performance.now();
    }

    private spawnParticle(): void {
        const colors = this.getColors('color');
        const lifetime = this.getNumber('lifetime', 1.5);
        const lifetimeVariation = this.getNumber('lifetimeVariation', 0.5);
        const speed = this.getNumber('speed', 5);
        const speedVariation = this.getNumber('speedVariation', 0.5);
        const bidirectional = this.getBoolean('bidirectional', true);

        // Random color from palette
        const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];

        // Calculate lifetime with variation
        const variation = 1 - lifetimeVariation + Math.random() * lifetimeVariation * 2;
        const particleLifetime = lifetime * variation;

        // Calculate initial velocity with variation
        const speedVar = 1 - speedVariation + Math.random() * speedVariation * 2;
        let velocity = speed * speedVar;

        // Randomize direction if bidirectional
        if (bidirectional && Math.random() < 0.5) {
            velocity = -velocity;
        }

        // Random spawn position
        const position = Math.random() * this.ledCount;

        this.particles.push({
            position,
            velocity,
            lifetime: particleLifetime,
            maxLifetime: particleLifetime,
            color: this.rgbToInt(r, g, b),
            colorR: r,
            colorG: g,
            colorB: b
        });
    }

    tick(_frame: number, deltaTime: number): Uint32Array {
        const [bgR, bgG, bgB] = this.getColor('backgroundColor');
        const bgColor = this.rgbToInt(bgR, bgG, bgB);
        const spawnRate = this.getNumber('spawnRate', 15);
        const gravity = this.getNumber('gravity', 0);
        const drag = this.getNumber('drag', 0);
        const fadeIn = this.getNumber('fadeIn', 0.1);
        const fadeOut = this.getNumber('fadeOut', 0.5);
        const size = Math.floor(this.getNumber('size', 1));
        const bounce = this.getBoolean('bounce', false);
        const wrap = this.getBoolean('wrap', true);

        const dt = deltaTime / 1000; // Convert to seconds

        // Spawn new particles
        this.spawnAccumulator += spawnRate * dt;
        while (this.spawnAccumulator >= 1) {
            this.spawnParticle();
            this.spawnAccumulator -= 1;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply gravity
            p.velocity += gravity * dt;

            // Apply drag
            if (drag > 0) {
                const dragFactor = Math.max(0, 1 - drag * dt);
                p.velocity *= dragFactor;
            }

            // Update position
            p.position += p.velocity * dt;

            // Handle boundaries
            if (bounce) {
                if (p.position < 0) {
                    p.position = -p.position;
                    p.velocity = -p.velocity;
                } else if (p.position >= this.ledCount) {
                    p.position = 2 * this.ledCount - p.position - 1;
                    p.velocity = -p.velocity;
                }
            } else if (wrap) {
                while (p.position < 0) p.position += this.ledCount;
                while (p.position >= this.ledCount) p.position -= this.ledCount;
            }

            // Update lifetime
            p.lifetime -= dt;

            // Remove dead particles
            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Fill with background color
        this.pixels.fill(bgColor);

        // Render particles (use a brightness buffer for overlapping)
        const brightness = new Float32Array(this.ledCount);
        const colorR = new Float32Array(this.ledCount);
        const colorG = new Float32Array(this.ledCount);
        const colorB = new Float32Array(this.ledCount);

        // Initialize with background
        for (let i = 0; i < this.ledCount; i++) {
            colorR[i] = bgR;
            colorG[i] = bgG;
            colorB[i] = bgB;
        }

        for (const p of this.particles) {
            // Calculate alpha based on lifetime (fade in/out)
            const lifeProgress = 1 - p.lifetime / p.maxLifetime; // 0 = just born, 1 = about to die
            let alpha = 1;

            if (lifeProgress < fadeIn && fadeIn > 0) {
                alpha = lifeProgress / fadeIn;
            } else if (lifeProgress > 1 - fadeOut && fadeOut > 0) {
                alpha = (1 - lifeProgress) / fadeOut;
            }

            // Render particle with size
            const centerPos = Math.floor(p.position);
            const halfSize = Math.floor(size / 2);

            for (let offset = -halfSize; offset <= halfSize; offset++) {
                let ledIndex = centerPos + offset;

                // Handle wrapping for rendering
                if (wrap) {
                    while (ledIndex < 0) ledIndex += this.ledCount;
                    while (ledIndex >= this.ledCount) ledIndex -= this.ledCount;
                }

                if (ledIndex >= 0 && ledIndex < this.ledCount) {
                    // Distance-based falloff for larger particles
                    const distanceFalloff = size > 1 ? 1 - Math.abs(offset) / (halfSize + 1) : 1;
                    const finalAlpha = alpha * distanceFalloff;

                    // Additive blending - accumulate brightness
                    if (finalAlpha > brightness[ledIndex]) {
                        brightness[ledIndex] = finalAlpha;
                        // Blend color towards particle color
                        const t = finalAlpha;
                        colorR[ledIndex] = bgR + (p.colorR - bgR) * t;
                        colorG[ledIndex] = bgG + (p.colorG - bgG) * t;
                        colorB[ledIndex] = bgB + (p.colorB - bgB) * t;
                    }
                }
            }
        }

        // Write final colors
        for (let i = 0; i < this.ledCount; i++) {
            this.pixels[i] = this.rgbToInt(
                Math.round(colorR[i]),
                Math.round(colorG[i]),
                Math.round(colorB[i])
            );
        }

        return this.pixels;
    }
}

export default SparkleEffect;

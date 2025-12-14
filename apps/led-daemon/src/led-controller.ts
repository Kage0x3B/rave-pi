import { LED_CONFIG } from './config.js';

/** Interface matching rpi-ws281x */
interface Ws281x {
    configure(options: {
        leds: number;
        gpio?: number;
        dma?: number;
        brightness?: number;
        stripType?: string;
    }): void;
    render(pixels: Uint32Array): void;
    reset(): void;
}

/**
 * Mock LED controller for development on non-Pi systems.
 */
class MockLedController implements Ws281x {
    private ledCount = 0;
    private brightness = 255;
    private lastLogTime = 0;
    private frameCount = 0;

    configure(options: { leds: number; brightness?: number }): void {
        this.ledCount = options.leds;
        this.brightness = options.brightness ?? 255;
        console.log(`[MockLED] Configured: ${this.ledCount} LEDs, brightness: ${this.brightness}`);
    }

    render(_pixels: Uint32Array): void {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastLogTime;

        // Log average FPS every 30 seconds
        if (elapsed >= 30000) {
            const avgFps = Math.round(this.frameCount / (elapsed / 1000));
            console.log(`[MockLED] Avg FPS: ${avgFps}`);
            this.frameCount = 0;
            this.lastLogTime = now;
        }
    }

    reset(): void {
        console.log('[MockLED] Reset - all LEDs off');
    }
}

/**
 * LED Controller - Hardware abstraction layer for WS281x LED strips.
 * Automatically uses mock mode when real hardware is unavailable.
 */
export class LedController {
    private ws281x: Ws281x;
    private pixels: Uint32Array;
    private _brightness: number;
    public readonly ledCount: number;
    public readonly isMock: boolean;

    constructor() {
        this.ledCount = LED_CONFIG.leds;
        this.pixels = new Uint32Array(this.ledCount);
        this._brightness = LED_CONFIG.brightness;

        // Try to load real hardware driver
        let realWs281x: Ws281x | null = null;
        try {
            // Dynamic import for optional dependency
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            realWs281x = require('rpi-ws281x') as Ws281x;
            this.isMock = false;
            console.log('[LED] Using real rpi-ws281x hardware driver');
        } catch {
            this.isMock = true;
            console.log('[LED] Hardware unavailable, using mock controller');
        }

        this.ws281x = realWs281x ?? new MockLedController();

        // Configure the strip
        this.ws281x.configure({
            leds: LED_CONFIG.leds,
            gpio: LED_CONFIG.gpio,
            dma: LED_CONFIG.dma,
            brightness: LED_CONFIG.brightness,
            stripType: LED_CONFIG.stripType,
        });
    }

    /** Get current brightness (0-255) */
    get brightness(): number {
        return this._brightness;
    }

    /** Set brightness (0-255) - requires reconfigure on real hardware */
    set brightness(value: number) {
        this._brightness = Math.max(0, Math.min(255, value));

        // Reconfigure to apply brightness
        this.ws281x.configure({
            leds: LED_CONFIG.leds,
            gpio: LED_CONFIG.gpio,
            dma: LED_CONFIG.dma,
            brightness: this._brightness,
            stripType: LED_CONFIG.stripType,
        });
    }

    /** Set a single pixel color (0xRRGGBB) */
    setPixel(index: number, color: number): void {
        if (index >= 0 && index < this.ledCount) {
            this.pixels[index] = color;
        }
    }

    /** Set all pixels to the same color */
    fill(color: number): void {
        this.pixels.fill(color);
    }

    /** Set all pixels from an array */
    setAll(colors: Uint32Array): void {
        if (colors.length === this.ledCount) {
            this.pixels.set(colors);
        }
    }

    /** Get the pixel buffer for direct manipulation */
    getBuffer(): Uint32Array {
        return this.pixels;
    }

    /** Render current pixel buffer to hardware */
    render(): void {
        this.ws281x.render(this.pixels);
    }

    /** Turn off all LEDs and reset */
    clear(): void {
        this.pixels.fill(0);
        this.ws281x.render(this.pixels);
    }

    /** Shutdown and cleanup */
    shutdown(): void {
        this.ws281x.reset();
    }
}

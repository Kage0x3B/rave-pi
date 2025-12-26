import { readFileSync } from 'fs';
import { LED_CONFIG } from './config.js';

/** Check if running on a Raspberry Pi */
function isRaspberryPi(): boolean {
    if (process.platform !== 'linux') return false;
    try {
        const model = readFileSync('/sys/firmware/devicetree/base/model', 'utf8');
        return model.includes('Raspberry Pi');
    } catch {
        return false;
    }
}

/** Interface matching rpi-ws281x */
interface Ws281x {
    configure(options: { leds: number; gpio?: number; dma?: number; brightness?: number; stripType?: string }): void;
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

    private constructor(ws281x: Ws281x, isMock: boolean) {
        this.ledCount = LED_CONFIG.leds;
        this.pixels = new Uint32Array(this.ledCount);
        this._brightness = LED_CONFIG.brightness;
        this.ws281x = ws281x;
        this.isMock = isMock;

        // Configure the strip
        this.ws281x.configure({
            leds: LED_CONFIG.leds,
            gpio: LED_CONFIG.gpio,
            dma: LED_CONFIG.dma,
            brightness: LED_CONFIG.brightness,
            stripType: LED_CONFIG.stripType
        });
    }

    /** Initialize and create a new LedController instance */
    static async init(): Promise<LedController> {
        let ws281x: Ws281x;
        let isMock: boolean;

        if (!isRaspberryPi()) {
            ws281x = new MockLedController();
            isMock = true;
            console.log('[LED] Not a Raspberry Pi, using mock controller');
        } else {
            try {
                const module = await import('rpi-ws281x');
                ws281x = module.default as Ws281x;
                isMock = false;
                console.log('[LED] Using real rpi-ws281x hardware driver');
            } catch (err) {
                ws281x = new MockLedController();
                isMock = true;
                console.log('[LED] Failed to load rpi-ws281x, using mock controller:', err);
            }
        }

        return new LedController(ws281x, isMock);
    }

    /** Get current brightness (0-255) */
    get brightness(): number {
        return this._brightness;
    }

    /** Set brightness (0-255) - applied via software scaling in render() */
    set brightness(value: number) {
        this._brightness = Math.max(0, Math.min(255, value));
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

    /** Render current pixel buffer to hardware (applies software brightness scaling) */
    render(): void {
        if (this._brightness === 255) {
            this.ws281x.render(this.pixels);
        } else {
            const scaled = new Uint32Array(this.ledCount);
            const scale = this._brightness / 255;
            for (let i = 0; i < this.ledCount; i++) {
                const pixel = this.pixels[i];
                const r = Math.round(((pixel >> 16) & 0xff) * scale);
                const g = Math.round(((pixel >> 8) & 0xff) * scale);
                const b = Math.round((pixel & 0xff) * scale);
                scaled[i] = (r << 16) | (g << 8) | b;
            }
            this.ws281x.render(scaled);
        }
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

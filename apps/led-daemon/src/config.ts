/** LED strip hardware configuration */
export const LED_CONFIG = {
    /** Number of LEDs in the strip */
    leds: 202,
    /** GPIO pin (19 for channel 1) */
    gpio: 19,
    /** DMA channel (10 is safe) */
    dma: 10,
    /** Initial brightness (0-255) */
    brightness: 255,
    /** Color order - common for WS2812B */
    stripType: 'grb' as const,
};

/** Server configuration */
export const SERVER_CONFIG = {
    /** HTTP port for API */
    port: 3001,
    /** Host to bind to */
    host: '127.0.0.1',
};

/** Animation configuration */
export const ANIMATION_CONFIG = {
    /** Target frames per second */
    targetFps: 30,
    /** Frame interval in milliseconds */
    frameInterval: 1000 / 30,
};

/** State persistence configuration */
export const STATE_CONFIG = {
    /** Path to state file */
    statePath: './state.json',
    /** Debounce delay for state saves (ms) */
    saveDebounce: 1000,
};

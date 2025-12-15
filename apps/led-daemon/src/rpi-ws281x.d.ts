declare module 'rpi-ws281x' {
    interface Ws281xConfig {
        leds: number;
        gpio?: number;
        dma?: number;
        brightness?: number;
        stripType?: string;
    }

    const ws281x: {
        configure(options: Ws281xConfig): void;
        render(pixels: Uint32Array): void;
        reset(): void;
    };

    export default ws281x;
}

/** RGB color with values 0-255 */
export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/** HSL color with h: 0-360, s: 0-100, l: 0-100 */
export interface HslColor {
    h: number;
    s: number;
    l: number;
}

/** Color can be specified as RGB or HSL */
export type Color = RgbColor | HslColor;

/** Check if color is RGB */
export function isRgbColor(color: Color): color is RgbColor {
    return 'r' in color && 'g' in color && 'b' in color;
}

/** Check if color is HSL */
export function isHslColor(color: Color): color is HslColor {
    return 'h' in color && 's' in color && 'l' in color;
}

/** Convert HSL to RGB */
export function hslToRgb(hsl: HslColor): RgbColor {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
        const gray = Math.round(l * 255);
        return { r: gray, g: gray, b: gray };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
}

/** Convert RGB to HSL */
export function rgbToHsl(rgb: RgbColor): HslColor {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
        return { h: 0, s: 0, l: Math.round(l * 100) };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h: number;
    switch (max) {
        case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
        case g:
            h = ((b - r) / d + 2) / 6;
            break;
        default:
            h = ((r - g) / d + 4) / 6;
            break;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

/** Convert RGB to 32-bit integer (0x00RRGGBB) */
export function rgbToInt(rgb: RgbColor): number {
    return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
}

/** Convert 32-bit integer to RGB */
export function intToRgb(color: number): RgbColor {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

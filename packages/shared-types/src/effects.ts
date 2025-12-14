import type { RgbColor } from './color.js';

/** Parameter types for effect configuration */
export type ParamType = 'number' | 'color' | 'boolean' | 'select';

/** Base parameter schema */
export interface BaseParamSchema {
    name: string;
    label: string;
    description?: string;
}

/** Number parameter with min/max/step */
export interface NumberParamSchema extends BaseParamSchema {
    type: 'number';
    default: number;
    min: number;
    max: number;
    step?: number;
}

/** Color parameter */
export interface ColorParamSchema extends BaseParamSchema {
    type: 'color';
    default: RgbColor;
}

/** Boolean parameter */
export interface BooleanParamSchema extends BaseParamSchema {
    type: 'boolean';
    default: boolean;
}

/** Select parameter with options */
export interface SelectParamSchema extends BaseParamSchema {
    type: 'select';
    default: string;
    options: { value: string; label: string }[];
}

/** Union of all parameter schemas */
export type ParamSchema = NumberParamSchema | ColorParamSchema | BooleanParamSchema | SelectParamSchema;

/** Effect parameter values (runtime) */
export type EffectParams = Record<string, number | RgbColor | boolean | string>;

/** Effect metadata for UI display */
export interface EffectInfo {
    name: string;
    label: string;
    description: string;
    icon?: string;
    params: ParamSchema[];
}

/** Built-in effect names */
export const BUILTIN_EFFECTS = [
    'solid',
    'rainbow',
    'breathing',
    'color-wipe',
    'strobe',
    'fire',
    'plasma',
    'theater-chase',
    'comet',
    'sparkle',
] as const;

export type BuiltinEffectName = (typeof BUILTIN_EFFECTS)[number];

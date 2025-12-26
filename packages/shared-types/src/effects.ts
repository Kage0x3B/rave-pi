import type { RgbColor } from './color.js';

/** RGB color as a tuple [r, g, b] where each value is 0-255 */
export type RgbTuple = [number, number, number];

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

/** Color parameter - stored as array of RGB tuples */
export interface ColorParamSchema extends BaseParamSchema {
    type: 'color';
    /** Default colors - array of [r, g, b] tuples */
    default: RgbTuple[];
    /** Allow user to add/remove multiple colors */
    multipleColors?: boolean;
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
export type EffectParams = Record<string, number | RgbTuple[] | boolean | string>;

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
    'sparkle'
] as const;

export type BuiltinEffectName = (typeof BUILTIN_EFFECTS)[number];

/** Effect info with JS source code for browser execution */
export interface EffectWithSource extends EffectInfo {
    /** The JavaScript source code of the effect */
    source: string;
    /** Whether this is a built-in effect (cannot be edited) */
    isBuiltin: boolean;
}

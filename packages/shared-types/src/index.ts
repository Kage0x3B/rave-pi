// Color types and utilities
export type { RgbColor, HslColor, Color } from './color.js';
export { isRgbColor, isHslColor, hslToRgb, rgbToHsl, rgbToInt, intToRgb } from './color.js';

// Effect types
export type {
    RgbTuple,
    ParamType,
    ParamSchema,
    NumberParamSchema,
    ColorParamSchema,
    BooleanParamSchema,
    SelectParamSchema,
    EffectParams,
    EffectInfo,
    EffectWithSource,
    BuiltinEffectName
} from './effects.js';
export { BUILTIN_EFFECTS } from './effects.js';

// Effect base class and interface
export type { Effect } from './effect-base.js';
export { BaseEffect } from './effect-base.js';

// State types
export type { LedState, DaemonStatus } from './state.js';

// API types
export type {
    SetPowerRequest,
    SetBrightnessRequest,
    SetColorRequest,
    SetEffectRequest,
    SaveSceneRequest,
    SaveEffectRequest,
    ApiResponse,
    HealthResponse,
    StateResponse,
    EffectsResponse,
    ScenesResponse,
    Scene
} from './api.js';

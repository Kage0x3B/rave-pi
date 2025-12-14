// Color types and utilities
export type { RgbColor, HslColor, Color } from './color.js';
export { isRgbColor, isHslColor, hslToRgb, rgbToHsl, rgbToInt, intToRgb } from './color.js';

// Effect types
export type {
    ParamType,
    ParamSchema,
    NumberParamSchema,
    ColorParamSchema,
    BooleanParamSchema,
    SelectParamSchema,
    EffectParams,
    EffectInfo,
    BuiltinEffectName,
} from './effects.js';
export { BUILTIN_EFFECTS } from './effects.js';

// State types
export type { LedState, DaemonStatus } from './state.js';

// API types
export type {
    SetPowerRequest,
    SetBrightnessRequest,
    SetColorRequest,
    SetEffectRequest,
    SaveSceneRequest,
    ApiResponse,
    HealthResponse,
    StateResponse,
    EffectsResponse,
    ScenesResponse,
    Scene,
} from './api.js';

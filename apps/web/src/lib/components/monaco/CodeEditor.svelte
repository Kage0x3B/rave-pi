<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import loader from '@monaco-editor/loader';
    import type { editor } from 'monaco-editor';

    interface Props {
        value: string;
        onchange?: (value: string) => void;
    }

    let { value = $bindable(), onchange }: Props = $props();

    let container: HTMLDivElement;
    let monacoEditor: editor.IStandaloneCodeEditor | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let monaco: any;

    // Effect type definitions for JSDoc autocomplete
    const effectTypeDefs = `
/**
 * RGB color with values 0-255
 * @typedef {Object} RgbColor
 * @property {number} r - Red channel (0-255)
 * @property {number} g - Green channel (0-255)
 * @property {number} b - Blue channel (0-255)
 */

/**
 * Parameter schema types
 * @typedef {'number' | 'color' | 'boolean' | 'select'} ParamType
 */

/**
 * Number parameter schema
 * @typedef {Object} NumberParamSchema
 * @property {'number'} type
 * @property {string} name
 * @property {string} label
 * @property {string} [description]
 * @property {number} default
 * @property {number} min
 * @property {number} max
 * @property {number} [step]
 */

/**
 * Color parameter schema
 * @typedef {Object} ColorParamSchema
 * @property {'color'} type
 * @property {string} name
 * @property {string} label
 * @property {string} [description]
 * @property {RgbColor} default
 */

/**
 * Boolean parameter schema
 * @typedef {Object} BooleanParamSchema
 * @property {'boolean'} type
 * @property {string} name
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} default
 */

/**
 * Select parameter schema
 * @typedef {Object} SelectParamSchema
 * @property {'select'} type
 * @property {string} name
 * @property {string} label
 * @property {string} [description]
 * @property {string} default
 * @property {Array<{value: string, label: string}>} options
 */

/**
 * Effect metadata for UI display
 * @typedef {Object} EffectInfo
 * @property {string} name - Unique effect identifier
 * @property {string} label - Display name
 * @property {string} description - Effect description
 * @property {string} [icon] - Optional icon
 * @property {Array<NumberParamSchema | ColorParamSchema | BooleanParamSchema | SelectParamSchema>} params - Parameter schemas
 */

/**
 * Effect parameter values
 * @typedef {Object.<string, number | RgbColor | boolean | string>} EffectParams
 */

/**
 * Base class for LED effects. Extend this to create custom effects.
 * @abstract
 */
class BaseEffect {
    /**
     * Effect metadata - must be implemented by subclass
     * @abstract
     * @type {EffectInfo}
     */
    info;

    /**
     * Number of LEDs
     * @protected
     * @type {number}
     */
    ledCount = 0;

    /**
     * Current effect parameters
     * @protected
     * @type {EffectParams}
     */
    params = {};

    /**
     * Base color for color-based effects
     * @protected
     * @type {RgbColor}
     */
    color = { r: 255, g: 0, b: 100 };

    /**
     * Pixel buffer - each pixel is a 32-bit integer (0x00RRGGBB)
     * @protected
     * @type {Uint32Array}
     */
    pixels = new Uint32Array(0);

    /**
     * Initialize effect with LED count
     * @param {number} ledCount - Number of LEDs
     * @param {EffectParams} [params] - Initial parameters
     */
    init(ledCount, params) {}

    /**
     * Update effect parameters
     * @param {EffectParams} params - Parameters to update
     */
    setParams(params) {}

    /**
     * Set the base color
     * @param {RgbColor} color - New color
     */
    setColor(color) {}

    /**
     * Generate next frame - must be implemented by subclass
     * @abstract
     * @param {number} frame - Current frame number
     * @param {number} deltaTime - Time since last frame in ms
     * @returns {Uint32Array} Pixel buffer
     */
    tick(frame, deltaTime) {}

    /**
     * Cleanup when effect is stopped
     */
    dispose() {}

    /**
     * Convert RGB to 32-bit integer
     * @protected
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {number} 32-bit color
     */
    rgbToInt(r, g, b) {}

    /**
     * Get parameter as number
     * @protected
     * @param {string} name - Parameter name
     * @param {number} [fallback=0] - Default value
     * @returns {number}
     */
    getNumber(name, fallback) {}

    /**
     * Get parameter as color
     * @protected
     * @param {string} name - Parameter name
     * @returns {RgbColor}
     */
    getColor(name) {}

    /**
     * Get parameter as boolean
     * @protected
     * @param {string} name - Parameter name
     * @param {boolean} [fallback=false] - Default value
     * @returns {boolean}
     */
    getBoolean(name, fallback) {}
}
`;

    onMount(async () => {
        // Import monaco-editor directly to get full language support
        const monacoModule = await import('monaco-editor');
        loader.config({ monaco: monacoModule.default });
        monaco = await loader.init();

        // Try to configure JavaScript language defaults for autocomplete
        // This may not be available depending on the Monaco build
        try {
            if (monaco.languages.javascript?.javascriptDefaults) {
                monaco.languages.javascript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    allowNonTsExtensions: true,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    module: monaco.languages.typescript.ModuleKind.ESNext,
                    noEmit: true,
                    checkJs: true,
                    allowJs: true
                });

                // Add effect type definitions for autocomplete
                monaco.languages.javascript.javascriptDefaults.addExtraLib(
                    effectTypeDefs,
                    'file:///effect-types.d.js'
                );
            }
        } catch (e) {
            console.warn('Could not configure JavaScript language defaults:', e);
        }

        // Create editor
        const ed = monaco.editor.create(container, {
            value,
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            folding: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true
        });
        monacoEditor = ed;

        // Listen for changes
        ed.onDidChangeModelContent(() => {
            const newValue = ed.getValue();
            value = newValue;
            onchange?.(newValue);
        });
    });

    onDestroy(() => {
        monaco?.editor.getModels().forEach((model: editor.ITextModel) => model.dispose());
        monacoEditor?.dispose();
    });

    // Update editor when value changes externally
    $effect(() => {
        if (monacoEditor && monacoEditor.getValue() !== value) {
            monacoEditor.setValue(value);
        }
    });
</script>

<div bind:this={container} class="h-full w-full"></div>

<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import type { ParamSchema, RgbColor } from '@ravepi/shared-types';

    let localParams = $state<Record<string, unknown>>({});
    let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

    // Sync local params when effect changes
    $effect(() => {
        localParams = { ...ledStore.state.effectParams };
    });

    function handleNumberInput(param: ParamSchema, e: Event) {
        if (param.type !== 'number') return;

        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);
        localParams[param.name] = value;

        // Debounce API calls
        if (debounceTimers[param.name]) clearTimeout(debounceTimers[param.name]);
        debounceTimers[param.name] = setTimeout(() => {
            ledStore.setEffectParams({ [param.name]: value });
        }, 100);
    }

    function handleBooleanInput(param: ParamSchema, e: Event) {
        if (param.type !== 'boolean') return;

        const target = e.target as HTMLInputElement;
        const value = target.checked;
        localParams[param.name] = value;
        ledStore.setEffectParams({ [param.name]: value });
    }

    function handleSelectInput(param: ParamSchema, e: Event) {
        if (param.type !== 'select') return;

        const target = e.target as HTMLSelectElement;
        const value = target.value;
        localParams[param.name] = value;
        ledStore.setEffectParams({ [param.name]: value });
    }

    function getParamValue(name: string, defaultValue: unknown): unknown {
        return localParams[name] ?? defaultValue;
    }

    function rgbToHex(color: RgbColor): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }

    function hexToRgb(hex: string): RgbColor {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 255, g: 255, b: 255 };
    }

    function handleColorInput(param: ParamSchema, e: Event) {
        if (param.type !== 'color') return;

        const target = e.target as HTMLInputElement;
        const color = hexToRgb(target.value);
        localParams[param.name] = color;

        if (debounceTimers[param.name]) clearTimeout(debounceTimers[param.name]);
        debounceTimers[param.name] = setTimeout(() => {
            ledStore.setEffectParams({ [param.name]: color });
        }, 100);
    }

    const currentEffect = $derived(ledStore.currentEffect);
    const hasParams = $derived(currentEffect && currentEffect.params.length > 0);
</script>

{#if hasParams && currentEffect}
    <div class="flex flex-col gap-4">
        <span class="text-lg font-semibold">Effect Settings</span>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each currentEffect.params as param}
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-medium">{param.label}</span>
                        {#if param.description}
                            <span class="label-text-alt text-base-content/60">{param.description}</span>
                        {/if}
                    </label>

                    {#if param.type === 'number'}
                        <div class="flex items-center gap-2">
                            <input
                                type="range"
                                min={param.min}
                                max={param.max}
                                step={param.step ?? 1}
                                value={getParamValue(param.name, param.default) as number}
                                oninput={(e) => handleNumberInput(param, e)}
                                class="range range-sm range-secondary flex-1"
                            />
                            <span class="badge badge-outline w-16 justify-center">
                                {getParamValue(param.name, param.default)}
                            </span>
                        </div>
                    {:else if param.type === 'boolean'}
                        <input
                            type="checkbox"
                            checked={getParamValue(param.name, param.default) as boolean}
                            onchange={(e) => handleBooleanInput(param, e)}
                            class="toggle toggle-secondary"
                        />
                    {:else if param.type === 'select'}
                        <select
                            class="select select-bordered select-sm"
                            value={getParamValue(param.name, param.default) as string}
                            onchange={(e) => handleSelectInput(param, e)}
                        >
                            {#each param.options as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    {:else if param.type === 'color'}
                        <input
                            type="color"
                            value={rgbToHex(getParamValue(param.name, param.default) as RgbColor)}
                            onchange={(e) => handleColorInput(param, e)}
                            class="w-full h-10 rounded cursor-pointer"
                        />
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

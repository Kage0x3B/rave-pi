<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import type { ParamSchema, RgbColor } from '@ravepi/shared-types';
    import { Switch, Slider } from '@skeletonlabs/skeleton-svelte';

    let localParams = $state<Record<string, unknown>>({});
    let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

    // Sync local params when effect changes
    $effect(() => {
        localParams = { ...ledStore.state.effectParams };
    });

    function handleNumberChange(param: ParamSchema, details: { value: number[] }) {
        if (param.type !== 'number') return;

        const value = details.value[0];
        localParams[param.name] = value;

        // Debounce API calls
        if (debounceTimers[param.name]) clearTimeout(debounceTimers[param.name]);
        debounceTimers[param.name] = setTimeout(() => {
            ledStore.setEffectParams({ [param.name]: value });
        }, 100);
    }

    function handleBooleanChange(param: ParamSchema, details: { checked: boolean }) {
        if (param.type !== 'boolean') return;

        localParams[param.name] = details.checked;
        ledStore.setEffectParams({ [param.name]: details.checked });
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
        <span class="text-lg font-semibold text-surface-100">Effect Settings</span>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each currentEffect.params as param}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-surface-200">{param.label}</span>
                        {#if param.description}
                            <span class="text-xs text-surface-400">{param.description}</span>
                        {/if}
                    </div>

                    {#if param.type === 'number'}
                        <div class="flex items-center gap-3">
                            <div class="flex-1">
                                <Slider
                                    name={param.name}
                                    value={[getParamValue(param.name, param.default) as number]}
                                    onValueChange={(details) => handleNumberChange(param, details)}
                                    min={param.min}
                                    max={param.max}
                                    step={param.step ?? 1}
                                />
                            </div>
                            <span class="badge badge-outline w-16 text-center">
                                {getParamValue(param.name, param.default)}
                            </span>
                        </div>
                    {:else if param.type === 'boolean'}
                        <Switch
                            name={param.name}
                            checked={getParamValue(param.name, param.default) as boolean}
                            onCheckedChange={(details) => handleBooleanChange(param, details)}
                        />
                    {:else if param.type === 'select'}
                        <select
                            class="select"
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
                            class="w-full h-10 rounded-lg cursor-pointer border-2 border-surface-600 bg-transparent"
                        />
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

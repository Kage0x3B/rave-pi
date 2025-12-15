<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import type { RgbColor } from '@ravepi/shared-types';

    let localColor = $state<RgbColor>({ ...ledStore.state.color });
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Sync local value when store changes
    $effect(() => {
        localColor = { ...ledStore.state.color };
    });

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
            : { r: 255, g: 0, b: 100 };
    }

    function handleColorChange(e: Event) {
        const target = e.target as HTMLInputElement;
        localColor = hexToRgb(target.value);

        // Debounce API calls
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            ledStore.setColor(localColor);
        }, 100);
    }

    function handleRgbInput(channel: 'r' | 'g' | 'b', e: Event) {
        const target = e.target as HTMLInputElement;
        const value = Math.max(0, Math.min(255, parseInt(target.value) || 0));
        localColor = { ...localColor, [channel]: value };

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            ledStore.setColor(localColor);
        }, 200);
    }

    const hexColor = $derived(rgbToHex(localColor));

    // Preset colors
    const presets: RgbColor[] = [
        { r: 255, g: 0, b: 100 }, // Pink
        { r: 255, g: 0, b: 0 }, // Red
        { r: 255, g: 165, b: 0 }, // Orange
        { r: 255, g: 255, b: 0 }, // Yellow
        { r: 0, g: 255, b: 0 }, // Green
        { r: 0, g: 255, b: 255 }, // Cyan
        { r: 0, g: 0, b: 255 }, // Blue
        { r: 128, g: 0, b: 255 }, // Purple
        { r: 255, g: 255, b: 255 }, // White
    ];

    function selectPreset(color: RgbColor) {
        localColor = { ...color };
        ledStore.setColor(color);
    }
</script>

<div class="flex flex-col gap-4">
    <span class="text-lg font-semibold text-surface-100">Color</span>

    <!-- Color picker -->
    <div class="flex items-center gap-4">
        <input
            type="color"
            value={hexColor}
            onchange={handleColorChange}
            class="w-16 h-16 rounded-lg cursor-pointer border-2 border-surface-600 bg-transparent"
            aria-label="Color picker"
        />
        <div
            class="w-16 h-16 rounded-lg border-2 border-surface-600"
            style="background-color: {hexColor}"
        ></div>
    </div>

    <!-- RGB inputs -->
    <div class="grid grid-cols-3 gap-2">
        <div class="flex flex-col">
            <label for="color-r" class="text-xs text-error-400 font-semibold mb-1">R</label>
            <input
                id="color-r"
                type="number"
                min="0"
                max="255"
                value={localColor.r}
                oninput={(e) => handleRgbInput('r', e)}
                class="input input-sm w-full"
            />
        </div>
        <div class="flex flex-col">
            <label for="color-g" class="text-xs text-success-400 font-semibold mb-1">G</label>
            <input
                id="color-g"
                type="number"
                min="0"
                max="255"
                value={localColor.g}
                oninput={(e) => handleRgbInput('g', e)}
                class="input input-sm w-full"
            />
        </div>
        <div class="flex flex-col">
            <label for="color-b" class="text-xs text-tertiary-400 font-semibold mb-1">B</label>
            <input
                id="color-b"
                type="number"
                min="0"
                max="255"
                value={localColor.b}
                oninput={(e) => handleRgbInput('b', e)}
                class="input input-sm w-full"
            />
        </div>
    </div>

    <!-- Presets -->
    <div class="flex flex-wrap gap-2">
        {#each presets as preset}
            <button
                class="w-8 h-8 rounded-full border-2 border-surface-600 hover:scale-110 hover:border-surface-400 transition-all"
                style="background-color: rgb({preset.r}, {preset.g}, {preset.b})"
                onclick={() => selectPreset(preset)}
                title="RGB({preset.r}, {preset.g}, {preset.b})"
            ></button>
        {/each}
    </div>
</div>

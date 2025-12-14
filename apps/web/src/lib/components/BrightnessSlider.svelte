<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    let localValue = $state(ledStore.state.brightness);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Sync local value when store changes
    $effect(() => {
        localValue = ledStore.state.brightness;
    });

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        localValue = parseInt(target.value);

        // Debounce API calls
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            ledStore.setBrightness(localValue);
        }, 100);
    }

    const percentage = $derived(Math.round((localValue / 255) * 100));
</script>

<div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">Brightness</span>
        <span class="badge badge-primary">{percentage}%</span>
    </div>
    <input
        type="range"
        min="0"
        max="255"
        value={localValue}
        oninput={handleInput}
        class="range range-primary"
    />
</div>

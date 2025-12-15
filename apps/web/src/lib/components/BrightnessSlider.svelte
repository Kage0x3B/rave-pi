<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import { Slider } from '@skeletonlabs/skeleton-svelte';

    let localValue = $state(ledStore.state.brightness);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Sync local value when store changes
    $effect(() => {
        localValue = ledStore.state.brightness;
    });

    function handleChange(details: { value: number[] }) {
        localValue = details.value[0];

        // Debounce API calls
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            ledStore.setBrightness(localValue);
        }, 100);
    }

    const percentage = $derived(Math.round((localValue / 255) * 100));
</script>

<div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-surface-100">Brightness</span>
        <span class="badge badge-primary">{percentage}%</span>
    </div>
    <Slider
        name="brightness"
        value={[localValue]}
        onValueChange={handleChange}
        max={255}
        step={1}
    />
</div>

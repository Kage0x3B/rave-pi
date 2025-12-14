<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    const effectIcons: Record<string, string> = {
        solid: '⬛',
        rainbow: '🌈',
        breathing: '💨',
        'color-wipe': '🎨',
        strobe: '⚡',
        fire: '🔥',
        plasma: '🌀',
        'theater-chase': '🎭',
        comet: '☄️',
        sparkle: '✨',
        christmas: '🎄',
    };

    function selectEffect(name: string) {
        ledStore.setEffect(name);
    }
</script>

<div class="flex flex-col gap-4">
    <span class="text-lg font-semibold">Effect</span>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {#each ledStore.effects as effect}
            <button
                class="btn btn-lg flex flex-col h-auto py-4 {ledStore.state.effect === effect.name
                    ? 'btn-primary'
                    : 'btn-ghost bg-base-200'}"
                onclick={() => selectEffect(effect.name)}
            >
                <span class="text-2xl">{effectIcons[effect.name] || '🎯'}</span>
                <span class="text-xs font-medium">{effect.label}</span>
            </button>
        {/each}
    </div>
</div>

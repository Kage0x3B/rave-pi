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
    <span class="text-lg font-semibold text-surface-100">Effect</span>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {#each ledStore.effects as effect}
            <button
                class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200
                    {ledStore.state.effect === effect.name
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-surface-700/50 text-surface-200 hover:bg-surface-600/50'}"
                onclick={() => selectEffect(effect.name)}
            >
                <span class="text-2xl">{effectIcons[effect.name] || '🎯'}</span>
                <span class="text-xs font-medium">{effect.label}</span>
            </button>
        {/each}
    </div>
</div>

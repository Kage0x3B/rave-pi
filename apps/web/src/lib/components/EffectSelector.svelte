<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import EffectPreview from './EffectPreview.svelte';
    import CreateEffectModal from './CreateEffectModal.svelte';

    let hoveredEffect = $state<string | null>(null);

    function selectEffect(name: string) {
        ledStore.setEffect(name);
    }
</script>

<div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-surface-100">Effect</span>
        <CreateEffectModal />
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {#each ledStore.effects as effect}
            {@const isSelected = ledStore.state.effect === effect.name}
            {@const isHovered = hoveredEffect === effect.name}
            {@const showCanvas = (isSelected || isHovered) && effect.source}
            <div
                class="relative"
                onmouseenter={() => (hoveredEffect = effect.name)}
                onmouseleave={() => (hoveredEffect = null)}
            >
                <button
                    class="relative w-full flex flex-col items-center justify-center gap-1 p-4 rounded-xl
                           transition-all duration-200 min-h-[80px] overflow-visible
                        {showCanvas ? '' : 'bg-surface-700/50 text-surface-200 hover:bg-surface-600/50'}"
                    onclick={() => selectEffect(effect.name)}
                >
                    {#if showCanvas}
                        <EffectPreview
                            effectData={effect}
                            params={ledStore.state.effectParams}
                        />
                    {/if}
                    <span class="relative z-10 text-xs font-medium drop-shadow-lg {showCanvas ? 'text-white' : ''}">
                        <span class="text-sm">{effect.icon || '🎯'}</span>
                        {effect.label}
                    </span>
                    {#if isSelected}
                        <span class="relative z-10 text-[10px] drop-shadow-lg {showCanvas ? 'text-surface-300' : 'text-surface-400'}">
                            active
                        </span>
                    {/if}
                </button>
                {#if isHovered && effect.source && !effect.isBuiltin}
                    <a
                        href="/edit-effect/{effect.name}"
                        class="absolute top-1 right-1 z-20 p-1.5 rounded-lg bg-surface-800/80 text-surface-300 hover:text-surface-100 hover:bg-surface-700 transition-colors"
                        title="Edit effect"
                        onclick={(e) => e.stopPropagation()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </a>
                {/if}
            </div>
        {/each}
    </div>
</div>

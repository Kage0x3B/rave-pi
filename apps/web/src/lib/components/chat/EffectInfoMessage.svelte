<script lang="ts">
    import type { EffectWithSource } from '@ravepi/shared-types';

    interface Props {
        effect: EffectWithSource;
    }

    let { effect }: Props = $props();

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
        christmas: '🎄'
    };

    const icon = $derived(effect.icon || effectIcons[effect.name] || '🎯');
</script>

<div class="flex gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
    <div class="text-3xl">{icon}</div>
    <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-surface-100">{effect.label}</h3>
        <p class="text-sm text-surface-400 mt-1">{effect.description}</p>
        {#if effect.params.length > 0}
            <div class="flex flex-wrap gap-1 mt-2">
                {#each effect.params as param}
                    <span class="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-300">
                        {param.label}
                    </span>
                {/each}
            </div>
        {/if}
    </div>
</div>

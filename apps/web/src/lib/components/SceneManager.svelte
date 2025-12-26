<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import type { Scene, RgbTuple, EffectWithSource } from '@ravepi/shared-types';
    import EffectPreview from './EffectPreview.svelte';

    let newSceneName = $state('');
    let showSaveInput = $state(false);
    let hoveredSceneId = $state<string | null>(null);

    function getEffectData(effectName: string): EffectWithSource | undefined {
        return ledStore.effects.find((e) => e.name === effectName);
    }

    async function saveScene() {
        if (!newSceneName.trim()) return;

        await ledStore.saveScene(newSceneName.trim());
        newSceneName = '';
        showSaveInput = false;
    }

    function applyScene(id: string) {
        ledStore.applyScene(id);
    }

    function deleteScene(id: string) {
        if (confirm('Delete this scene?')) {
            ledStore.deleteScene(id);
        }
    }

    function tupleToHex(tuple: RgbTuple): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(tuple[0])}${toHex(tuple[1])}${toHex(tuple[2])}`;
    }

    function getEffectIcon(effectName: string): string | undefined {
        return ledStore.effects.find((e) => e.name === effectName)?.icon;
    }

    function extractColors(scene: Scene): RgbTuple[] {
        const colors: RgbTuple[] = [];

        // Extract colors from effectParams
        if (scene.effectParams) {
            for (const value of Object.values(scene.effectParams)) {
                // Check if it's an array of RGB tuples
                if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
                    for (const tuple of value as RgbTuple[]) {
                        if (Array.isArray(tuple) && tuple.length === 3) {
                            colors.push(tuple);
                        }
                    }
                }
            }
        }

        // Fallback to scene.color if no colors found
        if (colors.length === 0 && scene.color) {
            colors.push([scene.color.r, scene.color.g, scene.color.b]);
        }

        return colors.length > 0 ? colors : [[255, 0, 100]];
    }

    function createGradient(colors: RgbTuple[]): string {
        if (colors.length === 1) {
            return tupleToHex(colors[0]);
        }

        // Create a conic gradient for a nice circular effect
        const stops = colors.map((color, i) => {
            const percent = (i / colors.length) * 100;
            return `${tupleToHex(color)} ${percent}%`;
        });
        // Close the loop
        stops.push(`${tupleToHex(colors[0])} 100%`);

        return `conic-gradient(from 0deg, ${stops.join(', ')})`;
    }
</script>

<div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-surface-100">Scenes</span>
        <button
            class="btn btn-sm {showSaveInput ? 'btn-ghost' : 'btn-primary'}"
            onclick={() => (showSaveInput = !showSaveInput)}
        >
            {showSaveInput ? 'Cancel' : '+ Save Current'}
        </button>
    </div>

    {#if showSaveInput}
        <div class="flex gap-2">
            <input
                type="text"
                placeholder="Scene name..."
                class="input flex-1"
                bind:value={newSceneName}
                onkeydown={(e) => e.key === 'Enter' && saveScene()}
            />
            <button class="btn btn-primary" onclick={saveScene} disabled={!newSceneName.trim()}>
                Save
            </button>
        </div>
    {/if}

    {#if ledStore.scenes.length === 0}
        <p class="text-surface-400 text-sm">No saved scenes yet.</p>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each ledStore.scenes as scene}
                {@const colors = extractColors(scene)}
                {@const gradient = createGradient(colors)}
                {@const icon = getEffectIcon(scene.effect)}
                {@const isHovered = hoveredSceneId === scene.id}
                {@const effectData = getEffectData(scene.effect)}
                <div
                    class="card !p-4 relative overflow-hidden"
                    onmouseenter={() => (hoveredSceneId = scene.id)}
                    onmouseleave={() => (hoveredSceneId = null)}
                >
                    {#if isHovered && effectData?.source}
                        <div class="absolute inset-0 opacity-40">
                            {#key scene.id}
                                <EffectPreview
                                    effectData={effectData}
                                    params={scene.effectParams}
                                    ledThicknessH={5}
                                    ledThicknessV={6}
                                />
                            {/key}
                        </div>
                    {/if}
                    <div class="relative z-10 flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-full border-2 border-surface-600 shrink-0 flex items-center justify-center"
                            style="background: {gradient}"
                        >
                            {#if icon}
                                <span class="text-lg" style="filter: drop-shadow(1px 0 0 rgba(0,0,0,0.3)) drop-shadow(-1px 0 0 rgba(0,0,0,0.3)) drop-shadow(0 1px 0 rgba(0,0,0,0.3)) drop-shadow(0 -1px 0 rgba(0,0,0,0.3))">{icon}</span>
                            {/if}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-surface-100 truncate">{scene.name}</h3>
                            <p class="text-xs text-surface-400">
                                {scene.effect} · {Math.round((scene.brightness / 255) * 100)}%
                            </p>
                        </div>
                    </div>
                    <div class="relative z-10 flex justify-end gap-2 mt-3">
                        <button
                            class="btn btn-sm btn-ghost text-error-400 hover:bg-error-500/10"
                            onclick={() => deleteScene(scene.id)}
                        >
                            Delete
                        </button>
                        <button
                            class="btn btn-sm btn-primary"
                            onclick={() => applyScene(scene.id)}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

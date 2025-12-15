<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    let newSceneName = $state('');
    let showSaveInput = $state(false);

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

    function rgbToHex(r: number, g: number, b: number): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
                <div class="card !p-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-full border-2 border-surface-600 shrink-0"
                            style="background-color: {rgbToHex(scene.color.r, scene.color.g, scene.color.b)}"
                        ></div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-surface-100 truncate">{scene.name}</h3>
                            <p class="text-xs text-surface-400">
                                {scene.effect} · {Math.round((scene.brightness / 255) * 100)}%
                            </p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-3">
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

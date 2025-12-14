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
        <span class="text-lg font-semibold">Scenes</span>
        <button class="btn btn-sm btn-primary" onclick={() => (showSaveInput = !showSaveInput)}>
            {showSaveInput ? 'Cancel' : '+ Save Current'}
        </button>
    </div>

    {#if showSaveInput}
        <div class="flex gap-2">
            <input
                type="text"
                placeholder="Scene name..."
                class="input input-bordered flex-1"
                bind:value={newSceneName}
                onkeydown={(e) => e.key === 'Enter' && saveScene()}
            />
            <button class="btn btn-primary" onclick={saveScene} disabled={!newSceneName.trim()}>
                Save
            </button>
        </div>
    {/if}

    {#if ledStore.scenes.length === 0}
        <p class="text-base-content/60 text-sm">No saved scenes yet.</p>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each ledStore.scenes as scene}
                <div class="card bg-base-200 shadow-lg">
                    <div class="card-body p-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full border-2 border-base-content/20"
                                style="background-color: {rgbToHex(scene.color.r, scene.color.g, scene.color.b)}"
                            ></div>
                            <div class="flex-1">
                                <h3 class="font-semibold">{scene.name}</h3>
                                <p class="text-xs text-base-content/60">
                                    {scene.effect} · {Math.round((scene.brightness / 255) * 100)}%
                                </p>
                            </div>
                        </div>
                        <div class="card-actions justify-end mt-2">
                            <button class="btn btn-sm btn-ghost btn-error" onclick={() => deleteScene(scene.id)}>
                                Delete
                            </button>
                            <button class="btn btn-sm btn-primary" onclick={() => applyScene(scene.id)}>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

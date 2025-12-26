<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { ledStore } from '$lib/stores/led.svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';
    import { Progress } from '@skeletonlabs/skeleton-svelte';

    let { children } = $props();

    onMount(() => {
        ledStore.init();

        return () => {
            ledStore.stopPolling();
        };
    });
</script>

<div class="min-h-screen flex flex-col">
    <header class="p-4">
        <StatusBar />
    </header>

    <main class="flex-1 p-4">
        {#if ledStore.loading}
            <div class="flex items-center justify-center h-64">
                <Progress value={null} size="size-12" meterStroke="stroke-primary-500" trackStroke="stroke-surface-700" />
            </div>
        {:else if ledStore.error && !ledStore.connected}
            <div class="card bg-error-500/10 border-error-500/30">
                <div class="flex items-start gap-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 text-error-500 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div class="flex-1">
                        <h3 class="font-bold text-error-400">Connection Failed</h3>
                        <p class="text-sm text-surface-300">{ledStore.error}</p>
                        <p class="text-sm text-surface-400 mt-1">Make sure the LED daemon is running on port 3001.</p>
                    </div>
                    <button class="btn btn-sm btn-ghost text-error-400" onclick={() => ledStore.refresh()}>Retry</button>
                </div>
            </div>
        {:else}
            {@render children()}
        {/if}
    </main>

    <footer class="p-4 text-center text-surface-400 text-sm">
        RavePi LED Controller
    </footer>
</div>

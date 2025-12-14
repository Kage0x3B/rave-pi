<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { ledStore } from '$lib/stores/led.svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';

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
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
        {:else if ledStore.error && !ledStore.connected}
            <div class="alert alert-error">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <div>
                    <h3 class="font-bold">Connection Failed</h3>
                    <p class="text-sm">{ledStore.error}</p>
                    <p class="text-sm mt-1">Make sure the LED daemon is running on port 3001.</p>
                </div>
                <button class="btn btn-sm btn-ghost" onclick={() => ledStore.refresh()}>Retry</button>
            </div>
        {:else}
            {@render children()}
        {/if}
    </main>

    <footer class="p-4 text-center text-base-content/50 text-sm">
        RavePi LED Controller
    </footer>
</div>

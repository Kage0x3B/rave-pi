<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    function formatUptime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }
</script>

<nav class="flex items-center justify-between rounded-xl bg-surface-800/50 backdrop-blur-sm border border-surface-700/50 px-4 py-3">
    <div class="flex items-center gap-2">
        <span class="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            RavePi
        </span>
    </div>
    <div class="flex items-center gap-3">
        {#if ledStore.status}
            <div class="badge badge-outline gap-1.5">
                <span class="text-success-400">●</span>
                {ledStore.status.ledCount} LEDs
            </div>
            <div class="badge badge-outline">
                {ledStore.status.fps} FPS
            </div>
            <div class="badge badge-outline hidden sm:flex">
                {formatUptime(ledStore.status.uptime)}
            </div>
        {/if}
        <div class="badge {ledStore.connected ? 'badge-success' : 'badge-error'}">
            {ledStore.connected ? 'Connected' : 'Disconnected'}
        </div>
    </div>
</nav>

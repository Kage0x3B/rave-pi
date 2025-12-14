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

<div class="navbar bg-base-200 rounded-box shadow-lg">
    <div class="flex-1">
        <span class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            RavePi
        </span>
    </div>
    <div class="flex-none gap-4">
        {#if ledStore.status}
            <div class="badge badge-outline gap-1">
                <span class="text-success">●</span>
                {ledStore.status.ledCount} LEDs
            </div>
            <div class="badge badge-outline">
                {ledStore.status.fps} FPS
            </div>
            <div class="badge badge-outline">
                {formatUptime(ledStore.status.uptime)}
            </div>
        {/if}
        <div class="badge {ledStore.connected ? 'badge-success' : 'badge-error'}">
            {ledStore.connected ? 'Connected' : 'Disconnected'}
        </div>
    </div>
</div>

<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    function toggle() {
        ledStore.setPower(!ledStore.state.power);
    }
</script>

<div class="flex items-center gap-4">
    <span class="text-lg font-semibold text-surface-100">Power</span>
    <button
        type="button"
        role="switch"
        aria-checked={ledStore.state.power}
        aria-label="Toggle power"
        onclick={toggle}
        class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 {ledStore.state.power ? 'bg-primary-500' : 'bg-surface-600'}"
    >
        <span
            class="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 {ledStore.state.power ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
    </button>
    <span class="badge {ledStore.state.power ? 'badge-success' : 'badge-neutral'}">
        {ledStore.state.power ? 'ON' : 'OFF'}
    </span>
</div>

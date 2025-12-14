<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';

    function toggle() {
        ledStore.setPower(!ledStore.state.power);
    }
</script>

<div class="flex items-center gap-4">
    <span class="text-lg font-semibold">Power</span>
    <input
        type="checkbox"
        class="toggle toggle-lg toggle-primary"
        checked={ledStore.state.power}
        onchange={toggle}
    />
    <span class="badge {ledStore.state.power ? 'badge-success' : 'badge-neutral'}">
        {ledStore.state.power ? 'ON' : 'OFF'}
    </span>
</div>

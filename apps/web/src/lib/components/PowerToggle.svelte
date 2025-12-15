<script lang="ts">
    import { ledStore } from '$lib/stores/led.svelte';
    import { Switch } from '@skeletonlabs/skeleton-svelte';

    function toggle(details: { checked: boolean }) {
        ledStore.setPower(details.checked);
    }
</script>

<div class="flex items-center gap-4">
    <span class="text-lg font-semibold text-surface-100">Power</span>
    <Switch
        name="power"
        checked={ledStore.state.power}
        onCheckedChange={toggle}
    />
    <span class="badge {ledStore.state.power ? 'badge-success' : 'badge-neutral'}">
        {ledStore.state.power ? 'ON' : 'OFF'}
    </span>
</div>

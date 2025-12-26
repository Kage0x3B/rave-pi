<script lang="ts">
	import { ledStore } from '$lib/stores/led.svelte';
	import ParamControls from './ParamControls.svelte';

	let localParams = $state<Record<string, unknown>>({});
	let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	let lastEffectName = $state<string | null>(null);
	let lastParamsRef = $state<Record<string, unknown> | null>(null);

	const currentEffect = $derived(ledStore.currentEffect);
	const hasParams = $derived(currentEffect && currentEffect.params.length > 0);

	// Sync local params when effect changes OR when effectParams object is replaced (e.g., scene applied)
	$effect(() => {
		const effectName = ledStore.state.effect;
		const storeParams = ledStore.state.effectParams;

		// Sync if effect changed or if params object was replaced (different reference)
		if (effectName !== lastEffectName || storeParams !== lastParamsRef) {
			lastEffectName = effectName;
			lastParamsRef = storeParams;
			localParams = { ...storeParams };
		}
	});

	function handleChange(name: string, value: unknown) {
		localParams[name] = value;

		// Debounce API calls
		if (debounceTimers[name]) clearTimeout(debounceTimers[name]);
		debounceTimers[name] = setTimeout(() => {
			ledStore.setEffectParams({ [name]: value });
		}, 100);
	}
</script>

{#if hasParams && currentEffect}
	<div class="flex flex-col gap-4">
		<span class="text-lg font-semibold text-surface-100">Effect Settings</span>
		<ParamControls params={currentEffect.params} values={localParams} onchange={handleChange} />
	</div>
{/if}

<script lang="ts">
	import { ledStore } from '$lib/stores/led.svelte';
	import ParamControls from './ParamControls.svelte';

	let localParams = $state<Record<string, unknown>>({});
	let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	let lastEffectName = $state<string | null>(null);

	const currentEffect = $derived(ledStore.currentEffect);
	const hasParams = $derived(currentEffect && currentEffect.params.length > 0);

	// Only sync local params when effect changes, not on every poll
	$effect(() => {
		const effectName = ledStore.state.effect;
		if (effectName !== lastEffectName) {
			lastEffectName = effectName;
			// Reset local params when effect changes
			localParams = { ...ledStore.state.effectParams };
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

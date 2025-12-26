<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import { ledStore } from '$lib/stores/led.svelte';

	let dialogRef: HTMLDialogElement;
	let displayName = $state('');
	let isCreating = $state(false);
	let error = $state<string | null>(null);

	// Convert display name to kebab-case for filename
	function toKebabCase(str: string): string {
		return str
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}

	// Convert display name to PascalCase for class name
	function toPascalCase(str: string): string {
		return str
			.trim()
			.replace(/[^a-zA-Z0-9\s]/g, '')
			.split(/\s+/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('');
	}

	const fileName = $derived(toKebabCase(displayName));
	const className = $derived(toPascalCase(displayName) + 'Effect');
	const isValid = $derived(fileName.length > 0 && className.length > 6);

	// Generate effect template based on solid effect
	function generateTemplate(name: string, label: string, className: string): string {
		return `import { BaseEffect } from '../dist/effect-types.js';

export class ${className} extends BaseEffect {
	info = {
		name: '${name}',
		label: '${label}',
		description: '',
		icon: '✨',
		params: [
			{
				name: 'color',
				label: 'Colors',
				type: 'color',
				default: [[255, 0, 100]],
				multipleColors: true
			}
		]
	};

	tick() {
		const colors = this.getColors('color');
		for (let i = 0; i < this.ledCount; i++) {
			const [r, g, b] = colors[i % colors.length];
			this.pixels[i] = this.rgbToInt(r, g, b);
		}
		return this.pixels;
	}
}

export default ${className};
`;
	}

	export function showModal() {
		dialogRef?.showModal();
	}

	function closeModal() {
		dialogRef?.close();
		displayName = '';
		error = null;
	}

	async function handleCreate() {
		if (!isValid || isCreating) return;

		isCreating = true;
		error = null;

		try {
			const source = generateTemplate(fileName, displayName.trim(), className);
			const result = await api.saveEffect(fileName, source);

			if (result.ok) {
				await ledStore.refresh();
				const targetName = fileName;
				closeModal();
				goto(`/edit-effect/${targetName}`);
			} else {
				error = result.error ?? 'Failed to create effect';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create effect';
		}

		isCreating = false;
	}
</script>

<button type="button" class="btn preset-filled-primary-500 gap-2" onclick={showModal}>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
	</svg>
	New Effect
</button>

<dialog
	bind:this={dialogRef}
	class="rounded-xl bg-surface-800 text-surface-100 w-full max-w-md p-6 shadow-xl m-auto backdrop:bg-surface-950/80 backdrop:backdrop-blur-sm"
>
	<header class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-bold">Create New Effect</h2>
		<button type="button" class="btn-icon preset-tonal" onclick={closeModal}>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</header>

	<p class="text-surface-400 text-sm mb-4">
		Enter a display name for your new LED effect. The filename and class name will be generated automatically.
	</p>

	<div class="space-y-4">
		<div class="space-y-2">
			<label for="effect-name" class="text-sm font-medium text-surface-200">
				Display Name
			</label>
			<input
				id="effect-name"
				type="text"
				bind:value={displayName}
				placeholder="My Cool Effect"
				class="w-full px-4 py-2 rounded-lg bg-surface-700 border border-surface-600 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
				onkeydown={(e) => e.key === 'Enter' && handleCreate()}
			/>
		</div>

		{#if displayName.trim()}
			<div class="text-xs text-surface-400 space-y-1">
				<p><span class="text-surface-300">Filename:</span> {fileName}.js</p>
				<p><span class="text-surface-300">Class:</span> {className}</p>
			</div>
		{/if}

		{#if error}
			<div class="text-sm text-error-400 bg-error-500/10 rounded-lg px-3 py-2">
				{error}
			</div>
		{/if}
	</div>

	<footer class="flex justify-end gap-3 mt-6">
		<button type="button" class="btn preset-tonal" onclick={closeModal}>Cancel</button>
		<button
			type="button"
			class="btn preset-filled-primary-500"
			disabled={!isValid || isCreating}
			onclick={handleCreate}
		>
			{#if isCreating}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Creating...
			{:else}
				Create Effect
			{/if}
		</button>
	</footer>
</dialog>

<style>
	dialog,
	dialog::backdrop {
		--anim-duration: 200ms;
		transition:
			display var(--anim-duration) allow-discrete,
			overlay var(--anim-duration) allow-discrete,
			opacity var(--anim-duration);
		opacity: 0;
	}
	dialog[open],
	dialog[open]::backdrop {
		opacity: 1;
	}
	@starting-style {
		dialog[open],
		dialog[open]::backdrop {
			opacity: 0;
		}
	}
</style>

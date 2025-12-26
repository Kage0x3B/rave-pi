<script lang="ts">
	import type { ParamSchema, ColorParamSchema, RgbTuple } from '@ravepi/shared-types';
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	interface Props {
		params: ParamSchema[];
		values: Record<string, unknown>;
		onchange?: (name: string, value: unknown) => void;
	}

	let { params, values, onchange }: Props = $props();

	// Single color presets
	const SINGLE_COLOR_PRESETS: RgbTuple[] = [
		[255, 0, 0], // Red
		[255, 100, 0], // Orange
		[255, 220, 0], // Yellow
		[0, 255, 0], // Green
		[0, 200, 255], // Cyan
		[0, 100, 255], // Blue
		[150, 0, 255], // Purple
		[255, 0, 150], // Pink
		[255, 255, 255] // White
	];

	// Multi-color palette presets
	const PALETTE_PRESETS: { label: string; colors: RgbTuple[] }[] = [
		{
			label: 'Rainbow',
			colors: [
				[255, 0, 0],
				[255, 127, 0],
				[255, 255, 0],
				[0, 255, 0],
				[0, 0, 255],
				[139, 0, 255]
			]
		},
		{
			label: 'Warm',
			colors: [
				[255, 100, 50],
				[255, 150, 0],
				[255, 200, 100]
			]
		},
		{
			label: 'Cool',
			colors: [
				[0, 150, 255],
				[100, 200, 255],
				[150, 100, 255]
			]
		},
		{
			label: 'Aurora',
			colors: [
				[0, 255, 100],
				[0, 200, 255],
				[100, 0, 255],
				[0, 255, 200]
			]
		},
		{
			label: 'Christmas',
			colors: [
				[255, 0, 0],
				[0, 255, 0],
				[255, 255, 255]
			]
		}
	];

	function getParamValue(name: string, defaultValue: unknown): unknown {
		return values[name] ?? defaultValue;
	}

	function tupleToHex(tuple: RgbTuple): string {
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return `#${toHex(tuple[0])}${toHex(tuple[1])}${toHex(tuple[2])}`;
	}

	function hexToTuple(hex: string): RgbTuple {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [255, 255, 255];
	}

	function handleNumberChange(name: string, details: { value: number[] }) {
		onchange?.(name, details.value[0]);
	}

	function handleBooleanToggle(param: ParamSchema) {
		if (param.type !== 'boolean') return;
		const currentValue = getParamValue(param.name, param.default) as boolean;
		onchange?.(param.name, !currentValue);
	}

	function handleSelectInput(param: ParamSchema, e: Event) {
		if (param.type !== 'select') return;
		const target = e.target as HTMLSelectElement;
		onchange?.(param.name, target.value);
	}

	function handleColorChange(param: ColorParamSchema, index: number, hex: string) {
		const colors = [...(getParamValue(param.name, param.default) as RgbTuple[])];
		colors[index] = hexToTuple(hex);
		onchange?.(param.name, colors);
	}

	function addColor(param: ColorParamSchema) {
		const colors = [...(getParamValue(param.name, param.default) as RgbTuple[])];
		colors.push([255, 255, 255]);
		onchange?.(param.name, colors);
	}

	function removeColor(param: ColorParamSchema, index: number) {
		const colors = [...(getParamValue(param.name, param.default) as RgbTuple[])];
		if (colors.length > 1) {
			colors.splice(index, 1);
			onchange?.(param.name, colors);
		}
	}

	function applyPreset(param: ColorParamSchema, preset: { label: string; colors: RgbTuple[] }) {
		onchange?.(param.name, [...preset.colors]);
	}

	function setSingleColor(param: ColorParamSchema, color: RgbTuple) {
		onchange?.(param.name, [color]);
	}

	function isSameColor(a: RgbTuple, b: RgbTuple): boolean {
		return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
	}
</script>

{#if params.length > 0}
	<div class="flex flex-col gap-4">
		{#each params as param}
			<div class="flex flex-col gap-2">
				<span class="text-xs font-medium text-surface-300">{param.label}</span>

				{#if param.type === 'color'}
					{@const colorParam = param as ColorParamSchema}
					{@const colors = getParamValue(param.name, param.default) as RgbTuple[]}
					{@const currentColor = colors[0] ?? [255, 0, 100]}

					{#if colorParam.multipleColors}
						<!-- Multiple colors mode -->
						<div class="flex flex-col gap-2">
							<div class="flex flex-wrap items-center gap-2">
								{#each colors as color, i}
									<div class="relative group">
										<input
											type="color"
											value={tupleToHex(color)}
											oninput={(e) => handleColorChange(colorParam, i, e.currentTarget.value)}
											class="w-10 h-10 rounded-full cursor-pointer border-2 border-surface-600 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
										/>
										{#if colors.length > 1}
											<button
												type="button"
												onclick={() => removeColor(colorParam, i)}
												class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none"
											>
												&times;
											</button>
										{/if}
									</div>
								{/each}

								<button
									type="button"
									onclick={() => addColor(colorParam)}
									class="w-10 h-10 rounded-full border-2 border-dashed border-surface-500 text-surface-400 hover:border-surface-400 hover:text-surface-300 transition-colors flex items-center justify-center text-xl"
								>
									+
								</button>
							</div>

							<!-- Palette presets -->
							<div class="flex flex-wrap gap-1">
								{#each PALETTE_PRESETS as preset}
									<button
										type="button"
										onclick={() => applyPreset(colorParam, preset)}
										class="px-2 py-0.5 text-xs rounded bg-surface-700 hover:bg-surface-600 text-surface-300 transition-colors"
									>
										{preset.label}
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<!-- Single color mode - preset circles + custom picker -->
						{@const isBackgroundParam = param.name.toLowerCase().includes('background')}
						{@const presets = isBackgroundParam ? [...SINGLE_COLOR_PRESETS, [0, 0, 0] as RgbTuple] : SINGLE_COLOR_PRESETS}
						<div class="flex flex-wrap items-center gap-2">
							{#each presets as presetColor, i}
								{@const isSelected = isSameColor(currentColor, presetColor)}
								{@const isBlack = presetColor[0] === 0 && presetColor[1] === 0 && presetColor[2] === 0}
								<button
									type="button"
									onclick={() => setSingleColor(colorParam, presetColor)}
									class="w-8 h-8 rounded-full border-2 transition-all {isSelected
										? 'border-white scale-110'
										: 'border-surface-600 hover:border-surface-400'} {isBlack ? 'bg-surface-900' : ''}"
									style="background-color: {tupleToHex(presetColor)}"
									title={isBlack ? 'Clear (black)' : ''}
								></button>
							{/each}

							<!-- Custom color picker -->
							<div class="relative">
								<input
									type="color"
									value={tupleToHex(currentColor)}
									oninput={(e) => handleColorChange(colorParam, 0, e.currentTarget.value)}
									class="w-8 h-8 rounded-full cursor-pointer border-2 border-dashed border-surface-500 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
									title="Custom color"
								/>
							</div>
						</div>
					{/if}
				{:else if param.type === 'number'}
					<div class="flex items-center gap-2">
						<div class="flex-1">
							<Slider
								value={[getParamValue(param.name, param.default) as number]}
								onValueChange={(details) => handleNumberChange(param.name, details)}
								min={param.min}
								max={param.max}
								step={param.step ?? 1}
							>
								<Slider.Control>
									<Slider.Track>
										<Slider.Range />
									</Slider.Track>
									<Slider.Thumb index={0}>
										<Slider.HiddenInput />
									</Slider.Thumb>
								</Slider.Control>
							</Slider>
						</div>
						<span class="text-xs text-surface-400 w-8 text-right">
							{getParamValue(param.name, param.default)}
						</span>
					</div>
				{:else if param.type === 'boolean'}
					{@const checked = getParamValue(param.name, param.default) as boolean}
					<button
						type="button"
						onclick={() => handleBooleanToggle(param)}
						class="relative h-6 w-11 rounded-full transition-colors {checked
							? 'bg-primary-500'
							: 'bg-surface-600'}"
					>
						<span
							class="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform {checked
								? 'left-6'
								: 'left-1'}"
						></span>
					</button>
				{:else if param.type === 'select'}
					<select
						class="h-8 px-2 rounded bg-surface-700 border border-surface-600 text-sm text-surface-200"
						value={getParamValue(param.name, param.default) as string}
						onchange={(e) => handleSelectInput(param, e)}
					>
						{#each param.options as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				{/if}
			</div>
		{/each}
	</div>
{/if}

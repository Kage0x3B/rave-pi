<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { EffectWithSource, EffectParams } from '@ravepi/shared-types';
    import { loadEffect } from '$lib/effects/runtime';
    import { EffectRunner, CanvasRenderer } from '$lib/effects/canvas-renderer';

    interface Props {
        effectData?: EffectWithSource;
        params?: EffectParams;
        /** Override source code (for live editing) */
        source?: string;
        /** LED thickness for horizontal edges (top/bottom) */
        ledThicknessH?: number;
        /** LED thickness for vertical edges (left/right) */
        ledThicknessV?: number;
    }

    let { effectData, params, source, ledThicknessH, ledThicknessV }: Props = $props();

    // Use provided source or fall back to effectData.source
    const effectSource = $derived(source ?? effectData?.source ?? '');

    let container: HTMLDivElement;
    let canvasGlow: HTMLCanvasElement;
    let canvasBright: HTMLCanvasElement;
    let canvasOuterGlow: HTMLCanvasElement;

    // Single effect runner with multiple canvas renderers
    let effectRunner: EffectRunner | null = null;
    let rendererGlow: CanvasRenderer | null = null;
    let rendererBright: CanvasRenderer | null = null;
    let rendererOuterGlow: CanvasRenderer | null = null;

    let containerWidth = $state(0);
    let containerHeight = $state(0);

    let currentSource = '';
    let initTimeout: ReturnType<typeof setTimeout> | null = null;

    // Initialize when container size is available
    $effect(() => {
        if (containerWidth > 0 && containerHeight > 0 && canvasGlow && canvasBright && canvasOuterGlow && effectSource) {
            // Reinitialize if source changed or first init
            if (!effectRunner || currentSource !== effectSource) {
                // Capture current params for the async init
                const currentParams = params;
                // Debounce for live editing
                if (initTimeout) clearTimeout(initTimeout);
                initTimeout = setTimeout(() => {
                    initRenderer(currentParams);
                }, currentSource ? 500 : 0); // No delay on first init
            }
        }
    });

    async function initRenderer(initParams?: EffectParams) {
        if (!effectSource) return;

        // Stop existing runner
        effectRunner?.stop();

        currentSource = effectSource;

        // Calculate LED count based on perimeter (~3px per LED for border layout)
        const perimeter = 2 * containerWidth + 2 * containerHeight;
        const ledCount = Math.max(20, Math.floor(perimeter / 3));

        // Set canvas sizes to match container
        canvasGlow.width = containerWidth;
        canvasGlow.height = containerHeight;
        canvasBright.width = containerWidth;
        canvasBright.height = containerHeight;
        canvasOuterGlow.width = containerWidth;
        canvasOuterGlow.height = containerHeight;

        // Create canvas renderers with different options
        const rendererOptions = { ledThicknessH, ledThicknessV };
        rendererGlow = new CanvasRenderer(canvasGlow, { ...rendererOptions, drawBackground: true });
        rendererBright = new CanvasRenderer(canvasBright, { ...rendererOptions, drawBackground: false });
        rendererOuterGlow = new CanvasRenderer(canvasOuterGlow, { ...rendererOptions, drawBackground: false });

        // Create single effect runner and register all canvases
        effectRunner = new EffectRunner(ledCount);
        effectRunner.addCanvas(rendererGlow);
        effectRunner.addCanvas(rendererBright);
        effectRunner.addCanvas(rendererOuterGlow);

        try {
            const EffectClass = await loadEffect(effectSource);
            if (EffectClass) {
                // Create single effect instance and pass params to setEffect
                const instance = new EffectClass();
                effectRunner.setEffect(instance, initParams);
            }
        } catch (err) {
            console.error('[EffectPreview] Failed to load effect:', err);
        }
    }

    onDestroy(() => {
        if (initTimeout) clearTimeout(initTimeout);
        effectRunner?.stop();
    });

    $effect(() => {
        if (params) {
            effectRunner?.updateParams(params);
        }
    });
</script>

<!-- Outer glow layer - bleeds outside button, no background -->
<div class="outer-glow-container">
    <canvas bind:this={canvasOuterGlow} class="led-canvas-outer-glow"></canvas>
</div>

<!-- Main preview - clipped to button -->
<div
    class="led-preview"
    bind:this={container}
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
>
    <!-- Glow layer with background -->
    <canvas bind:this={canvasGlow} class="led-canvas-glow"></canvas>
    <!-- Small blur layer for bright LED center -->
    <canvas bind:this={canvasBright} class="led-canvas-bright"></canvas>
    <!-- Milky glass overlay -->
    <div class="glass-overlay"></div>
</div>

<style>
    .outer-glow-container {
        position: absolute;
        inset: 0;
        overflow: visible;
        pointer-events: none;
        z-index: 0;
    }

    .led-canvas-outer-glow {
        width: 100%;
        height: 100%;
        filter: blur(8px);
        opacity: 0.5;
    }

    .led-preview {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: 0.75rem;
        pointer-events: none;
        z-index: 1;
    }

    .led-canvas-glow {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        filter: blur(12px);
    }

    .led-canvas-bright {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        filter: blur(1px);
    }

    .glass-overlay {
        position: absolute;
        inset: 0;
        background-color: rgba(168, 161, 143, 0.08);
        backdrop-filter: blur(1px);
        pointer-events: none;
    }
</style>

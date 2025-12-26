<script lang="ts">
    import PowerToggle from '$lib/components/PowerToggle.svelte';
    import BrightnessSlider from '$lib/components/BrightnessSlider.svelte';
    import EffectSelector from '$lib/components/EffectSelector.svelte';
    import EffectParams from '$lib/components/EffectParams.svelte';
    import SceneManager from '$lib/components/SceneManager.svelte';
</script>

<div class="max-w-6xl mx-auto space-y-6">
    <!-- Power & Brightness Card -->
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center gap-6">
            <div class="flex-shrink-0">
                <PowerToggle />
            </div>
            <div class="flex-1">
                <BrightnessSlider />
            </div>
        </div>
    </div>

    <!-- Effects Card -->
    <div class="card">
        <EffectSelector />
    </div>

    <!-- Effect Parameters Card -->
    <div class="card">
        <EffectParams />
    </div>

    <!-- Scenes Card -->
    <div class="card">
        <SceneManager />
    </div>
</div>

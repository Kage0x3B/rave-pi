<script lang="ts">
    interface Props {
        error: string;
        onFixWithAi?: () => void;
    }

    let { error, onFixWithAi }: Props = $props();
</script>

<div class="alert alert-error">
    <div class="flex items-start gap-3">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm">Validation Error</h4>
            <pre class="mt-1 text-sm whitespace-pre-wrap break-words font-mono opacity-80 max-h-32 overflow-auto">{error}</pre>
            {#if onFixWithAi}
                <button
                    type="button"
                    onclick={onFixWithAi}
                    class="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors flex items-center gap-1.5"
                >
                    <span>✨</span>
                    Try to fix with AI
                </button>
            {/if}
        </div>
    </div>
</div>

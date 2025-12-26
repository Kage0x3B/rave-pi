<script lang="ts">
	interface Props {
		content: string;
	}

	let { content }: Props = $props();
</script>

<div class="flex gap-3">
	<div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
		<svg class="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
		</svg>
	</div>
	<div class="flex-1 min-w-0">
		<div class="text-xs text-surface-400 mb-1 flex items-center gap-2">
			<span>AI Assistant</span>
			<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span class="text-primary-400">generating...</span>
		</div>
		<div class="rounded-xl bg-surface-700/50 border border-surface-600 p-3 overflow-hidden">
			<pre class="font-mono text-xs text-surface-300 whitespace-pre-wrap break-words max-h-48 overflow-auto">{content}</pre>
		</div>
	</div>
</div>

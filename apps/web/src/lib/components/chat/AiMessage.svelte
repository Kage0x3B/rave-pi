<script lang="ts">
    interface Props {
        content: string;
    }

    let { content }: Props = $props();
</script>

<div class="flex gap-3">
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <span class="text-sm">✨</span>
    </div>
    <div class="flex-1 min-w-0 px-4 py-2 rounded-2xl rounded-bl-sm bg-surface-700/50 text-surface-100">
        <p class="text-sm">{content}</p>
    </div>
</div>

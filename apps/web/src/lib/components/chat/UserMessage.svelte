<script lang="ts">
    interface Props {
        content: string;
    }

    let { content }: Props = $props();
</script>

<div class="flex justify-end">
    <div class="max-w-[80%] px-4 py-2 rounded-2xl rounded-br-sm bg-primary-500 text-white">
        <p class="text-sm">{content}</p>
    </div>
</div>

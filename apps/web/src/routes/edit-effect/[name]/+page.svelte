<script lang="ts">
    import { page } from '$app/stores';
    import { ledStore } from '$lib/stores/led.svelte';
    import EffectPreview from '$lib/components/EffectPreview.svelte';
    import { loadEffect } from '$lib/effects/runtime';
    import { api } from '$lib/api/client';
    import type { EffectParams, ParamSchema } from '@ravepi/shared-types';
    import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
    import ParamControls from '$lib/components/ParamControls.svelte';
    import EffectInfoMessage from '$lib/components/chat/EffectInfoMessage.svelte';
    import UserMessage from '$lib/components/chat/UserMessage.svelte';
    import AiMessage from '$lib/components/chat/AiMessage.svelte';
    import AiStreamingMessage from '$lib/components/chat/AiStreamingMessage.svelte';
    import ValidationMessage from '$lib/components/chat/ValidationMessage.svelte';
    import SuccessMessage from '$lib/components/chat/SuccessMessage.svelte';

    // Tab state
    let activeTab = $state('ai');

    // Lazy load CodeEditor
    let CodeEditor: typeof import('$lib/components/monaco/CodeEditor.svelte').default | null = $state(null);
    $effect(() => {
        if (activeTab === 'code' && !CodeEditor) {
            import('$lib/components/monaco/CodeEditor.svelte').then((m) => {
                CodeEditor = m.default;
            });
        }
    });

    // Chat messages
    type ChatMessage =
        | { type: 'effect-info' }
        | { type: 'user'; content: string }
        | { type: 'ai'; content: string }
        | { type: 'ai-streaming'; content: string }
        | { type: 'validation-error'; error: string }
        | { type: 'success'; message?: string };

    let messages = $state<ChatMessage[]>([{ type: 'effect-info' }]);
    let chatInput = $state('');
    let isAiLoading = $state(false);
    let pendingAiValidation = $state(false);

    // Get effect name from URL
    const effectName = $derived($page.params.name);

    // Find the effect data
    const effectData = $derived(ledStore.effects.find((e) => e.name === effectName));

    let editorValue = $state('');
    let savedValue = $state(''); // Track saved state for dirty checking

    // Sync editor value when effect data loads
    $effect(() => {
        if (effectData?.source && !editorValue) {
            editorValue = effectData.source;
            savedValue = effectData.source;
        }
    });

    // Validation state
    let validationError = $state<string | null>(null);
    let isValidating = $state(false);
    let validationTimeout: ReturnType<typeof setTimeout> | null = null;
    let validatedParams = $state<ParamSchema[] | null>(null);

    // Use validated params if available, otherwise fall back to effectData.params
    const displayParams = $derived(validatedParams ?? effectData?.params ?? []);

    // Save state
    let isSaving = $state(false);
    let saveError = $state<string | null>(null);

    // Derived states
    const hasChanges = $derived(editorValue !== savedValue);
    const isValid = $derived(!validationError && !isValidating);
    const canSave = $derived(hasChanges && isValid && !isSaving);

    // Validate effect when editor changes
    $effect(() => {
        if (editorValue) {
            validateEffect(editorValue);
        }
    });

    async function validateEffect(source: string) {
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }

        isValidating = true;
        validationError = null;

        validationTimeout = setTimeout(async () => {
            try {
                const EffectClass = await loadEffect(source);
                if (!EffectClass) {
                    validationError = 'No default export found. Effect must use "export default class"';
                    isValidating = false;
                    return;
                }

                // Try to instantiate and check required methods
                const instance = new EffectClass();

                if (!instance.info) {
                    validationError = 'Effect must have an info property';
                } else if (!instance.info.name) {
                    validationError = 'Effect info must have a name';
                } else if (typeof instance.tick !== 'function') {
                    validationError = 'Effect must have a tick() method';
                } else {
                    // Initialize and run tick 400 times to check for runtime errors
                    try {
                        instance.init(60); // Initialize with 60 LEDs
                        for (let i = 0; i < 400; i++) {
                            instance.tick(i, 16.67); // ~60fps deltaTime
                        }
                        instance.dispose();
                        validationError = null;

                        // Capture params from validated effect
                        const newParams: ParamSchema[] = instance.info.params ?? [];
                        validatedParams = newParams;

                        // Initialize defaults for any new params
                        const updatedPreviewParams = { ...previewParams };
                        for (const param of newParams) {
                            if (!(param.name in updatedPreviewParams)) {
                                updatedPreviewParams[param.name] = param.default;
                            }
                        }
                        previewParams = updatedPreviewParams;
                    } catch (tickErr) {
                        validationError = `tick() error: ${tickErr instanceof Error ? tickErr.message : 'Unknown error'}`;
                    }
                }
            } catch (err) {
                validationError = err instanceof Error ? err.message : 'Invalid effect code';
            }
            isValidating = false;
        }, 500);
    }

    async function handleSave() {
        if (!canSave) return;

        isSaving = true;
        saveError = null;

        try {
            const result = await api.saveEffect(effectName, editorValue);
            if (result.ok) {
                savedValue = editorValue;
                // Refresh the effects list
                await ledStore.refresh();
            } else {
                saveError = result.error ?? 'Failed to save effect';
            }
        } catch (err) {
            saveError = err instanceof Error ? err.message : 'Failed to save effect';
        }

        isSaving = false;
    }

    // Preview state
    let previewParams: EffectParams = $state({});

    // Initialize params from effect defaults (only on first load)
    let paramsInitialized = false;
    $effect(() => {
        if (!paramsInitialized && displayParams.length > 0) {
            paramsInitialized = true;
            const defaults: EffectParams = {};
            for (const param of displayParams) {
                defaults[param.name] = param.default;
            }
            previewParams = defaults;
        }
    });

    function handleParamChange(name: string, value: unknown) {
        previewParams = { ...previewParams, [name]: value };
    }

    // Helper to parse response and extract code/summary
    function parseStreamedResponse(response: string): { code: string; changeSummary: string } {
        const summaryMatch = response.match(/\/\/\s*CHANGESUMMARY:\s*(.+)$/m);
        const changeSummary = summaryMatch ? summaryMatch[1].trim() : 'Changes applied';
        const code = response.replace(/\/\/\s*CHANGESUMMARY:.+$/m, '').trim();
        return { code, changeSummary };
    }

    // Get preview of code (last ~10 lines)
    function getCodePreview(code: string): string {
        const lines = code.split('\n');
        if (lines.length <= 10) return code;
        return '...\n' + lines.slice(-10).join('\n');
    }

    // Stream AI response with live chat message update
    async function streamAiRequest(requestBody: object): Promise<{ code: string; changeSummary: string } | null> {
        // Add streaming message
        const streamingMsgIndex = messages.length;
        messages = [...messages, { type: 'ai-streaming', content: 'Generating code...' }];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...requestBody, stream: true })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error ?? 'Failed to get AI response');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chunk) {
                                fullResponse += data.chunk;
                                // Update the streaming message with preview
                                const preview = getCodePreview(fullResponse);
                                messages[streamingMsgIndex] = { type: 'ai-streaming', content: preview };
                                messages = [...messages]; // Trigger reactivity
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete chunks
                            if (e instanceof SyntaxError) continue;
                            throw e;
                        }
                    }
                }
            }

            // Remove the streaming message (will be replaced with final result)
            messages = messages.filter((_, i) => i !== streamingMsgIndex);
            return parseStreamedResponse(fullResponse);
        } catch (err) {
            // Remove the streaming message on error
            messages = messages.filter((_, i) => i !== streamingMsgIndex);
            throw err;
        }
    }

    // AI Chat functions
    async function sendChatMessage() {
        if (!chatInput.trim() || isAiLoading) return;

        const userMessage = chatInput.trim();
        chatInput = '';

        // Add user message
        messages = [...messages, { type: 'user', content: userMessage }];
        isAiLoading = true;

        try {
            const result = await streamAiRequest({
                type: 'generate-effect',
                sourceCode: editorValue,
                userMessage
            });

            if (result) {
                // Add AI response with change summary
                messages = [...messages, { type: 'ai', content: result.changeSummary }];

                // Update source code
                editorValue = result.code;

                // Mark that we're waiting for validation to complete
                pendingAiValidation = true;
            }
        } catch (err) {
            messages = [...messages, { type: 'ai', content: `Error: ${err instanceof Error ? err.message : 'Failed to get AI response'}` }];
        }

        isAiLoading = false;
    }

    async function fixWithAi(error: string) {
        if (isAiLoading) return;

        isAiLoading = true;

        // Build chat context from recent messages
        const chatContext = messages
            .slice(-5)
            .map((m) => {
                if (m.type === 'user') return `User: ${m.content}`;
                if (m.type === 'ai') return `AI: ${m.content}`;
                if (m.type === 'validation-error') return `Error: ${m.error}`;
                return '';
            })
            .filter(Boolean)
            .join('\n');

        try {
            const result = await streamAiRequest({
                type: 'fix-problems',
                sourceCode: editorValue,
                errorMessage: error,
                chatContext
            });

            if (result) {
                messages = [...messages, { type: 'ai', content: result.changeSummary }];
                editorValue = result.code;
                pendingAiValidation = true;
            }
        } catch (err) {
            messages = [...messages, { type: 'ai', content: `Error: ${err instanceof Error ? err.message : 'Failed to fix'}` }];
        }

        isAiLoading = false;
    }

    // Watch for validation completion after AI edit
    $effect(() => {
        if (pendingAiValidation && !isValidating) {
            pendingAiValidation = false;
            if (validationError) {
                messages = [...messages, { type: 'validation-error', error: validationError }];
            } else {
                messages = [...messages, { type: 'success', message: 'Code updated successfully!' }];
            }
        }
    });
</script>

{#if !effectData}
    <div class="max-w-6xl mx-auto h-[calc(100vh-160px)] flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-surface-100 mb-2">Effect Not Found</h1>
            <p class="text-surface-400 mb-4">No effect named "{effectName}" was found.</p>
            <a href="/" class="btn variant-filled-primary">Back to Control</a>
        </div>
    </div>
{:else}
    <div class="max-w-6xl mx-auto flex flex-col gap-4 min-w-[800px] pb-8">
        <!-- Header with back link -->
        <div class="flex items-center gap-4">
            <a href="/" class="text-surface-400 hover:text-surface-200 transition-colors">&larr; Back</a>
            <h1 class="text-xl font-bold text-surface-100">{effectData.label}</h1>
            <span class="text-sm text-surface-500 font-mono">{effectName}.js</span>
        </div>

        <!-- Preview -->
        <div class="card overflow-visible">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-lg font-semibold text-surface-100">Preview</h2>
                <span class="text-xs text-surface-500">Changes are previewed live</span>
            </div>
            <div class="flex justify-center">
                <div class="relative w-full max-w-[400px] max-h-[200px] aspect-[2/1] rounded-xl overflow-visible">
                    {#if editorValue}
                        <EffectPreview
                            source={editorValue}
                            params={previewParams}
                            ledThicknessH={5}
                            ledThicknessV={6}
                        />
                    {/if}
                </div>
            </div>

            <!-- Preview Controls -->
            <div class="mt-4">
                <ParamControls params={displayParams} values={previewParams} onchange={handleParamChange} />
            </div>
        </div>

        <!-- Tab Selector -->
        <div class="w-fit">
            <SegmentedControl
                value={activeTab}
                onValueChange={(e) => (activeTab = e.value ?? 'ai')}
            >
                <SegmentedControl.Control>
                    <SegmentedControl.Indicator />
                    <SegmentedControl.Item value="ai">
                        <SegmentedControl.ItemText>✨ AI Assistant</SegmentedControl.ItemText>
                        <SegmentedControl.ItemHiddenInput />
                    </SegmentedControl.Item>
                    <SegmentedControl.Item value="code">
                        <SegmentedControl.ItemText>📝 Source Code</SegmentedControl.ItemText>
                        <SegmentedControl.ItemHiddenInput />
                    </SegmentedControl.Item>
                </SegmentedControl.Control>
            </SegmentedControl>
        </div>

        <!-- AI Chat Tab -->
        {#if activeTab === 'ai'}
            <div class="card flex flex-col min-h-[400px]">
                <!-- Messages -->
                <div class="flex-1 space-y-4 mb-4">
                    {#each messages as message}
                        {#if message.type === 'effect-info' && effectData}
                            <EffectInfoMessage effect={effectData} />
                        {:else if message.type === 'user'}
                            <UserMessage content={message.content} />
                        {:else if message.type === 'ai'}
                            <AiMessage content={message.content} />
                        {:else if message.type === 'ai-streaming'}
                            <AiStreamingMessage content={message.content} />
                        {:else if message.type === 'validation-error'}
                            <ValidationMessage
                                error={message.error}
                                onFixWithAi={() => fixWithAi(message.error)}
                            />
                        {:else if message.type === 'success'}
                            <SuccessMessage message={message.message} />
                        {/if}
                    {/each}
                </div>

                <!-- Chat Input -->
                <div class="flex-shrink-0 border-t border-surface-700 pt-4">
                    <div class="flex gap-3">
                        <input
                            type="text"
                            bind:value={chatInput}
                            placeholder="✨ Use AI to edit the LED effect..."
                            onkeydown={(e) => e.key === 'Enter' && sendChatMessage()}
                            disabled={isAiLoading}
                            class="flex-1 px-4 py-3 rounded-xl bg-surface-700/50 border border-surface-600 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onclick={sendChatMessage}
                            disabled={!chatInput.trim() || isAiLoading}
                            class="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                                {chatInput.trim() && !isAiLoading
                                    ? 'bg-primary-500 hover:bg-primary-600 text-white cursor-pointer'
                                    : 'bg-surface-700 text-surface-500 cursor-not-allowed'}"
                        >
                            {#if isAiLoading}
                                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            {:else}
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Source Code Tab -->
        {#if activeTab === 'code'}
            <div class="flex flex-col gap-3 min-w-[800px]">
                <!-- Monaco Editor as card -->
                <div class="rounded-xl overflow-hidden border border-surface-700 bg-surface-800 h-[500px]">
                    {#if CodeEditor}
                        <CodeEditor bind:value={editorValue} />
                    {:else}
                        <div class="flex items-center justify-center h-full text-surface-400">
                            <svg class="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading editor...
                        </div>
                    {/if}
                </div>

                <!-- Validation Error Alert (only in source code view) -->
                {#if validationError || saveError}
                    {@const error = validationError || saveError}
                    {@const errorType = validationError ? 'Validation Error' : 'Save Error'}
                    <div class="alert alert-error">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-sm">{errorType}</h4>
                                <pre class="mt-1 text-sm whitespace-pre-wrap wrap-break-word font-mono opacity-80 max-h-32 overflow-auto">{error}</pre>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Save Bar (always visible) -->
        <div class="flex items-center justify-between gap-4">
            <!-- Status message -->
            <div class="flex items-center gap-2 text-sm">
                {#if isValidating}
                    <svg class="w-4 h-4 animate-spin text-surface-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-surface-400">Validating...</span>
                {:else if validationError}
                    <svg class="w-4 h-4 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-error-400">Validation error</span>
                {:else if saveError}
                    <svg class="w-4 h-4 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span class="text-error-400">Save failed</span>
                {:else if hasChanges}
                    <svg class="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
                    </svg>
                    <span class="text-warning-400">Unsaved changes</span>
                {:else}
                    <svg class="w-4 h-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-success-400">All changes saved</span>
                {/if}
            </div>

            <!-- Save button -->
            <button
                type="button"
                onclick={handleSave}
                disabled={!canSave}
                class="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shrink-0
                    {canSave
                        ? 'bg-primary-500 hover:bg-primary-600 text-white cursor-pointer'
                        : 'bg-surface-700 text-surface-500 cursor-not-allowed'}"
            >
                {#if isSaving}
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                {/if}
            </button>
        </div>
    </div>
{/if}

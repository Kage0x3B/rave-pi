import { BaseEffect, type Effect } from '@ravepi/shared-types';

// Re-export for convenience
export { BaseEffect };

/** Constructor type for Effect implementations */
export type EffectConstructor = new () => Effect;

// Register globally for dynamically loaded effects
if (typeof window !== 'undefined') {
    (window as unknown as { __effectRuntime: { BaseEffect: typeof BaseEffect } }).__effectRuntime = {
        BaseEffect
    };
}

/**
 * Load an effect class from JavaScript source code string.
 * Rewrites imports to use the global runtime and dynamically imports via blob URL.
 */
export async function loadEffect(source: string): Promise<EffectConstructor | null> {
    // Rewrite imports to use global runtime
    const rewritten = source
        // Replace import { BaseEffect } from '../effect-types.js'
        .replace(
            /import\s*\{[^}]*\}\s*from\s*['"][^'"]*effect-types[^'"]*['"]\s*;?/g,
            'const { BaseEffect } = window.__effectRuntime;'
        )
        // Remove type-only imports (they don't exist at runtime)
        .replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]\s*;?/g, '');

    const blob = new Blob([rewritten], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    try {
        const module = await import(/* @vite-ignore */ blobUrl);
        return module.default;
    } finally {
        URL.revokeObjectURL(blobUrl);
    }
}

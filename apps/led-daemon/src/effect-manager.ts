import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { EffectInfo, EffectParams, EffectWithSource } from '@ravepi/shared-types';
import type { Effect } from './effect-types.js';

/** Stored effect with its source code */
interface LoadedEffect {
    effect: Effect;
    source: string;
    isBuiltin: boolean;
}

/**
 * Effect manager - handles dynamic effect loading and switching.
 */
export class EffectManager {
    private effects: Map<string, LoadedEffect> = new Map();
    private currentEffect: Effect | null = null;
    private ledCount: number;

    private constructor(ledCount: number) {
        this.ledCount = ledCount;
    }

    /**
     * Factory method - creates an EffectManager and loads all effects.
     */
    static async create(ledCount: number): Promise<EffectManager> {
        const manager = new EffectManager(ledCount);
        await manager.reload();
        return manager;
    }

    /**
     * Reload all effects from inbuilt and custom directories.
     * Can be called at runtime to hot-reload custom effects.
     */
    async reload(): Promise<void> {
        // Dispose current effect if any
        if (this.currentEffect) {
            this.currentEffect.dispose();
            this.currentEffect = null;
        }

        // Clear existing effects
        this.effects.clear();

        // Get the project root directory (apps/led-daemon/)
        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const projectRoot = currentDir.endsWith('dist') ? path.join(currentDir, '..') : path.join(currentDir, '..'); // src/ -> apps/led-daemon/

        // Load inbuilt effects from dist/inbuilt-effects/ (always use compiled JS)
        const inbuiltDir = path.join(projectRoot, 'dist', 'inbuilt-effects');
        await this.loadEffectsFromDir(inbuiltDir, true, ['types.js', 'index.js']);

        // Load custom effects from custom-effects/
        const customDir = path.join(projectRoot, 'custom-effects');
        await this.ensureDir(customDir);
        await this.loadEffectsFromDir(customDir, false);

        console.log(`[Effects] Loaded ${this.effects.size} effects`);
    }

    /**
     * Ensure a directory exists, creating it if necessary.
     */
    private async ensureDir(dir: string): Promise<void> {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch {
            // Directory likely already exists
        }
    }

    /**
     * Load all .js effect files from a directory.
     */
    private async loadEffectsFromDir(dir: string, isBuiltin: boolean, exclude: string[] = []): Promise<void> {
        let files: string[];
        try {
            files = await fs.readdir(dir);
        } catch {
            // Directory doesn't exist or can't be read
            return;
        }

        for (const file of files) {
            if (!file.endsWith('.js') || exclude.includes(file)) continue;

            const filePath = path.join(dir, file);

            try {
                // Read the source code
                const source = await fs.readFile(filePath, 'utf-8');

                // Use cache-busting query for reload support
                const fileUrl = `file://${filePath}?t=${Date.now()}`;
                const module = await import(fileUrl);
                const EffectClass = module.default;

                if (EffectClass?.prototype?.tick) {
                    const instance: Effect = new EffectClass();
                    this.effects.set(instance.info.name, { effect: instance, source, isBuiltin });
                    console.log(`[Effects] Loaded: ${instance.info.name} (${file})${isBuiltin ? ' [builtin]' : ''}`);
                }
            } catch (err) {
                console.error(`[Effects] Failed to load ${file}:`, err);
            }
        }
    }

    /** Get list of all available effects with their info */
    getEffects(): EffectInfo[] {
        return Array.from(this.effects.values()).map((e) => e.effect.info);
    }

    /** Get list of all available effects with their info and source code */
    getEffectsWithSource(): EffectWithSource[] {
        return Array.from(this.effects.values()).map((e) => ({
            ...e.effect.info,
            source: e.source,
            isBuiltin: e.isBuiltin
        }));
    }

    /** Get a specific effect by name */
    getEffect(name: string): Effect | undefined {
        return this.effects.get(name)?.effect;
    }

    /** Set the active effect */
    setEffect(name: string, params?: EffectParams): boolean {
        const loaded = this.effects.get(name);
        if (!loaded) {
            console.warn(`[Effects] Unknown effect: ${name}`);
            return false;
        }

        // Dispose current effect
        if (this.currentEffect) {
            this.currentEffect.dispose();
        }

        // Initialize new effect
        this.currentEffect = loaded.effect;
        this.currentEffect.init(this.ledCount, params);

        console.log(`[Effects] Activated: ${name}`);
        return true;
    }

    /** Update current effect parameters */
    setParams(params: EffectParams): void {
        if (this.currentEffect) {
            this.currentEffect.setParams(params);
        }
    }

    /** Sanitize params to only include those defined in the effect's schema */
    sanitizeParams(effectName: string, params: EffectParams): EffectParams {
        const effect = this.effects.get(effectName)?.effect;
        if (!effect?.info.params) {
            return {};
        }

        const validParamNames = new Set(effect.info.params.map((p) => p.name));
        const sanitized: EffectParams = {};

        for (const [key, value] of Object.entries(params)) {
            if (validParamNames.has(key)) {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /** Get default params for an effect */
    getDefaultParams(effectName: string): EffectParams {
        const effect = this.effects.get(effectName)?.effect;
        if (!effect?.info.params) {
            return {};
        }

        const defaults: EffectParams = {};
        for (const param of effect.info.params) {
            defaults[param.name] = param.default;
        }
        return defaults;
    }

    /** Get current effect */
    getCurrent(): Effect | null {
        return this.currentEffect;
    }

    /** Get current effect name */
    getCurrentName(): string {
        if (!this.currentEffect) return 'none';
        return this.currentEffect.info.name;
    }

    /**
     * Save an effect's source code and reload it.
     * Only saves to custom-effects/ directory. Builtin effects cannot be modified.
     * Returns the loaded effect info if successful, or throws an error.
     */
    async saveEffect(name: string, source: string): Promise<EffectWithSource> {
        // Check if this is a builtin effect
        const existing = this.effects.get(name);
        if (existing?.isBuiltin) {
            throw new Error('Cannot modify builtin effects');
        }

        // Get the project root directory
        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const projectRoot = currentDir.endsWith('dist') ? path.join(currentDir, '..') : path.join(currentDir, '..');

        // Always save to custom-effects directory
        const targetPath = path.join(projectRoot, 'custom-effects', `${name}.js`);
        await this.ensureDir(path.dirname(targetPath));

        // Write the source file
        await fs.writeFile(targetPath, source, 'utf-8');

        // Try to load and validate the effect
        try {
            const fileUrl = `file://${targetPath}?t=${Date.now()}`;
            const module = await import(fileUrl);
            const EffectClass = module.default;

            if (!EffectClass?.prototype?.tick) {
                // Remove the invalid file
                await fs.unlink(targetPath).catch(() => {});
                throw new Error('Effect must have a tick() method');
            }

            // Create instance to validate and get info
            const instance: Effect = new EffectClass();

            if (!instance.info?.name) {
                await fs.unlink(targetPath).catch(() => {});
                throw new Error('Effect must have an info.name property');
            }

            // Update the effects map (saved effects are never builtin)
            this.effects.set(instance.info.name, { effect: instance, source, isBuiltin: false });

            console.log(`[Effects] Saved: ${instance.info.name} -> ${targetPath}`);

            return {
                ...instance.info,
                source,
                isBuiltin: false
            };
        } catch (err) {
            // If loading failed, try to restore from memory or remove file
            const existing = this.effects.get(name);
            if (existing) {
                // Restore the old source
                await fs.writeFile(targetPath, existing.source, 'utf-8');
            } else {
                // Remove the invalid file
                await fs.unlink(targetPath).catch(() => {});
            }
            throw err;
        }
    }
}

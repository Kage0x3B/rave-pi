import baseConfig from './index.js';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
    ...baseConfig,
    ...sveltePlugin.configs['flat/recommended'],
    ...sveltePlugin.configs['flat/prettier'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
];

import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react({
            jsxRuntime: 'automatic',
        }),
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: false,
        https: false,
        hmr: {
            host: 'localhost',
            protocol: 'ws',
            port: 5173,
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});

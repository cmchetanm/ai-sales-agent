import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/components/**', 'src/hooks/**', 'src/utils/**'],
      exclude: [
        'src/pages/**',
        'src/theme.tsx', 'src/App.tsx', 'src/main.tsx',
        'src/components/Layout*.tsx', 'src/components/NavBar.tsx',
        'src/components/CreateLeadDialog.tsx',
        'src/api/client.ts'
      ],
      thresholds: { lines: 80, statements: 80, functions: 55, branches: 60 }
    }
  }
});

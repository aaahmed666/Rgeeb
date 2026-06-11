import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    // Only the Vitest-based suites — the rest of __tests__ runs under Jest.
    include: [
      '__tests__/lib/api.test.ts',
      '__tests__/lib/auth.test.tsx',
      '__tests__/lib/error-handling.test.ts',
      '__tests__/services/chat-settings.test.ts',
      '__tests__/services/notification-settings.test.ts',
      '__tests__/integration/auth-flow.integration.test.tsx',
    ],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

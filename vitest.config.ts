/**
 * Vitest configuration for Coastal Corridor
 *
 * Uses vite-tsconfig-paths to resolve @/ path aliases defined in tsconfig.json.
 * Tests run in the Node.js environment (not jsdom) because the security-critical
 * code under test (HMAC, idempotency, Paystack) is server-side only.
 *
 * Coverage: V8 provider, targeting src/lib and src/app/api/webhooks only.
 */
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/lib/__tests__/**/*.test.ts',
      'src/app/api/**/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/hmac.ts',
        'src/lib/idempotency.ts',
        'src/lib/paystack.ts',
        'src/app/api/v1/channel/webhooks/inbound/route.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});

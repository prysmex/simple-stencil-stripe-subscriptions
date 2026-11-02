import { defineVitestConfig } from '@stencil/vitest/config';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        // plain node: utils and server-side rendering through the hydrate build
        test: {
          name: 'unit',
          include: ['src/**/*.unit.ts', 'test/**/*.unit.ts'],
          environment: 'node',
        },
      },
      {
        // components rendered in Stencil's mock DOM, against the built dist output
        test: {
          name: 'spec',
          include: ['src/**/*.spec.{ts,tsx}'],
          environment: 'stencil',
          setupFiles: ['./vitest-setup.ts'],
        },
      },
    ],
  },
});

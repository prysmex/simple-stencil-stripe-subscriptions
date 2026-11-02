import { Config } from '@stencil/core';
import { readFileSync } from 'node:fs';
import tailwindPlugin, { tailwindHMR } from 'stencil-tailwind-plugin';

// @stencil/vitest loads this file through jiti, whose CJS interop nests the plugin's default export
let tailwind: any = tailwindPlugin;
while (typeof tailwind !== 'function' && tailwind?.default) {
  tailwind = tailwind.default;
}

const tailwindCss = readFileSync('./src/global/tailwind.css', 'utf8');
const opts = {
  // Only pricing-table's stylesheet gets Tailwind: the cards and the input render inside its shadow root (they are
  // scoped components), so they share it instead of each carrying its own copy. Stylesheets arrive as
  // `pricing-table.css?tag=…`. The .tsx files get none, or the plugin would copy them into every component that
  // imports from pricing-table.tsx (the cards do, for its types).
  injectTailwindConfiguration: (filename: string) => (/[\\/]pricing-table\.css(\?|$)/.test(filename) ? tailwindCss : ''),
};

export const config: Config = {
  namespace: 'simple-stencil-stripe-subscriptions',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      // self-defining components with the runtime bundled in: `import 'simple-stencil-stripe-subscriptions/dist/components'`
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      // Server-side rendering / prerendering: `import { renderToString } from 'simple-stencil-stripe-subscriptions/hydrate'`
      type: 'dist-hydrate-script',
      dir: 'hydrate',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'docs-vscode',
      file: 'vscode-data.json',
    },
  ],

  plugins: [tailwind(opts), tailwindHMR(opts)],
};

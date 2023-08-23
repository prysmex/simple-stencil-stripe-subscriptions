import { Config } from '@stencil/core';
import tailwind, { TailwindConfig, tailwindHMR } from 'stencil-tailwind-plugin';

const twConfigurationFn = (filename: string, config: TailwindConfig): TailwindConfig => {
  return {
    ...config,
    theme: {
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
        '4xs': '0.375rem',
      }
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  };
};

const opts = {
  tailwindConf: twConfigurationFn,
};

export const config: Config = {
  namespace: 'simple-stencil-stripe-subscriptions',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'www',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'docs-vscode',
      file: 'vscode-data.json',
    },
  ],

  plugins: [tailwind(opts), tailwindHMR()],
};

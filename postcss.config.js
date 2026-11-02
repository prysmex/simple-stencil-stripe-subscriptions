// Runs after Tailwind (see stencil-tailwind-plugin's postcss handling).
//
// Tailwind v4 initialises its `--tw-*` variables with `@property`, which browsers
// ignore inside shadow roots. Tailwind ships a fallback that sets them on `*`, but
// gates it behind an `@supports` query that only matches older Safari/Firefox.
// Unwrap that query so rings, shadows, borders etc. work in every browser.
const unwrapPropertiesFallback = () => ({
  postcssPlugin: 'unwrap-tailwind-properties-fallback',
  AtRule: {
    layer(atRule) {
      if (atRule.params !== 'properties') return;
      atRule.each(node => {
        if (node.type === 'atrule' && node.name === 'supports') {
          node.replaceWith(node.nodes);
        }
      });
    },
  },
});
unwrapPropertiesFallback.postcss = true;

module.exports = {
  plugins: [unwrapPropertiesFallback],
};

// Shows another environment's plans on the pricing pages (inlined into the second embed by build.mjs).
// The app's non-production builds link here with ?host=<their API>&origin=<their app>, and their Stripe prices have
// other ids than the production ones baked into the page. The table stays hidden until it has them, so it never shows
// or sends a production price there.
// __PAGE_DATA__ and __PAGE__ are filled in at build time.
(function () {
  var host = new URL(window.location.href).searchParams.get('host');
  if (!host) return;

  var table = document.querySelector('pricing-table');
  var pageData = __PAGE_DATA__;
  var page = __PAGE__;
  table.style.visibility = 'hidden';

  var plans = fetch(host + '/api/billing/plans').then(function (response) {
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  });
  Promise.all([plans, customElements.whenDefined('pricing-table')])
    .then(function (results) {
      return table.componentOnReady().then(function () {
        var data = pageData(results[0].products.data, results[0].prices.data, page);
        table.prices = data.prices;
        table.products = data.products;
        table.extraProducts = data.extraProducts;
        table.style.visibility = '';
      });
    })
    .catch(function (error) {
      console.error('Could not load the plans from ' + host, error);
    });
})();
